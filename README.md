# Champions League Draw API - Backend Challenge

## 📋 Descripción General

Este challenge evalúa tu capacidad para **entender, corregir y extender** un sistema backend existente, aplicando buenas prácticas de arquitectura, diseño y calidad de código.

El dominio del problema es el **sorteo de la Champions League en su nuevo formato**, donde 36 equipos participan en una liga única y cada uno juega 8 partidos bajo reglas específicas.

---

## 🧩 Contexto del Dominio

### Reglas del Sorteo

- **36 equipos** participan del torneo
- Cada equipo juega:
  - **8 partidos** en total
  - **4 como local** y **4 como visitante**
- **No puede haber partidos repetidos** entre los mismos equipos
- **Restricciones de país:**
  - Dos equipos del mismo país **NO pueden enfrentarse**
  - Un equipo **NO puede jugar contra más de 2 equipos del mismo país**
- Los partidos se distribuyen en **8 jornadas (match days)**
  - Cada equipo juega **1 partido por jornada**
  - Cada jornada tiene **18 partidos** (36 equipos / 2)

---

## ⚠️ Estado Actual del Proyecto

El proyecto que recibes tiene:

✅ **Implementado:**
- Estructura base con arquitectura de bounded contexts
- Conexión a base de datos (SQLite con Prisma)
- Modelos de datos (Team, Country, Match, Draw)
- Algoritmo de generación de sorteo
- Algunos endpoints REST
- Suite de tests (unitarios e integración)

❌ **Problemas conocidos:**
- El código tiene **bugs intencionales** que debes encontrar y corregir
- Faltan **validaciones importantes**
- Algunos **endpoints no están implementados**
- Los **tests están fallando** (12 tests fallan actualmente)

---

## 🎯 Tareas Obligatorias

### 1. Corregir Bugs Existentes

Debes identificar y corregir los siguientes problemas:

#### 🐛 Bug en DrawService
- El algoritmo permite más de 2 oponentes del mismo país

#### 🐛 Bug en Tipos de Datos
- Hay un problema de tipos en el parámetro `drawId`

#### 🐛 Validaciones Faltantes en CreateDrawService
- No valida si ya existe un sorteo antes de crear uno nuevo

#### 🐛 Manejo de Errores en draw.router.ts
- No maneja correctamente el error 409 (Conflict)

#### 🐛 Validaciones Faltantes en SearchMatchesService
- Faltan validaciones de parámetros de paginación

#### 🐛 Validación de Query Params en matches.router.ts
- Falta usar el schema de validación en el router

### 2. Implementar Endpoints Faltantes

Debes crear los siguientes endpoints que **NO existen** actualmente:

#### DELETE /draw
- Eliminar el sorteo actual
- **Responses:**
  - `200`: Draw eliminado exitosamente
  - `404`: No existe un draw para eliminar
- Debe eliminar en cascada: Draw, DrawTeamPot, Match

#### GET /health
- Health check del servicio
- **Response 200:**
  ```json
  {
    "status": "ok",
    "service": "champions-league-draw-api",
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
  ```

### 3. Hacer Pasar Todos los Tests

Actualmente hay **12 tests fallando**:
- 1 test unitario en `draw-assigner.service.test.ts`
- 3 tests unitarios en `search-matches.service.test.ts`
- 4 tests E2E para los nuevos endpoints
- 4 tests E2E de validaciones

**Objetivo:** Todos los tests deben pasar (✅ 100% passing)

---

## 🔧 Funcionalidades Requeridas

### A. Sortear los partidos
- [x] Ejecutar el sorteo completo
- [x] Persistir el resultado
- [ ] **FALTA**: Evitar ejecutar el sorteo más de una vez (respuesta 409)

### B. Obtener partidos
- [x] Calendario general con paginación
- [x] Filtros por equipo y fecha
- [ ] **SUGERIDO**: Agregar filtros adicionales (local/visitante, por país, etc.)

### C. Gestión del sorteo
- [ ] Implementar `DELETE /draw`: Eliminar sorteo actual

### D. Health Check
- [ ] Implementar `GET /health`: Verificar estado del servicio

---

## 🧹 Validaciones y Manejo de Errores

### Implementar:

- [ ] Validación de tipos (usando Zod)
- [ ] Validación de rangos (IDs válidos, matchDays 1-8, paginación, etc.)
- [ ] Validación de reglas de negocio
- [ ] Manejo de errores apropiado en los routers
- [ ] Códigos HTTP apropiados:
  - `200 OK`, `201 Created`
  - `400 Bad Request`, `404 Not Found`, `409 Conflict`
  - `500 Internal Server Error`

### Ejemplos de validaciones faltantes:

- Retornar 409 si ya existe un sorteo antes de crear uno nuevo
- Validar parámetros de paginación en `SearchMatchesService`
- Usar el schema de validación en `matches.router.ts`
- Manejar correctamente el error 409 en `draw.router.ts`

---

## 📈 Arquitectura y Diseño

### Evaluar y mejorar:

- Modularización y separación de responsabilidades
- Principios SOLID
- Bajo acoplamiento entre capas
- Preparación para escalar el sistema
- Decisiones técnicas justificables

---

## 🌟 Mejoras Opcionales (Suma Puntos)

Si quieres destacarte, puedes agregar:

### 📊 Nuevos Endpoints
- `GET /teams` - Listar todos los equipos
- `GET /teams/:id` - Detalle de un equipo con sus partidos
- `GET /matches/:id` - Detalle de un partido específico
- `GET /draw/statistics` - Estadísticas del sorteo

### 🔍 Filtros Adicionales
- Filtrar partidos por rango de jornadas (matchDays)
- Filtrar por país (todos los partidos de equipos de un país)
- Ordenamiento personalizado (por jornada, equipo, etc.)

### 📝 Documentación
- Documentar la API con Swagger/OpenAPI
- Diagrams de arquitectura
- Colección de Postman/Insomnia

### 🧪 Testing
- Aumentar cobertura de tests
- Tests de carga/performance
- Tests de casos edge

---

## ✅ Criterios de Evaluación

| Criterio | Qué evaluamos |
|----------|---------------|
| **Correctitud** | Todos los tests pasan, bugs corregidos, reglas del dominio respetadas |
| **Arquitectura** | Separación de responsabilidades, SOLID, bajo acoplamiento |
| **Código** | Legibilidad, expresividad, consistencia, buenas prácticas |
| **Testing** | Casos relevantes, claridad, cobertura |
| **Mejoras** | Iniciativa, creatividad, valor agregado |

---

## 🚀 Cómo Empezar

### 1. Setup del Proyecto

```bash
# Instalar dependencias
npm install

# Generar cliente Prisma
npx prisma generate

# Ejecutar migraciones
npx prisma migrate dev

# Seed de datos iniciales
npx prisma db seed
```

### 2. Ejecutar Tests

```bash
# Tests unitarios
npm run test:unit

# Tests de integración
npm test

# Ver cobertura
npm run test:coverage
```

### 3. Ejecutar el Servidor

```bash
# Desarrollo
npm run dev

# Producción
npm run build
npm start
```

### 4. Verificar el Estado Actual

```bash
# Debe mostrar ~12 tests fallando
npm test

# Debe mostrar 1 test fallando
npm run test:unit
```

---

## 📦 Entregable

### Qué debes entregar:

1. **Código fuente:**
   - Fork o clon del repositorio con tus cambios
   - Commits con mensajes claros y descriptivos
   - Branch `main` o `solution` con la solución final

2. **Documentación (README.md):**
   - Cómo levantar el proyecto
   - Decisiones técnicas tomadas
   - Supuestos realizados
   - Bugs encontrados y cómo los solucionaste
   - Mejoras implementadas (si las hay)

3. **Tests:**
   - Todos los tests existentes deben pasar
   - Nuevos tests para código agregado (deseable)

### Formato de entrega:
- Link a repositorio GitHub/GitLab/Bitbucket

---

## 🧠 Qué Buscamos Evaluar

> No buscamos una solución perfecta.
>
> Buscamos **criterio técnico**, **capacidad de análisis**, **calidad de diseño** y **habilidad para trabajar con código existente**.

### Valoramos especialmente:

- ✅ Capacidad para entender código ajeno
- ✅ Identificación sistemática de problemas
- ✅ Soluciones elegantes y mantenibles
- ✅ Balance entre pragmatismo y calidad
- ✅ Comunicación clara de decisiones técnicas

### NO buscamos:

- ❌ Over-engineering
- ❌ Reescribir todo desde cero
- ❌ Agregar librerías innecesarias
- ❌ Optimizaciones prematuras

---

## 📚 Recursos

### Tecnologías del Proyecto

- **Runtime:** Node.js 18+
- **Lenguaje:** TypeScript
- **Framework:** Express.js
- **ORM:** Prisma
- **Base de datos:** SQLite
- **Testing:** Vitest + Chai
- **DI Container:** InversifyJS

### Documentación Útil

- [Prisma Docs](https://www.prisma.io/docs)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [Vitest API](https://vitest.dev/api/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

## 🔒 Archivos de Solo Lectura

- `test/*` - No modificar los tests de integración

---

**¡Éxito con el challenge! 🚀**
