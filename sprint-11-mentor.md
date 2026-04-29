# Sprint 11: BullMQ Queue Setup - Mentor Notes

### [FASE 1: VERIFICACIÓN DE UTENSILIOS] | ⏱️ 3 min

✅ Completado. Redis corriendo y dependencias instaladas.

---

### [FASE 2: LA ANALOGÍA DEL CHEF & EL "POR QUÉ"] | ⏱️ 5 min

**1. La Analogía del Chef (La Ticketera de Comandas):**
Imagina que tu servidor Node.js es un restaurante de alta cocina con un solo mesero ultra-rápido (el Event Loop). Si un cliente pide un café (una petición HTTP rápida), el mesero lo sirve al instante.
Pero, ¿qué pasa si el cliente pide un "Asado a fuego lento que tarda 12 horas" (Hacer scraping de 5000 comentarios en Reddit)?
Si no usamos BullMQ, el mesero se quedará parado frente al horno mirando el asado durante horas. Mientras tanto, 50 clientes más entran al restaurante y nadie los atiende. El restaurante colapsa.
BullMQ es nuestra **Ticketera de Comandas de Acero (Redis)**. El mesero anota "Asado para la mesa 5", lo clava en la ticketera y vuelve inmediatamente a atender más mesas. En la parte de atrás, un equipo especial de cocineros lentos (Workers) van tomando los tickets uno por uno sin estorbar al mesero.

**2. El "Por Qué" (Palabra de Senior):**
_¿Qué error de novato (Junior) evitamos al hacer esto de esta forma profesional?_

**Evitamos el "Event Loop Blocking" y la muerte por Timeouts.**
Un junior suele poner la lógica pesada de scraping o IA directamente dentro del Controlador o el Servicio síncrono. Como Node.js es de un solo hilo (Single-Threaded) para su ciclo de eventos, una tarea pesada congela toda la aplicación. Nadie más podría hacer _login_ ni ver su perfil mientras ocurre el scraping.
Al usar BullMQ + Redis, **desacoplamos** la petición HTTP del procesamiento pesado. Le respondemos rápido al frontend con un `HTTP 202 Accepted` ("Ya estamos procesando tu petición, te avisamos luego") y liberamos nuestro servidor para que escale horizontalmente sin ahogarse.

---

**Status:** FASE 2 Completada.

### [FASE 3: EL PLAN DE ACCIÓN (PASO A PASO)] | ⏱️ 7 min

Para configurar nuestra "Ticketera", vamos a crear/modificar 3 archivos clave en un módulo dedicado. Aquí tienes nuestros 4 mini-pasos tácticos:

1. **Configurar el módulo global de Redis (`queue.module.ts`)**:
   Este archivo es el cable que conecta nuestra aplicación a la base de datos de Redis usando tus variables de entorno. Lo haremos global para que cualquier parte de la app pueda inyectar trabajos en la cola.

2. **Registrar la cola específica (`queue.module.ts`)**:
   Dentro del mismo archivo, crearemos una cola con un nombre único (ej. `SCRAPER_QUEUE`). Esta será la "bandeja de entrada" donde dejaremos los tickets para analizar Reddit o YouTube.

3. **Importarlo en la raíz (`app.module.ts`)**:
   Conectaremos nuestro nuevo `QueueModule` al cerebro principal de la app para que se inicialice al arrancar el servidor.

4. **Crear el Productor de la tarea (Preparación para Fase 4)**:
   Modificaremos temporalmente un servicio o crearemos un controlador de prueba que actúe como el "Mesero": aquel que simplemente toma los datos y hace `queue.add('nombre-tarea', datos)`.

_(Nota: En el Sprint 12 crearemos el "Worker/Procesador" que ejecuta la tarea. En este sprint nos centramos en que el mensaje entre exitosamente a la cola)._

---

**Status:** FASE 4 Completada.

### [RESUMEN DEL SPRINT: EL FLUJO DE DATOS EXPLICADO]

Has hecho un trabajo increíble, pero es normal sentirse abrumado. Aquí tienes la "fotografía completa" (The Big Picture) de cómo fluyen los datos y cómo se conectan los archivos que tocamos hoy:

#### La Infraestructura de la "Ticketera"

Todo se basa en **Redis**. Redis no es más que una base de datos extremadamente rápida que vive en la memoria RAM de tu computadora. BullMQ es simplemente una librería de Node.js que sabe cómo hablar muy bien con Redis para guardar "tickets" (Jobs) en forma de listas, para que no se pierdan.

#### ¿Cómo se conectan los archivos?

1. **`app.module.ts` (El Tablero Eléctrico Principal)**
   - **Qué hace:** Es el punto de entrada de tu backend. Al arrancar NestJS, mira este archivo para saber qué "módulos" debe encender.
   - **Nuestra acción:** Le conectamos el `QueueModule` para que NestJS sepa que la infraestructura de colas existe y debe inicializarse.

2. **`queue.module.ts` (El Enchufe a Redis)**
   - **Qué hace:** Este archivo tiene dos misiones:
     a) Conectarse a Redis (usando tu `.env` a través de `useFactory`).
     b) Crear una bandeja de entrada específica llamada `SCRAPER_QUEUE` (la ticketera).
   - **Por qué es un módulo separado:** Porque el día de mañana puede que tengas una cola para correos electrónicos (`EMAIL_QUEUE`) o una para procesar videos (`VIDEO_QUEUE`). Todo se registra centralizadamente aquí.

3. **`reddit.service.ts` (El Mesero / Productor)**
   - **Qué hace:** Es el encargado de ir a la API de Reddit, traer los datos crudos, y... en lugar de procesarlos, se los "lanza" a la ticketera de Redis.
   - **La Conexión:** Usa `@InjectQueue(SCRAPER_QUEUE)` para obtener acceso a la bandeja que creamos en el punto 2. Luego usa `.add('analyze-reddit-data', datos)` para clavar un ticket con los datos adentro.

#### El Flujo de Datos (Paso a Paso)

1. **Petición HTTP:** El frontend de "Insight Engine" llama a tu endpoint de Reddit pidiendo analizar la comunidad "r/artificial".
2. **Extracción (Scraping):** El `RedditService` va rápido a la API de Reddit y descarga los últimos 10 posts. (En este momento los datos están en variables de Node.js).
3. **El Encolado (Enviando a Redis):** El `RedditService` llama a `this.scraperQueue.add(...)`. Aquí, BullMQ toma esos 10 posts, los convierte a texto (JSON), viaja por la red local hacia el contenedor Docker de Redis, y los guarda permanentemente en la memoria RAM de Redis bajo la etiqueta `'analyze-reddit-data'`.
4. **Respuesta Rápida:** Node.js no se quedó procesando nada con IA. Simplemente guardó el ticket y le responde de inmediato al frontend: _"Listo, ya tengo los datos y los mandé a la cocina"_.

#### ¿Dónde están los datos al terminar este sprint?

¡Tu instinto fue **100% correcto**! Los datos extraídos de Reddit ahora mismo **viven en la memoria de Redis**, esperando. Se quedaron ahí sentados en la sala de espera (la cola).

En el **Sprint 12**, construiremos al "Cocinero" (El Worker). El cocinero se conectará a Redis, sacará ese ticket de la cola, leerá los posts, usará Ollama para el análisis sociológico, y finalmente los guardará permanentemente en la base de datos de PostgreSQL.

---

**Status:** Sprint 11 finalizado con éxito. Listo para el Sprint 12 (El Procesador).
