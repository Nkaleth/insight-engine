# PROMPT MAESTRO DE COMBATE 3.0: THE INSIGHT ENGINE
## SPRINT 14: Prompt Engineering

---

### 🛠️ FASE 1: VERIFICACIÓN DE UTENSILIOS

¡Excelente, futuro Senior! El Sprint 14 es donde ocurre la verdadera magia. Vamos a construir el "cerebro sociológico" de nuestro Insight Engine. Aquí dejaremos de mandar textos sueltos a la IA y empezaremos a orquestar **Prompts Estructurados** como verdaderos ingenieros.

Para esta sesión, asegúrate de tener listo lo siguiente:

1. **Tu entorno de NestJS activo:** Debes estar posicionado en tu terminal dentro del backend (por ejemplo, la carpeta `apps/api`).
2. **Librería de limpieza de strings (`dedent`):** Cuando escribimos prompts muy largos en TypeScript usando *template literals* (las comillas invertidas `` ` ``), la indentación de nuestro código fuente se cuela en el texto final que recibe el LLM. Esto puede confundir a modelos como Llama o Mistral. Para evitar esto, usaremos una pequeña pero poderosa librería llamada `dedent`.
   - **Para instalarla**, ejecuta este comando en la terminal de tu backend:
     `pnpm add dedent`
   - **Para los tipos de TypeScript**, ejecuta:
     `pnpm add -D @types/dedent`
3. **Extensión de VS Code recomendada (Opcional pero útil):** **"Comment tagged templates"** o extensiones que resalten la sintaxis de markdown dentro de template strings. Como vamos a escribir prompts complejos (que suelen ir en formato Markdown), esto te ayudará a leerlos mucho mejor sin que se vea como un bloque de texto monocromático.

¿Tienes tu terminal lista y `dedent` instalado? Confírmame por el chat con un "Listo" o "Siguiente" para que yo actualice este archivo con la **Fase 2: La Analogía del Chef y el Por Qué**.

---

### 👨‍🍳 FASE 2: LA ANALOGÍA DEL CHEF & EL "POR QUÉ"

**La Analogía del Chef:**
Imagina que eres el Chef Ejecutivo de un restaurante con estrella Michelin. No le dices a tus cocineros de línea: *"Hazme un plato de pollo rico"*. Eso sería un desastre, porque cada cocinero te entregaría algo diferente y al azar. En cambio, les entregas una **Ficha Técnica Estructurada**: 
1. El rol del plato en el menú.
2. Ingredientes y cantidades exactas.
3. Reglas estrictas de cocción.
4. El formato exacto de emplatado.

En nuestro caso, el LLM (Llama 3 o Mistral vía Ollama) es nuestro cocinero de línea: es súper rápido y capaz, pero no tiene contexto ni criterio propio. Nuestros **Prompts Estructurados** son esa ficha técnica. En lugar de decirle "analiza estos comentarios", le damos un Rol ("Eres un sociólogo experto"), un Marco Teórico ("Usa la teoría de frustración-agresión"), la data cruda y le exigimos un formato de salida exacto (JSON).

**El "Por Qué" Senior (El error de novato que evitamos):**
¿Qué error técnico de Junior evitamos al construir una "Librería de Prompts" centralizada?

1. **El Síndrome del "Prompt Spaghetti":** El novato suele meter un string literal de 60 líneas directamente en el servicio o controlador donde llama a la IA. Si mañana necesitas ajustar un matiz psicológico del análisis, tienes que ir a buscar en medio de la lógica de negocio. Nosotros, como Seniors, separamos la *intención* (el prompt) de la *ejecución* (el cliente de IA).
2. **Caos en el Parseo (Alucinaciones):** Si no estructuramos el prompt correctamente, el modelo a veces responde con amabilidad ("¡Claro! Aquí tienes tu análisis:") rompiendo cualquier `JSON.parse()` posterior y tumbando el pipeline de datos.

¿Se entiende el porqué arquitectónico de separar los prompts en su propia librería? Confírmame por el chat con un "Listo" o "Siguiente" para actualizar el archivo con el **Plan de Acción**.

---

### 🗺️ FASE 3: EL PLAN DE ACCIÓN (PASO A PASO)

Vamos a estructurar nuestra librería de prompts en el módulo de Inteligencia Artificial (`ai`) de nuestro backend.

**Paso 1: Crear la estructura de carpetas**
Crearemos un subdirectorio dedicado a nuestros prompts dentro de `apps/backend/src/ai/` para aislar esta lógica de negocio.

**Paso 2: Definir Interfaces Estrictas (`prompt.interface.ts`)**
Crearemos el archivo `prompt.interface.ts`. Este archivo se encargará de obligarnos (mediante TypeScript) a pasarle al prompt exactamente las variables dinámicas que necesita (como `postTitle`, `comments`, `subreddit`, etc.), evitando el clásico error de olvidar inyectar el contexto.

**Paso 3: Construir la Librería Core (`prompts.library.ts`)**
Crearemos el archivo `prompts.library.ts`. Este es nuestro gran "Libro de Recetas". Aquí exportaremos funciones que reciben los datos tipados del Paso 2 y retornan un *string* perfectamente indentado (usando `dedent`), listo para ser enviado a Llama 3 o Mistral.

**Paso 4: Testeo Visual Rápido**
Más adelante, cuando conectemos el Ollama Factory, llamaremos a esta función, pero por ahora garantizamos que TypeScript compile correctamente la estructura del prompt.

¿Entendido el plan de ataque? Confírmame por aquí con un "Listo" o "Siguiente" para pasar a **La Fase 4: El Combate (Codificación Guiada)**, donde te daré la estructura base para que tú la rellenes.

---

### ⚔️ FASE 4: EL COMBATE (CODIFICACIÓN GUIADA)

¡A los teclados! Vamos a empezar por el **Paso 2 y Paso 3 del Plan**: crear nuestra interfaz estricta y nuestra función generadora de prompts.

Crea el archivo `apps/backend/src/ai/prompts/prompt.interface.ts` (si no existe la carpeta `prompts`, créala) y el archivo `apps/backend/src/ai/prompts/prompts.library.ts`.

Primero, dentro de `prompt.interface.ts`, asume que hemos creado esto:
```typescript
// apps/backend/src/ai/prompts/prompt.interface.ts
export interface AnalysisContext {
  communityName: string;
  title: string;
  comments: string;
}
```

A continuación, te doy la **ESTRUCTURA BASE** para `prompts.library.ts`. Tienes que rellenar los huecos marcados con `_____`.

```typescript
// apps/backend/src/ai/prompts/prompts.library.ts
import dedent from 'dedent';
import { _____ } from './prompt.interface'; // 1. ¿Qué interfaz importarías aquí?

export const generateSociologicalPrompt = (context: _____): string => { // 2. ¿De qué tipo es el parámetro 'context'?
  // Usamos dedent para limpiar la indentación y template literals (``) para inyectar variables
  return dedent`
    Eres un sociólogo experto especializado en la "Teoría de Frustración-Agresión".
    Tu objetivo es analizar el siguiente contenido extraído de la comunidad: ${_____} // 3. ¿Cómo inyectas el nombre de la comunidad desde el 'context'?

    TÍTULO DEL POST:
    ${_____} // 4. ¿Cómo inyectas el título desde el 'context'?

    COMENTARIOS CRUDOS:
    ${_____} // 5. ¿Cómo inyectas los comentarios desde el 'context'?

    INSTRUCCIONES DE SALIDA:
    Devuelve ÚNICAMENTE un objeto JSON válido con la siguiente estructura, sin texto adicional:
    {
      "frustrationLevel": "HIGH|MEDIUM|LOW",
      "mainPainPoint": "Descripción breve del problema central",
      "businessOpportunity": "Idea de micro-SaaS para resolver esto"
    }
  `;
};
```

**🔍 Análisis Sintáctico (Desglose antes de que resuelvas):**
- **`import dedent from 'dedent';`**: Traemos la función `dedent`. Fíjate que se usa directamente pegada a las comillas invertidas: `dedent\``, esto es lo que se conoce en TS/JS como un "Tagged Template Literal" (una función especial que procesa el string y en este caso, elimina la indentación extra).
- **`export const ... = (context): string =>`**: Exportamos una función flecha. Las funciones puras son perfectas aquí porque dado un mismo *input* (el objeto context), siempre darán exactamente el mismo *output* predecible (el string del prompt). Sin efectos secundarios.
- **`${ ... }`**: Esta es la sintaxis de interpolación de variables de JavaScript dentro de los *template literals*. Nos permite inyectar variables dinámicas en medio de una gran cadena de texto.

**Tu Turno:**
Crea o ve a esos archivos y completa los `_____` en `prompts.library.ts`. 

Cuando lo tengas, **pega aquí en el chat tu código de `prompts.library.ts` resuelto**. Recuerda, si te atoras, dímelo y usaré la REGLA DE PISTAS. ¡A codificar!

---

### 🎤 FASE 5: EL SENIOR PITCH & CIERRE

¡BRUTAL! He revisado tu código y has implementado correctamente el tipado (`AnalysisContext`) y la interpolación de variables (`${context.communityName}`, etc.). Ahora el prompt está centralizado, fuertemente tipado y protegido contra errores de formato. 

**El Pitch de Entrevista (Tu momento de brillar):**
Si en una entrevista técnica te preguntan: *"¿Cómo manejaste los prompts en tu proyecto con LLMs locales?"*

Tú respondes (con voz calmada de ingeniero seguro):
> *"Implementé una 'Librería de Prompts' centralizada usando un enfoque funcional. En lugar de hardcodear literales en la lógica de negocio, diseñé interfaces estrictas en TypeScript (como \`AnalysisContext\`) que garantizan la inyección del contexto dinámico. Estos datos alimentan templates limpios gracias a la librería \`dedent\`. Esto me aseguró tres cosas: evitar alucinaciones por errores de indentación en los prompts; garantizar que el equipo no olvide enviar variables clave; y mantener la separación de responsabilidades, donde el servicio de inferencia solo ejecuta, pero no compone la lógica del prompt."*

**Pregunta de Refuerzo (Para cerrar el módulo):**
Imagina que un colega tuyo escribe su prompt en una sola línea larguísima e ilegible para "ahorrar espacio", argumentando que así no necesita usar `dedent`.
¿Por qué tu enfoque (usando `dedent` y múltiples líneas bien formateadas) es superior tanto a nivel de **mantenimiento del código** como a nivel de **comprensión por parte del LLM**?

**(Responde a esta pregunta directamente por aquí en el chat y con eso damos por superado el Sprint 14 con nota perfecta) 🚀**
