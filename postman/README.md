# Postman Collection — Champions League Draw API

Colección Postman completa para probar todos los endpoints de la API.

## Archivos

- `Champions-League-Draw-API.postman_collection.json` — colección (v2.1) con 20 peticiones organizadas en 4 carpetas: **Health** (1), **Draw** (4), **Matches** (11), **Teams** (4).
- `Champions-League-Draw-API.postman_environment.json` — environment de ejemplo con `baseUrl=http://localhost:8000`.

## Importar en Postman

1. Abrir Postman.
2. Click en **Import** (parte superior izquierda).
3. Arrastrar ambos JSONs o seleccionarlos desde disco.
4. En el selector de environment (arriba a la derecha), elegir **"Champions League Draw - Local"**.

## Importar en Insomnia

Insomnia soporta colecciones Postman v2.1 de forma nativa:

1. **Application → Preferences → Data → Import Data → From File**.
2. Seleccionar `Champions-League-Draw-API.postman_collection.json`.

## Uso vía CLI (Newman)

```bash
npm install -g newman
newman run postman/Champions-League-Draw-API.postman_collection.json \
  -e postman/Champions-League-Draw-API.postman_environment.json
```

## Requisitos previos

Antes de ejecutar las peticiones:

```bash
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev     # o npm start
```

La API queda escuchando en `http://localhost:8000` por defecto.

## Variables de colección

| Variable  | Descripción                                                              |
|-----------|--------------------------------------------------------------------------|
| `baseUrl` | URL base de la API. Por defecto `http://localhost:8000`.                 |
| `matchId` | Se actualiza automáticamente tras `GET /matches` (usa el primer resultado). |
| `teamId`  | Se actualiza automáticamente tras `GET /teams`.                          |
| `drawId`  | Se actualiza automáticamente tras `GET /draw`.                           |

De esa forma, ejecutar `GET /matches` y luego `GET /matches/:id` funciona sin editar nada.

## Flujo recomendado

1. **Health** → `GET /health`
2. **Draw** → `POST /draw` (genera los 144 partidos)
3. **Draw** → `GET /draw`, `GET /draw/statistics`
4. **Matches** → `GET /matches` (con distintos filtros y ordenamientos)
5. **Matches** → `GET /matches/:id`
6. **Teams** → `GET /teams`, `GET /teams/:id`
7. **Draw** → `DELETE /draw` para poder re-generar

## Endpoints incluidos

### Health
- `GET /health`

### Draw
- `POST /draw` — crea el sorteo (201) o 409 si ya existe.
- `GET /draw` — devuelve el sorteo actual.
- `GET /draw/statistics` — estadísticas agregadas (totales, distribución por jornada/bombo/país).
- `DELETE /draw` — elimina el sorteo actual.

### Matches
- `GET /matches` — listado con paginación, filtros y ordenamiento:
  - `teamId` — partidos de un equipo
  - `countryId` — partidos de un país
  - `matchDay` — jornada exacta (1..8)
  - `matchDayFrom` / `matchDayTo` — rango de jornadas
  - `sortBy` — `matchDay | id | homeTeam | awayTeam`
  - `sortOrder` — `asc | desc`
  - `page` / `limit` — paginación (limit máx. 100)
- `GET /matches/:id` — detalle del partido.

### Teams
- `GET /teams` — todos los equipos ordenados por nombre, filtros `countryId` y `search`.
- `GET /teams/:id` — detalle del equipo más todos sus partidos del sorteo actual.

## Tests integrados

Cada petición incluye assertions mínimas en el tab **Tests** que validan:

- Código de respuesta correcto (200/201/404/409 según corresponda).
- Shape básico del body (propiedades esperadas).
- Totales de `GET /draw/statistics` (36 equipos, 144 partidos).

Esto permite correr toda la colección con **Collection Runner** o **Newman** como smoke test rápido.
