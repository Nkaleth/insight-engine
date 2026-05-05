# SPRINT 16: NARRATIVE AUDITOR

## HISTORIAL DE INTERACCIÓN

### Mentor (Fase 1: Verificación de Utensilios)
¡Bienvenido al Sprint 16, futuro Senior! Hasta ahora hemos construido los cimientos: tenemos Ollama corriendo (nuestro motor), tenemos nuestros prompts de sociología listos, y acabamos de añadir la capacidad de crear embeddings. 

Ahora vamos a crear el **Narrative Auditor** (`auditor.logic.ts`). Este es el cerebro analítico real: la lógica de negocio que tomará un texto, llamará a nuestro LLM local con el prompt adecuado, y nos devolverá un análisis estructurado sobre sesgos, dolor del usuario y polarización.

#### [FASE 1: VERIFICACIÓN DE UTENSILIOS] | ⏱️ 3 min

Para este sprint, ya tenemos casi todo el "hardware" instalado en nuestro monorepo, pero necesitamos asegurarnos de que el motor ruge antes de meter primera:

1. **Terminal / CLI de Nest:** No necesitamos dependencias nuevas hoy, solo usar nuestro buen amigo el framework. Asegúrate de tener una terminal abierta en `/apps/backend`.
2. **Ollama Activo:** Como vamos a hacer que el LLM analice el texto, necesitamos que Ollama esté corriendo en tu máquina. 
   - **Cómo verificarlo:** Abre una terminal nueva y ejecuta: `curl http://localhost:11434/api/tags`. Si te devuelve un JSON con tus modelos (como llama3 o mistral), estamos listos. Si da error de conexión, asegúrate de iniciar la app de Ollama.

**¿Todo en orden con tus herramientas y el servidor de Ollama? Confirmame con un "Listo" o "Siguiente" para pasar a la Analogía del Chef.**

### Usuario
Listo:
[Se confirmó que Ollama está corriendo y los contenedores de Docker están activos].

### Mentor (Fase 2: La Analogía del Chef)
¡Perfecto! Veo que tienes tus modelos listos (`qwen3-unsloth`, gemma4, etc.). Vamos a la cocina.

#### [FASE 2: LA ANALOGÍA DEL CHEF & EL "POR QUÉ"] | ⏱️ 5 min

👨‍🍳 **La Analogía:**
Imagina que los comentarios de Reddit y YouTube que scrapeamos son **ingredientes recién traídos del mercado campestre**: vienen sucios, revueltos y sin clasificar (patatas con tierra, zanahorias torcidas). 
El **Narrative Auditor** es tu **Sous-Chef analítico**. Su único trabajo es tomar esa canasta de ingredientes caóticos (texto crudo), aplicar una técnica de corte específica (nuestros Prompts) y devolverte ingredientes perfectamente picados en *brunoise* y separados en recipientes limpios (un JSON estructurado con "dolores", "sesgos" y "oportunidades de mercado").

🛑 **El "Por Qué" (El error de novato que estamos evitando):**
Un Junior metería la llamada al LLM (Ollama) directamente dentro del controlador (`ai.controller.ts`) o peor aún, justo después de descargar los datos en el scraper de Reddit (`reddit.service.ts`). 
¿El desastre a futuro? "Código Espagueti". Si mañana Reddit cambia su API, tu lógica de IA también se rompe. Si pasado mañana decides usar OpenAI en lugar de Ollama, tienes que reescribir medio proyecto.
Al crear un archivo dedicado solo para la **lógica de auditoría** (`auditor.logic.ts`), aplicamos el Principio de Responsabilidad Única (SRP). Desacoplamos la extracción de datos del análisis cognitivo. Si cambiamos la fuente o el modelo, el auditor ni se inmuta.

**¿Tiene sentido esta separación arquitectónica para ti? Confirmame para pasar al Plan de Acción.**

### Usuario
sí, continuemos

### Mentor (Fase 3: Plan de Acción)

#### [FASE 3: EL PLAN DE ACCIÓN (PASO A PASO)] | ⏱️ 7 min

Aquí está nuestra ruta táctica para construir esto en el módulo `ai` (`apps/backend/src/ai/`):

1. **Definir el Contrato (Interfaz):** Crearemos una interfaz `AuditorResult` en un archivo nuevo o dentro del mismo servicio para que TypeScript sepa exactamente la forma del JSON que esperamos (dolores, oportunidades, sesgos).
2. **Crear `auditor.logic.ts`:** Este será nuestro servicio inyectable (clase con `@Injectable()`) encargado exclusivamente de ser el puente estructurado hacia el LLM.
3. **Inyectar Dependencias (DI):** Conectaremos nuestro `OllamaClient` y la librería de prompts dentro del constructor de nuestro nuevo auditor.
4. **Programar `analyzeNarrative()`:** Escribiremos el método que toma un texto crudo, arma el prompt, pide a Ollama que responda **estrictamente en JSON**, y lo formatea de vuelta como un objeto de JavaScript.
5. **Registrar en el Módulo:** Añadiremos `NarrativeAuditorService` a los `providers` y `exports` en `ai.module.ts` para que el resto de la app pueda usarlo.

**Resumen de archivos clave:**
- `auditor.logic.ts`: El que recibe el texto, lo manda al LLM y parsea la respuesta.
- `ai.module.ts`: El que le avisa a NestJS que este nuevo servicio existe y está disponible.

**¿Entendido el plan? Dime si estás listo para ir a la FASE 4 y tirar código.**

### Usuario
Pregunta sobre si se analiza comentario por comentario vs agrupar en bloques (clustering).

### Mentor
Explicación de que NO se analiza uno por uno. Se extraen vectores, se agrupan por similitud (clustering), y al LLM solo se le pasa el grupo condensado para ahorrar recursos y tiempo de cómputo.

### Usuario
Listo, pasemos a la fase 4.

### Mentor (Fase 4: El Combate)
[Inicia el ejercicio de código con huecos]

### Usuario
listo, rellenado!
(Rellenó correctamente los 6 huecos: OLLAMA_CLIENT, AnalysisContext, AuditorResult, generateSociologicalPrompt, 'json', parse)

### Mentor (Fase 5: Cierre)
[Felicita al usuario y presenta el Senior Pitch y la pregunta final]
