# 🛡️ Política de Seguridad - Takenos

¡Tu compromiso con la seguridad nos hace más fuertes! Este documento establece el proceso para reportar vulnerabilidades y cómo ser reconocido por tus contribuciones a través de nuestro programa de **Security Champions**.

### 🏆 Programa de Reconocimiento y Puntos

Valoramos la proactividad. Cada acción de seguridad suma puntos para obtener tu **Security Champion Badge**:

| Acción | Puntos | Requisito / Evidencia |
| :--- | :--- | :--- |
| **Reporte de Vulnerabilidad Crítica** | 50 | Reporte validado de fallo crítico (ej. Inyección, BOLA) |
| **Resolver "Security Debt"** | 30 | Limpieza de vulnerabilidades antiguas del backlog |
| **Nuevo Control de Seguridad** | 20 | Implementar controles (ej. CSRF Tokens, Security Headers) |
| **Security Code Review** | 10 | Review exhaustivo con foco en OWASP/ASVS |
| **Security Fix Estándar** | 10 | PR mergeado con el label `security-fix` |

---

### 🔒 Cómo Reportar una Vulnerabilidad

Si encontrás un fallo de seguridad o una vulnerabilidad potencial:

1. **NO abras un Issue público.** Esto expone a nuestros usuarios antes de que podamos arreglarlo.
2. Envía un mensaje directo (DM) por Slack a los responsables de seguridad o escribe a: **security@takenos.com**
3. Incluye una descripción del hallazgo, el impacto potencial y los pasos para reproducirlo.

---

### 🛠️ Guía para Desarrolladores (Security Fixes)

Para que tus aportes sean contabilizados automáticamente por nuestro Sentinel:
* **Etiquetado:** Todo PR de seguridad **DEBE** llevar el label `security-fix`.
* **Documentación:** En la descripción del PR, mencioná qué control de seguridad estás reforzando.
* **Asignación:** El sistema te asignará automáticamente al PR para el conteo de puntos semanal.
* **Validación:** Asegúrate de que las alertas de CodeQL/Dependabot pasen a estado **Fixed**.
