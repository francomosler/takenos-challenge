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
    DR->>DB: SELECT draw WHERE activeSingleton = 1
    DB-->>DR: null | Draw
    alt Draw existente (chequeo aplicativo)
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
        DR->>DB: INSERT transactional<br/>(activeSingleton = 1)
        alt Otro request concurrente ya insertó el activo
            DB-->>DR: P2002 (UNIQUE activeSingleton)
            DR-->>S: throws DrawAlreadyExistsError
            S-->>R: throws DrawAlreadyExistsError
            R-->>C: 409 Conflict
        else OK
            DB-->>DR: ok
            DR-->>S: ok
            S-->>R: ok
            R-->>C: 201 Created
        end
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
        int activeSingleton UK "1 si activo, NULL si archivado"
        datetime archivedAt "NULL si activo"
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

## Concurrencia

El único endpoint que mutaba estado crítico era `POST /draw`, y tenía dos problemas.

El primero era un TOCTOU clásico: el service hacía `searchCurrent()` y, si daba `null`, llamaba a `save()`. Dos requests en simultáneo podían pasar ambas por el `null` y terminar con dos draws activos. Lo resolví moviendo la garantía a la DB: agregué `activeSingleton Int? @unique` y `archivedAt DateTime?` en `Draw`. El draw vivo tiene `activeSingleton = 1`; al archivarse se pone en `NULL` (SQLite/Postgres/MySQL permiten múltiples `NULL` en un `UNIQUE`, así que los archivados no compiten por la slot). En `PrismaDrawRepository.save()` atrapo el `P2002` de Prisma y lo traduzco a `DrawAlreadyExistsError`, que el router devuelve como `409`. El chequeo con `searchCurrent()` antes del save sigue ahí, pero ahora es solo un fast-path para evitar trabajo en el caso común; la correctitud la garantiza el unique.

Aproveché para renombrar `deleteAll()` a `archiveCurrent()` y cambiarlo a soft-archive: en vez de borrar, setea `activeSingleton = NULL` y `archivedAt = NOW()`. Los pots y matches viejos quedan en la DB, útiles para auditoría.

El segundo problema era que `searchCurrent()` hacía tres queries separadas (`draw`, luego `teams`, luego `matches`) y armaba el agregado en memoria. Si alguien escribía en el medio, podías ver un `Draw` con matches de otro snapshot. Lo colapsé a un solo `findFirst` con `include` anidado en `drawTeamPots.team.country` y `matches.{homeTeam,awayTeam}.country`, que Prisma resuelve contra un snapshot consistente. De paso le puse `orderBy: { id: "asc" }` a los matches para que el orden sea determinista entre llamadas.

## Extensibilidad

Agregar un contexto nuevo (p. ej. `coaches`) requiere:

1. Crear `src/contexts/coaches/{domain,application,infrastructure,presentation}/`.
2. Registrar bindings en `src/shared/container/container.ts` + `types.ts`.
3. Registrar router en `src/shared/infrastructure/routes.ts`.
4. Documentar los endpoints en `docs/openapi.yaml`.

Nada en los demás contextos necesita cambiar.
