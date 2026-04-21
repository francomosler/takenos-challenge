# Architecture

## Stack

- **Runtime**: Node.js ≥ 22, TypeScript
- **Framework HTTP**: Express 4
- **ORM**: Prisma 7 + `@prisma/adapter-better-sqlite3`
- **DB**: SQLite (dev) — fácilmente reemplazable por Postgres vía el adapter correspondiente
- **DI**: InversifyJS
- **Validación**: Zod (capa de presentación)
- **Tests**: Vitest (unit), Mocha + chai-http (integración)
- **Docs**: OpenAPI 3.0.3 (`docs/openapi.yaml`) servido con Swagger UI en `/docs`

## Organización por Bounded Contexts (DDD-lite)

Cada dominio vive en `src/contexts/<context>/` y respeta el layering clásico:

```
domain/           <- entidades, value objects, repositorios (interfaces) y excepciones
application/      <- casos de uso / servicios de aplicación (puros, sin I/O)
infrastructure/   <- adaptadores (Prisma, seeds)
presentation/     <- routers Express + DTOs Zod
```

Los contextos actuales son:

- **draw** — crear/consultar/eliminar el sorteo, estadísticas.
- **matches** — búsqueda y detalle de partidos.
- **teams** — listado y detalle de equipos.

Los componentes transversales están en `src/shared/`:
- `container/` — contenedor Inversify y tokens.
- `infrastructure/` — inicialización de Prisma, registro de rutas, base `PrismaRepository`.
- `domain/` — primitivas compartidas (`AggregateRoot`, `ValueObject`).

## Dependencias entre capas

```mermaid
flowchart LR
    subgraph Presentation
        R[Routers Express] --> D[DTOs Zod]
    end
    subgraph Application
        S[Services / Use Cases]
    end
    subgraph Domain
        E[Entities / Value Objects]
        I[Repository Interfaces]
        X[Exceptions]
    end
    subgraph Infrastructure
        P[Prisma Repositories]
    end

    R --> S
    S --> I
    S --> E
    S --> X
    P -- implements --> I
    P --> Prisma[(Prisma Client)]
```

Reglas:

- **Domain** no depende de nada externo. Sólo TypeScript puro.
- **Application** depende de interfaces del dominio — nunca de Prisma ni Express.
- **Infrastructure** implementa interfaces del dominio (adapter pattern).
- **Presentation** convierte HTTP ↔ comandos/queries de aplicación. Usa Zod para validar input y mapea errores a status HTTP.

El acoplamiento a Prisma queda aislado en `*/infrastructure/prisma-*.repository.ts`. Swappear la DB es cambiar el adapter de Prisma y, si fuera necesario, rehacer las implementaciones de repositorio.

## Diagrama de componentes

```mermaid
flowchart TB
    Client[Cliente HTTP]
    Client -->|HTTP JSON| App[Express app.ts]
    App --> Routes[shared/infrastructure/routes.ts]

    Routes --> DrawR[draw.router]
    Routes --> MatchesR[matches.router]
    Routes --> TeamsR[teams.router]
    Routes --> SwaggerUI[/docs Swagger UI/]
    Routes --> Health[/health/]

    DrawR --> CreateDraw[CreateDrawService]
    DrawR --> GetDraw[SearchCurrentDrawService]
    DrawR --> Stats[SearchDrawStatisticsService]

    MatchesR --> SearchMatches[SearchMatchesService]
    MatchesR --> MatchById[SearchMatchByIdService]

    TeamsR --> SearchTeams[SearchTeamsService]
    TeamsR --> TeamById[SearchTeamByIdService]

    CreateDraw --> DrawAssigner[DrawService / PotAssigner]
    CreateDraw --> DrawRepo[(PrismaDrawRepository)]
    GetDraw --> DrawRepo
    Stats --> DrawRepo

    SearchMatches --> MatchRepo[(PrismaMatchRepository)]
    MatchById --> MatchRepo
    TeamById --> MatchRepo

    SearchTeams --> TeamRepo[(PrismaTeamRepository)]
    TeamById --> TeamRepo

    DrawRepo --> DB[(SQLite via Prisma)]
    MatchRepo --> DB
    TeamRepo --> DB
```

## Flujo: POST /draw

```mermaid
sequenceDiagram
    participant C as Cliente
    participant R as draw.router
    participant S as CreateDrawService
    participant DR as DrawRepository
    participant DA as DrawService (domain)
    participant DB as SQLite

    C->>R: POST /draw
    R->>S: run()
    S->>DR: searchCurrent()
    DR->>DB: SELECT draw
    DB-->>DR: null | Draw
    alt Draw existente
        DR-->>S: Draw
        S-->>R: throws DrawAlreadyExistsError
        R-->>C: 409 Conflict
    else No hay draw
        DR-->>S: null
        S->>DR: findAllTeams()
        DR->>DB: SELECT teams
        DB-->>DR: Team[]
        DR-->>S: Team[]
        S->>DA: Draw.create(teams, pots)<br/>DrawService.generateMatches(...)
        DA-->>S: Match[]
        S->>DR: save(draw)
        DR->>DB: INSERT transactional
        DB-->>DR: ok
        DR-->>S: ok
        S-->>R: ok
        R-->>C: 201 Created
    end
```

## Flujo: GET /matches (con filtros y ordenamiento)

```mermaid
sequenceDiagram
    participant C as Cliente
    participant R as matches.router
    participant Z as SearchMatchesQuerySchema (Zod)
    participant S as SearchMatchesService
    participant MR as MatchRepository
    participant DB as SQLite

    C->>R: GET /matches?teamId=X&matchDayFrom=Y&sortBy=Z
    R->>Z: parse(query)
    alt Parseo falla
        Z-->>R: ZodError
        R-->>C: 400 Bad Request
    else OK
        Z-->>R: SearchMatchesQuery
        R->>S: run(params)
        S->>MR: findAll(filters, pagination, sort?)
        MR->>DB: SELECT matches WHERE ... ORDER BY ... LIMIT/OFFSET
        DB-->>MR: rows
        MR-->>S: PaginatedMatches
        S-->>R: SearchMatchesResult
        R-->>C: 200 OK { matches, pagination }
    end
```

## Modelo de datos

```mermaid
erDiagram
    Country ||--o{ Team : "has"
    Team ||--o{ DrawTeamPot : "assigned to"
    Team ||--o{ Match : "plays as home"
    Team ||--o{ Match : "plays as away"
    Draw ||--o{ DrawTeamPot : "includes"
    Draw ||--o{ Match : "generates"
    Pot  ||--o{ DrawTeamPot : "groups"

    Country {
        int id PK
        string name
    }
    Team {
        int id PK
        string name
        int countryId FK
    }
    Draw {
        int id PK
        datetime createdAt
    }
    Pot {
        int id PK
        string name
    }
    DrawTeamPot {
        int drawId FK
        int teamId FK
        int potId FK
    }
    Match {
        int id PK
        int drawId FK
        int homeTeamId FK
        int awayTeamId FK
        int matchDay
    }
```

## Decisiones de diseño relevantes

- **Aggregate boundary en `Draw`**: `Draw` es el root agregado para el sorteo. `Match` vive dentro del sorteo desde el punto de vista de escritura; desde el punto de vista de lectura tiene su propio `MatchEntity` en el contexto `matches` (CQRS-lite: escritura y lectura optimizadas por contexto).
- **Teams como contexto propio**: aunque `draw/domain/team.ts` ya tiene un `Team` (value object interno al sorteo), se creó un `teams` context separado con su propia `TeamEntity`/repo para exponer el endpoint público `GET /teams`. Evita acoplar el dominio público de equipos al dominio interno del sorteo.
- **Validación en dos capas**: Zod en presentación (input HTTP) + guards en los services (invariantes de negocio: `page >= 1`, `id positivo`, etc).
- **Manejo de errores**: excepciones tipadas (`DrawAlreadyExistsError`, `MatchNotFoundError`, `TeamNotFoundError`) traducidas a status HTTP en los routers. No se expone la stack ni el tipo al cliente.
- **DI con Inversify**: facilita testear con mocks (los unit tests instancian el servicio con repos falsos) y permite agregar servicios sin modificar el sitio de uso.
- **Prisma con adapter SQLite**: `better-sqlite3` para dev; cambiar a Postgres es cambiar el adapter en `prisma/lib/prisma.ts` + proveer `DATABASE_URL`.

## Extensibilidad

Agregar un contexto nuevo (p. ej. `coaches`) requiere:

1. Crear `src/contexts/coaches/{domain,application,infrastructure,presentation}/`.
2. Registrar bindings en `src/shared/container/container.ts` + `types.ts`.
3. Registrar router en `src/shared/infrastructure/routes.ts`.
4. Documentar los endpoints en `docs/openapi.yaml`.

Nada en los demás contextos necesita cambiar.
