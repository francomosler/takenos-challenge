# Fixes implementados (notas de ingeniería)

Este documento resume los fixes concretos aplicados durante el debugging, la estabilización y la alineación con la suite de tests de integración.

## 1) El comando de seed de Prisma no estaba configurado

- **Problema**: `npx prisma db seed` fallaba con "No seed command configured".
- **Causa raíz**: `prisma.config.ts` no definía `migrations.seed`.
- **Fixes**:
  - Se agregó `migrations.seed` en `prisma.config.ts`:
    - `seed: "tsx prisma/seed.ts"`
  - Se agregó `prisma/seed.ts` como entrypoint de Prisma, que ejecuta la lógica de seed existente en `src/contexts/teams/infrastructure/seed.ts`.
- **Resultado**: el seeding de Prisma corre sin errores y carga países, bombos y equipos.

## 2) Tests unitarios fallando en `SearchMatchesService`

- **Problema**: Vitest fallaba ante paginación inválida y valores de `limit` fuera de rango.
- **Causas raíz**:
  - No había validación temprana de valores de `page` inválidos.
  - Un `limit` desmedido se pasaba tal cual en vez de normalizarse.
- **Fixes** (`src/contexts/matches/application/search-matches.service.ts`):
  - Se lanza `Error("Page must be greater than 0")` cuando `page < 1`.
  - Default `limit = 10`; si `limit > 100`, se cae al default (`10`) para respetar el contrato de los tests.
- **Resultado**: `npm run test:unit` — los tests de `SearchMatchesService` pasan.

## 3) Test unitario del draw fallando (desajuste de tipo de `drawId`)

- **Problema**: se esperaba `drawId` numérico, llegaba un string.
- **Causa raíz**: se estaba casteando con `String(drawId)` antes de crear los partidos.
- **Fixes** (`src/contexts/draw/domain/application/draw-assigner.service.ts`):
  - Se pasa el `drawId` numérico directo a `tryGenerateMatches`.
  - Se tipea el parámetro interno como `number`.
- **Resultado**: la igualdad estricta sobre `drawId` en los tests unitarios pasa.

## 4) Comportamiento flakey en la generación del draw

- **Problema**: se violaba ocasionalmente la regla de "máximo 2 rivales del mismo país".
- **Causa raíz**: `MAX_COUNTRY_OPPONENTS` estaba en `3` cuando los tests exigen `2`.
- **Fix** (`src/contexts/draw/domain/application/draw-assigner.service.ts`):
  - Se seteó `MAX_COUNTRY_OPPONENTS` en `2`.
- **Resultado**: el tope de rivales por país coincide con los tests y se eliminan los fallos aleatorios.

## 5) Error de runtime en `npm test` (`ERR_MODULE_NOT_FOUND` para `mocha`)

- **Problema**: Mocha no arrancaba; resolvía mal el módulo `mocha` bajo la raíz del proyecto.
- **Causa raíz**: la combinación `NODE_OPTIONS='--import tsx'` + invocar `mocha` como binario genérico generaba una resolución incorrecta en este entorno (Git Bash / Windows).
- **Fix** (`package.json`):
  - Se corre Mocha vía tsx explícitamente:
    - `cross-env PORT=8001 tsx node_modules/mocha/bin/mocha.js --reporter mocha-multi-reporters --reporter-options configFile=config.json`
- **Resultado**: los tests de integración arrancan de forma confiable.

## 6) Tests de integración: huecos del contrato de la API (Mocha / `test/index.spec.ts`)

Una vez alineado el driver nativo de SQLite con la versión de Node (ver troubleshooting más abajo), los fallos restantes eran puramente de contrato HTTP/API. Se implementaron así.

### 6a) El `POST /draw` duplicado tiene que devolver 409

- **Esperado**: un segundo `POST /draw` → `409`, con body en texto `Draw already exists`.
- **Fixes**:
  - `CreateDrawService`: si `searchCurrent()` encuentra un draw, lanza `DrawAlreadyExistsError`.
  - Handler POST de `draw.router`: mapea ese error a `409` y responde con `res.send("Draw already exists")` (texto plano, porque los tests asertan sobre `response.text`).

### 6b) Validación estricta de query en `GET /matches`

- **Esperado**: `400` para `limit` inválido (por ej. `> 100`, `0`, negativos), `matchDay` fuera de `1..8`, etc.
- **Causa raíz**: el router coaccionaba los query params con `Number(...)` y salteaba el schema Zod existente, así que los valores inválidos se colaban.
- **Fix** (`src/contexts/matches/presentation/matches.router.ts`):
  - Se parsea `req.query` con `SearchMatchesQuerySchema` antes de llamar a `SearchMatchesService`.

### 6c) Faltaba `DELETE /draw`

- **Esperado**: borrar el draw actual → `200` + JSON con mensaje; borrar cuando no hay → `404` + JSON con `message`.
- **Fix** (`src/contexts/draw/presentation/draw.router.ts`):
  - Se agregó `DELETE /draw`, que verifica si existe un draw actual, llama a `deleteAll()` en el repositorio cuando corresponde, o devuelve `404` si no.

### 6d) Faltaba `GET /health`

- **Esperado**: `200` con `status`, `service` y `timestamp`.
- **Fix** (`src/shared/infrastructure/routes.ts`):
  - Se registró `GET /health` antes del resto de los routers.

## 7) Mejoras opcionales del `CHALLENGE.md`

Se implementaron como follow-ups una vez que la base estaba en verde.

### 7a) Nuevos endpoints de lectura y filtros más ricos para `GET /matches`

- `GET /teams` — listado de equipos (filtros: `countryId`, `search`).
- `GET /teams/:id` — detalle del equipo con sus partidos en el draw actual.
- `GET /matches/:id` — detalle de un partido con `404` si el id no existe.
- `GET /draw/statistics` — estadísticas agregadas (`totalTeams`, `totalMatches`, `matchesPerMatchDay`, `teamsPerPot`, `teamsPerCountry`, …).
- `GET /matches` ahora soporta `countryId`, `matchDayFrom`/`matchDayTo`, `sortBy` (`matchDay` | `id` | `homeTeam` | `awayTeam`), `sortOrder` (`asc` | `desc`).

Implementación:

- Los contextos/servicios nuevos siguen el layout DDD-lite existente (`domain` / `application` / `infrastructure` / `presentation`) y se cablean vía Inversify.
- Los schemas de Zod en el borde del router validan el input y devuelven `400` con un mensaje legible por máquinas.
- Las excepciones de dominio (`MatchNotFoundError`, `TeamNotFoundError`, `DrawAlreadyExistsError`) son mapeadas a status HTTP en los routers — los services quedan puros.

### 7b) OpenAPI / Swagger UI

- `docs/openapi.yaml` — spec OpenAPI 3.0.3 que cubre cada endpoint, parámetro y schema de respuesta.
- Servido en vivo en **`GET /docs`** (Swagger UI) y **`GET /openapi.json`** (JSON crudo) vía `swagger-ui-express` + `yaml`.
- Cableado en `src/shared/infrastructure/routes.ts` de forma perezosa — si el archivo de la spec no está, la app igual levanta, solo que sin la ruta `/docs`.

### 7c) Diagramas de arquitectura

- `docs/architecture.md` — overview por capas más diagramas Mermaid para:
  - grafo de componentes/dependencias
  - diagrama de secuencia de `POST /draw`
  - diagrama de secuencia de `GET /matches` (Zod → service → repo)
  - diagrama ER del modelo de datos
- Explica los límites de DDD, dónde queda aislado Prisma y cómo agregar un contexto nuevo.

### 7d) Colección de Postman

- `postman/Champions-League-Draw-API.postman_collection.json` — 20 requests agrupadas en `Health`, `Draw`, `Matches`, `Teams`.
- `postman/Champions-League-Draw-API.postman_environment.json` — `baseUrl` y encadenamiento automático de `drawId` / `matchId` / `teamId`.
- `postman/README.md` — pasos de importación, flujo sugerido y listado completo de endpoints.
- La colección se puede correr de punta a punta con Newman como smoke test.

### 7e) Tests de carga / performance

- `scripts/load-test.ts` — usa `autocannon`, golpea todos los endpoints de lectura e imprime un resumen con `req/s`, latencias p50/p99 y conteo de errores.
- Se corre con `npm run test:load` (variables de entorno: `BASE_URL`, `DURATION`, `CONNECTIONS`, `PIPELINING`).
- Pensado para correr contra un servidor levantado localmente (`npm run dev`), no dentro del CI.

### 7f) Cobertura de tests + tests de casos borde

- La cobertura ya está cableada vía Vitest: `npm run test:unit:coverage` (provider `v8`, reporters `text`/`json`/`html`).
- Se agregaron suites de casos borde en Vitest, sin tocar los tests existentes:
  - `search-matches.service.edge.test.ts` — redondeo de `totalPages`, límite en 100, filtros vacíos/`undefined`, valores decimales de `page`.
  - `search-matches.dto.test.ts` — refinements de Zod: rango de `matchDay`, `limit > 100`, `matchDayFrom > matchDayTo`, `sortBy` desconocido.
  - `search-draw-statistics.service.edge.test.ts` — draw vacío, deduplicación de equipos entre bombos, tie-breaking en `teamsPerCountry`.
  - `search-team-by-id.service.edge.test.ts` — ids `NaN` / decimales, equipo encontrado sin partidos.

## Snapshot de validación

- `npm run test:unit`: **61/61 OK** (20 son las suites nuevas de casos borde).
- `npm test` (integración con Mocha): **59/59 OK**.
- `npx tsc --noEmit`: limpio.

## Troubleshooting: desajuste de módulo nativo `better-sqlite3` / Prisma

Si los tests de integración fallan con errores `NODE_MODULE_VERSION` sobre `better_sqlite3.node`, es que el binario nativo compilado no coincide con el proceso de Node que corre los tests.

- **Síntoma**: las queries de Prisma fallan; muchas rutas devuelven `400` en cascada.
- **Mitigación**: usar la versión de Node declarada en `package.json` → `engines` (>= 22) y después reinstalar o recompilar las dependencias nativas (`npm rebuild better-sqlite3` o limpiar `node_modules` + `npm install`).
