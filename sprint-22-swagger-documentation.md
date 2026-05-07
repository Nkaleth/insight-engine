# Sprint 22: Swagger Documentation

**El "Senior Pitch":** "Documentación técnica viva bajo el estándar OpenAPI 3.0 para equipos de frontend."

---

### [FASE 1: VERIFICACIÓN DE UTENSILIOS] | ⏱️ 3 min
*(Completado)*

### [FASE 2: LA ANALOGÍA DEL CHEF & EL "POR QUÉ"] | ⏱️ 5 min
*(Completado)*

### [FASE 3: EL PLAN DE ACCIÓN (PASO A PASO)] | ⏱️ 7 min
*(Completado)*

### [FASE 4: EL COMBATE (CODIFICACIÓN GUIADA)] | ⏱️ 20 min
*(Completado)*

---

### [FASE 5: EL SENIOR PITCH & CIERRE] | ⏱️ 10 min
*(Completado)*

**Pregunta de Refuerzo del Mentor:** "¿Por qué usaste el patrón `DocumentBuilder` en lugar de un JSON gigante?"
**Respuesta del Junior:** "Es más práctico cambiar ese patrón de diseño que una maraña gigantesca en un JSON. Además es una práctica standard profesional."

**Pregunta del Junior:** "¿Dónde se usó OpenAPI 3.0?"
**Respuesta del Mentor:** OpenAPI 3.0 es la especificación (el estándar/reglas) de cómo debe estar estructurado ese documento JSON por debajo. Cuando usas `DocumentBuilder` y `SwaggerModule.createDocument()`, NestJS está escribiendo en memoria un archivo JSON enorme que cumple rigurosamente con las reglas de OpenAPI 3.0. Swagger UI simplemente es el frontend que lee ese JSON y lo dibuja bonito. Si vas a la ruta `http://localhost:3000/api-docs-json`, verás el "OpenAPI 3.0" crudo que acabas de generar.

---
**Sprint 22 Completado.** ¡Gran trabajo!
