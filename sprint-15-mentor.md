# PROMPT MAESTRO DE COMBATE 3.0: THE INSIGHT ENGINE FULL BLUEPRINT

## Sprint 15: Embeddings Gen

### [FASE 1: VERIFICACIÓN DE UTENSILIOS] | ⏱️ 3 min

Para este módulo, no necesitamos instalar librerías pesadas en el backend si ya tenemos nuestro `ollama.client.ts` funcionando, pero sí necesitamos preparar el motor de IA local y asegurar la base de datos.

1. **Modelo Especializado en Embeddings (Ollama):** 
   Los LLMs tradicionales (como Llama 3) generan texto. Para generar vectores necesitamos un modelo especializado. Usaremos `nomic-embed-text`, que es un modelo altamente eficiente y estándar en la industria para esta tarea.
   * **Cómo verificar/instalar:** Abre tu terminal y ejecuta exactamente este comando:
     ```bash
     ollama pull nomic-embed-text
     ```
     *(Esto descargará el modelo. Debería ser rápido, pesa unos 274MB).*

2. **Verificación de Prisma (pgvector):**
   Asegúrate de que tu contenedor de PostgreSQL esté corriendo (el que levantamos con `docker-compose`), ya que pronto guardaremos estos arrays gigantescos de números ahí.

**¿Me confirmas cuando hayas ejecutado el comando de Ollama y se haya descargado el modelo para pasar a la Fase 2?**

---

### [FASE 2: LA ANALOGÍA DEL CHEF & EL "POR QUÉ"] | ⏱️ 5 min

#### 🧑‍🍳 La Analogía de la "Coordenada de Sabor"
Imagina que tienes una despensa gigante y quieres encontrar algo "ácido y crujiente". Un novato buscaría exactamente la etiqueta "Limón" o "Manzana Verde" (búsqueda por palabra clave). 

Los **Embeddings** son como el paladar de un Master Chef: a él no le importa la etiqueta del frasco. Él sabe que el "Yuzu" (un cítrico japonés) y el "Limón" están ubicados en las mismas *"coordenadas matemáticas de sabor"*, aunque se llamen y se escriban totalmente distinto. Un embedding agarra una oración humana y la convierte en una coordenada de números (ej. `[0.45, -0.12, 0.89...]`). Conceptos similares, tendrán coordenadas muy cercanas.

#### 🛡️ Seniority Check: ¿Qué error de novato evitamos?
**El error:** Intentar hacer nuestro "Radar de Nichos" (Insight Engine) usando búsquedas SQL de texto exacto (ej: `LIKE '%frustrado%'`) o sistemas como ElasticSearch tradicional. 
**El desastre:** Si un usuario en Reddit escribe *"estoy harto de que el software sea tan lento y pesado"*, tu base de datos novata jamás lo encontrará porque no usó la palabra "frustrado". Te pierdes el 90% de las oportunidades de negocio reales.
**La solución profesional:** Al vectorizar el texto (convertirlo en Embeddings) y guardarlo en `pgvector`, no buscamos por sintaxis, buscamos por **significado**. La IA sabe matemáticamente que "harto de que sea lento" es semánticamente idéntico a "frustración por rendimiento".

**¿Se entiende el poder de esto y por qué no usamos búsquedas normales? Confírmame para saltar a la Fase 3 (El Plan de Acción).**

---

### [FASE 3: EL PLAN DE ACCIÓN (PASO A PASO)] | ⏱️ 7 min

¡Perfecto! Ahora que sabemos *por qué* lo hacemos, veamos *cómo* lo vamos a ejecutar. Aquí está nuestra hoja de ruta táctica:

1. **Paso 1: Expandir el AI Module.** Vamos a crear un nuevo servicio dentro de nuestra carpeta `ai` que se encargue exclusivamente de las "traducciones" matemáticas.
2. **Paso 2: Inyectar Ollama.** Usaremos nuestra fábrica de Ollama (`OllamaFactory` u `OllamaService` que ya creamos en el sprint 13) para invocar al modelo `nomic-embed-text`.
3. **Paso 3: Endpoint de Comprobación.** Expondremos un endpoint temporal en nuestro controlador para mandarle un texto por Postman/ThunderClient y ver cómo nos devuelve una gigante matriz de números.

#### 📂 ¿Qué archivos vamos a tocar/crear?

- `apps/backend/src/ai/embeddings.service.ts` *(Nuevo)*: **El Traductor.** Este archivo recibirá un texto en español/inglés, y le pedirá a Ollama que lo convierta en un `number[]` (un arreglo de coordenadas matemáticas).
- `apps/backend/src/ai/ai.module.ts` *(Modificación)*: **El Registro.** Aquí agregaremos y exportaremos nuestro nuevo `EmbeddingsService` para que el resto de la aplicación (como el Queue Processor de Reddit) pueda usarlo.

---

### [FASE 4: EL COMBATE (CODIFICACIÓN GUIADA)] | ⏱️ 20 min

#### 🛠️ ROUND 1: Creando el `EmbeddingsService`

Crea el archivo `apps/backend/src/ai/embeddings.service.ts` y pega el siguiente esqueleto. Tu misión es reemplazar los `_____` con el código correcto.

```typescript
import { Injectable, Logger, Inject } from '@nestjs/common';
import { Ollama } from 'ollama';
import { OLLAMA_CLIENT } from './ai.constants';

@Injectable()
export class EmbeddingsService {
  private readonly logger = new Logger(EmbeddingsService.name);

  constructor(
    // 1️⃣ Inyecta el token correcto usando el decorador de NestJS
    @_____('_____') // Pista: Usamos una constante de ai.constants.ts
    private readonly ollamaClient: _____, // 2️⃣ ¿Cuál es el tipo de esta variable según nuestra importación?
  ) {}

  /**
   * Transforma texto en coordenadas matemáticas
   */
  async generateEmbedding(text: string): Promise<_____[]> { // 3️⃣ ¿Qué devuelve un embedding? (tipo de dato primitivo)
    try {
      this.logger.debug(`Vectorizando texto de ${text.length} caracteres...`);

      // 4️⃣ Llama al método de embeddings de la librería Ollama
      const response = await this.ollamaClient._____(({
        model: '_____', // 5️⃣ Pon el modelo exacto que descargamos en la Fase 1
        prompt: text,
      });

      // 6️⃣ Retorna el arreglo de números que viene en la respuesta
      return response._____; // Pista: Revisa qué devuelve el SDK de Ollama
    } catch (error) {
      this.logger.error('Error al generar embedding', error);
      throw error;
    }
  }
}
```

#### 🧠 Análisis Sintáctico (Seniority Check):
Antes de que llenes los huecos, entiende lo que estamos escribiendo:
*   `@Injectable()`: Le dice a NestJS "Oye, esta clase es un Lego. Se puede enchufar dentro de otros Legos (servicios o controladores)".
*   `@Inject(...)`: Como nuestra fábrica `OllamaFactory` usa un token personalizado (`OLLAMA_CLIENT`) en lugar de una clase directa, tenemos que decirle explícitamente a NestJS "Busca este nombre exacto en la memoria e inyéctalo aquí".
*   `Promise<_____[]>`: Toda operación de Red/IA es asíncrona. La UI no se congela mientras Ollama piensa; devuelve una Promesa de que en el futuro entregará un Array (`[]`).

**¡Tu turno! Llénalo en tu archivo `embeddings.service.ts`, dime con qué reemplazaste cada uno de los 6 huecos y luego pégalo aquí para revisarlo.**

---

#### 🛠️ ROUND 2: Registrando el Servicio en el Módulo

Excelente corrección. Ahora tenemos el "Traductor" (`EmbeddingsService`), pero NestJS aún no sabe que existe. Tenemos que registrarlo en `apps/backend/src/ai/ai.module.ts`. 

Ve a ese archivo y complétalo usando este esqueleto:

```typescript
import { Global, Module } from '@nestjs/common';
import { OllamaFactory } from './ollama.client';
// 1️⃣ Importa el nuevo servicio
import { _____ } from './_____';

@Global()
@Module({
  // 2️⃣ Añade el servicio al arreglo de providers
  providers: [OllamaFactory, _____],
  // 3️⃣ Exponlo en el arreglo de exports
  exports: [OllamaFactory, _____],
})
export class AiModule { }
```

#### 🧠 Análisis Sintáctico (Seniority Check):
*   `providers: [...]`: Aquí le decimos a NestJS "Estas son las herramientas/servicios que viven *dentro* de esta caja llamada AiModule". Al poner nuestro servicio aquí, NestJS lo instanciará automáticamente.
*   `exports: [...]`: ¡Esta es la clave! Si no exportas un provider, se queda como un secreto privado dentro de `AiModule`. Al exportarlo, permitimos que en el futuro, el "Scraper de Reddit" o el "Scraper de YouTube" puedan inyectar nuestro `EmbeddingsService` para usarlo libremente.

**Llénalo y avísame cuando lo tengas para saltar a nuestro round final: ¡El Controlador para probar la magia!**

---

#### 🛠️ ROUND 3: El Mostrador (Controlador)

¡Ya casi terminamos la arquitectura! Ahora que el módulo conoce nuestro servicio, vamos a exponer un "mostrador" web (un Endpoint REST) para que podamos enviarle un texto desde Thunder Client/Postman y nos devuelva los vectores. 

**Misión 1:** Crea el archivo `apps/backend/src/ai/ai.controller.ts` y completa este esqueleto:

```typescript
import { Controller, Post, Body } from '@nestjs/common';
import { EmbeddingsService } from './embeddings.service';

@Controller('ai')
export class AiController {
  constructor(
    // 1️⃣ Inyecta el servicio de embeddings
    private readonly embeddingsService: _____, // ¿De qué clase estamos hablando?
  ) {}

  // 2️⃣ Define que este método responderá a peticiones HTTP POST en la ruta /ai/embed
  @_____('embed') // Pista: Usamos un decorador que importamos arriba
  async testEmbedding(
    // 3️⃣ Extrae la propiedad "text" del cuerpo (body) de la petición HTTP
    @_____('text') text: _____, // 4️⃣ ¿Qué tipo de dato es un texto? (Decorador importado arriba)
  ) {
    // 5️⃣ Llama al método de tu servicio que genera el arreglo de números
    const vector = await this.embeddingsService._____(text);
    
    return {
      message: 'Embedding generado con éxito',
      dimensions: vector.length, // Nomic suele dar 768 dimensiones
      vector: vector,
    };
  }
}
```

**Misión 2:** Vuelve a `apps/backend/src/ai/ai.module.ts` y registra este nuevo controlador.
1. Importa `AiController`.
2. Añade un nuevo arreglo llamado `controllers: [AiController],` justo arriba de `providers`.

**¡Tu turno! Haz ambas misiones y cuando lo tengas, pasamos a la FASE 5 (Senior Pitch) para cerrar este sprint como un campeón.**

---

### [FASE 5: EL SENIOR PITCH & CIERRE] | ⏱️ 10 min

¡Bruno es una excelente herramienta, muy open-source y moderna! Usarla ya te da puntos extra de *tooling*. 

Acabamos de construir una de las piezas más críticas y avanzadas de la arquitectura del Insight Engine. Vamos a traducir todo este trabajo técnico a idioma "Impacto de Negocio".

#### 🎙️ El "Senior Pitch" (Lo que dirás en la entrevista)
*"Para el motor de análisis del Insight Engine, me di cuenta de que las búsquedas SQL tradicionales se quedaban muy cortas para identificar patrones reales en las quejas de los usuarios. Así que implementé un pipeline de vectorización de texto local utilizando Ollama y `nomic-embed-text`.* 

*Construí un servicio dedicado en NestJS que transforma los datos no estructurados (comentarios de Reddit/YouTube) en coordenadas matemáticas (Embeddings). Esto nos permite habilitar búsquedas semánticas puras en PostgreSQL usando la extensión `pgvector`, logrando agrupar las frustraciones de clientes por **significado** y no por coincidencia exacta de palabras, destapando así nichos de mercado que de otra forma serían invisibles."*

#### 🧠 Pregunta de Refuerzo
Para confirmar que tu cerebro asimiló el conocimiento como un verdadero ingeniero, respóndeme esto con tus propias palabras (y relacionándolo a los Sprints pasados): 

**Si mañana nuestro scraper extrae 10,000 comentarios de YouTube de golpe... ¿Qué pasaría con el hilo principal (Event Loop) de nuestro backend de NestJS si el `EmbeddingsService` procesara todo de manera directa (sincrónica) en el controlador, en lugar de estar integrado en los workers de nuestra cola de BullMQ?**

¡Responde esto y habremos completado el Sprint 15 con honores!

---

### 🏆 CIERRE DEL SPRINT Y PREGUNTAS FRECUENTES

**Tu Respuesta al Senior Pitch:** *"Se bloquearía el Event Loop y la app dejaría de responder. BullMQ permite trabajar en segundo plano gestionado por Redis."*
**Feedback del Mentor:** ¡10/10! 🎯 Exactamente. Node.js es single-thread. Si lo ponemos a calcular 10,000 vectores matemáticos en vivo, ningún otro usuario podría hacer login ni ver la página web porque el servidor estaría "congelado" pensando. Por eso diseñamos la arquitectura con BullMQ antes de hacer esto.

#### ❓ "¿En qué parte se está guardando en la BD y procesando en BullMQ?"
¡Excelente pregunta arquitectónica! La respuesta es: **Todavía en ninguna parte.** 
En la ingeniería de software profesional construimos piezas modulares separadas (Legos). 
1. En el Sprint 12 construimos la **Cola (BullMQ)**.
2. En este Sprint 15 construimos el **Traductor de Vectores (`EmbeddingsService`)**.
3. En el Sprint 16 (Auditor Narrativo), será el momento en que nuestro Worker de BullMQ inyectará este `EmbeddingsService`, agarrará el texto, lo convertirá a vector y llamará a Prisma para guardarlo en Postgres. ¡Paciencia, ya casi unimos todas las piezas!

#### 🚀 ¿Cómo testear el Endpoint en Bruno?
Para comprobar que la pieza de hoy funciona aisladamente, abre Bruno y haz lo siguiente:
1. Crea un nuevo request llamado **"Generar Embedding"**.
2. **Método:** `POST`
3. **URL:** `http://localhost:3000/ai/embed` *(o el puerto donde corra tu NestJS)*
4. En la pestaña **Body**, selecciona **JSON**.
5. Pega este contenido:
   ```json
   {
     "text": "Odio profundamente cuando la interfaz de usuario no es intuitiva"
   }
   ```
6. Dale a **Send**. Si todo está bien, verás la matriz de coordenadas lista.

¡Felicidades, lograste dominar los cimientos de la IA Vectorial local! 🚀

---

### 🐞 DEBUGGING SESSIONS (Lecciones de Trinchera)

Durante este sprint, nos topamos con dos errores formadores que te darán mucha cancha como Senior:

#### 1. Dependencia Circular de Archivos (TypeScript/Node.js)
El error: `The module at index [2] of the QueueModule "imports" array is undefined.`
* **¿Por qué pasó?** `queue.module.ts` exportaba la constante `SCRAPER_QUEUE`, pero a su vez importaba a `reddit.module.ts`, cuyo servicio importaba de vuelta a `queue.module.ts` para leer la constante. ¡Creamos un bucle infinito a nivel de archivos de Node.js!
* **La Solución Profesional:** Extraer todas las constantes compartidas a un archivo neutro y sin dependencias (`queue.constants.ts`). Así, tanto el módulo como el servicio leen de ahí sin atraparse mutuamente. Además, usamos `forwardRef()` en los módulos de NestJS para evitar que se bloqueen al inicializar.

#### 2. El Poder del Patrón "Fail-Fast"
El error: `TypeError: Configuration key "REDDIT_USER_AGENT" does not exist`
* **¿Por qué pasó y por qué es BUENO?** En el `RedditService`, utilizamos el método `configService.getOrThrow('REDDIT_USER_AGENT')`. Si hubiéramos usado el método normal `.get()`, la app habría arrancado "aparentemente" bien, devolviendo `undefined`, y hubiera fallado silenciosamente en producción a las 3 AM cuando intentara hacer peticiones HTTP.
* **La Lección:** Al usar `getOrThrow`, obligamos al servidor a morir ruidosamente al arrancar, avisándonos de inmediato que olvidamos poner esa clave crítica en nuestro archivo `.env`. ¡Falla rápido, arréglalo rápido!

#### 3. El Conflicto de Puertos (Prisma `ECONNREFUSED`)
El error: `Invalid this.prisma.user.create() invocation... ECONNREFUSED`
* **¿Por qué pasó?** El backend intentó guardar un usuario, pero la conexión a PostgreSQL fue rechazada. Esto ocurrió porque existía un conflicto de puertos: el servicio local de Postgres en Linux estaba ocupando el puerto `5432`, bloqueando que el contenedor de Docker pudiera exponer su propia base de datos en ese mismo puerto.
* **La Solución:** Apagar el servicio local (`sudo systemctl stop postgresql`) y volver a levantar Docker (`docker compose up`). Buen instinto de DevOps.

#### 4. El Síndrome del "Cable Desconectado" (Error 404 en Endpoints Nuevos)
El error: Al disparar a `http://localhost:3000/ai/embed` desde Bruno, recibíamos:
```json
{
  "message": "Cannot POST /ai/embed",
  "error": "Not Found",
  "statusCode": 404
}
```
* **¿Por qué pasó?** Creamos el `AiController` y lo registramos en el `AiModule`... ¡Pero nunca registramos el `AiModule` en el `AppModule` (el cerebro central)! Para NestJS, si un módulo no se importa en el `AppModule`, es un universo paralelo inalcanzable.
* **La Solución:** Añadir `AiModule` al arreglo de `imports` en `apps/backend/src/app.module.ts`. Siempre que crees un módulo nuevo, asegúrate de conectarlo a la nave nodriza.

---

### 🥂 CIERRE FINAL DEL SPRINT

¡IMPRESIONANTE! 🥳 Logramos probar el endpoint exitosamente en Bruno y obtuvimos la respuesta deseada: una matriz flotante de 768 dimensiones. Esa hermosa y caótica sopa de números es la famosa "coordenada de sabor" de la que hablábamos. 

Acabas de transformar lenguaje humano con todas sus sutilezas (frustración, odio, deseos) en un formato matemático que las máquinas y nuestra base de datos PostgreSQL pueden entender, procesar y agrupar de manera nativa. Has cruzado oficialmente la frontera de un Junior normal a un Backend Engineer que integra Inteligencia Artificial local.

Te felicito por sortear todos los obstáculos arquitectónicos de este módulo:
✅ Configuraste el Factory de Ollama.
✅ Creaste un traductor agnóstico (`EmbeddingsService`).
✅ Aprendiste a dominar la Dependencia Circular y el "Fail-Fast".
✅ Y expusiste tu módulo aislado para testing en Bruno.

Con este hito cerramos con honores el **Sprint 15**. ¡Respira hondo, celebra esta victoria y prepárate para el Sprint 16 cuando estés listo!

---

#### ❓ "¿Todo esto es más fácil de leer para la máquina que el texto mismo? ¿No son bastantes números por procesar?"
¡Esa es una pregunta digna de un Arquitecto de Datos! Tu intuición humana te dice: *"Leer 10 palabras es más fácil que calcular una matriz de 768 decimales larguísimos"*. Pero para el silicio de una computadora, es exactamente lo contrario.

1. **Las máquinas no entienden idiomas, entienden matemáticas:** Para que una base de datos tradicional sepa si *"lento"* y *"retraso"* se parecen, tiene que usar diccionarios, reglas gramaticales complejas y comparar fuerza bruta letra por letra. Es lentísimo e impreciso.
2. **La magia de la Distancia Espacial:** Cuando convertimos el texto en un vector de 768 números, la base de datos ya no lee letras. Solo agarra dos matrices numéricas y calcula la "distancia" entre ellas usando trigonometría básica (Similitud del Coseno). Si el resultado matemático da cerca de 1, significa que los conceptos son idénticos.
3. **Hardware nativo:** Los procesadores modernos (especialmente GPUs) están construidos físicamente para hacer operaciones de matrices masivas en nanosegundos (así es como renderizan los gráficos de los videojuegos 3D). Por lo tanto, cruzar un millón de matrices de 768 números es infinitamente más rápido y exacto para `pgvector` que intentar hacerle leer un millón de oraciones en español.

