# SPRINT 12: Scraper Processor

¡Entendido! Me pongo en modo Mentor Senior Staff Engineer. Me alegra verte de nuevo en la trinchera.

En el Sprint 11 preparamos el terreno montando nuestro `QueueModule` global y conectándonos a Redis. Ahora, en este **Sprint 12**, vamos a construir el **Scraper Processor**: el verdadero motor obrero que tomará esos trabajos de la cola, lidiará con la concurrencia y ejecutará reintentos cuando las APIs de Reddit o YouTube nos tiren errores o rate limits (límites de peticiones).

Siguiendo nuestro protocolo estricto, iniciamos con la Fase 1.

---

### [FASE 1: VERIFICACIÓN DE UTENSILIOS] | ⏱️ 3 min

Para construir nuestro _Processor_, necesitamos asegurarnos de que la infraestructura y las herramientas de visibilidad estén en su punto.

1. **El Motor de Datos (Redis):** Necesitamos que Redis esté corriendo en tu máquina. Como lo tenemos en Docker, abre tu terminal y ejecuta:

   ```bash
   docker ps
   ```

   _Verifica que haya un contenedor con la imagen `redis:alpine` (o similar) en estado `Up`. Si no está, levántalo con `docker compose up -d`._

2. **Visibilidad de la Cola (Extensión VS Code):** Cuando los trabajos fallen o se queden atascados, necesitamos ver qué pasa dentro de Redis sin usar comandos arcaicos en la terminal.
   - Ve a la pestaña de Extensiones en VS Code (`Ctrl+Shift+X` o `Cmd+Shift+X`).
   - Busca e instala **"Redis"** (la extensión oficial de _Chris Dias_ o _Redis_ funciona muy bien) o **"Redis Explorer"**.
   - _Alternativa pro:_ Si prefieres una interfaz web ligera luego, usaremos un paquete llamado `bull-board`, pero por ahora con que Redis esté vivo, estamos bien.

3. **Dependencias del framework:** En el Sprint anterior ya instalamos `@nestjs/bullmq` y `bullmq`. Solo por sanidad, confirma que tu terminal no marca errores de paquetes faltantes en tu backend.

_¡Excelente! Veo que `insight_redis` está corriendo perfecto en tu Docker. Sobre la extensión "Redis" de cweijan, es bastante usada en la comunidad, pero si no te da confianza, **no te preocupes**. No es estrictamente necesaria. Podemos usar los logs de nuestra terminal o instalar luego `bull-board` (un dashboard web oficial) si necesitamos ver las tripas de la cola._

---

### [FASE 2: LA ANALOGÍA DEL CHEF & EL "POR QUÉ"] | ⏱️ 5 min

**La Analogía:**
Imagina que nuestra API (NestJS) es el **Mesero** de un restaurante muy ocupado, y los Scrapers de Reddit/YouTube son los **Cocineros** de la parrilla.
Si el Mesero se queda esperando en la cocina a que el Cocinero termine de asar un corte de carne que toma 10 minutos (hacer scraping masivo), no podrá atender a los nuevos clientes que llegan al restaurante. El restaurante colapsa.

En su lugar, el Mesero toma la orden y la pone en una **"Cinta de Comandas" (La Cola de BullMQ en Redis)**. Luego, vuelve inmediatamente a atender mesas.
El **Scraper Processor** que vamos a construir es el **Jefe de Cocina**: toma los tickets de esa cinta uno por uno, asigna el trabajo y si a alguien se le quema la carne (error de la API de Reddit o un _rate limit_), el Jefe sabe exactamente cuántas veces puede volver a intentarlo (políticas de reintento) antes de tirarlo a la basura.

**El "Por Qué" (Senior Perspective):**
_¿Qué error de novato (Junior) evitamos al hacer esto?_
El error clásico es intentar ejecutar tareas pesadas o frágiles (como llamadas HTTP lentas a otras APIs) directamente en el ciclo de Petición-Respuesta (Request-Response) del controlador principal. Esto **bloquea el Event Loop de Node.js** y hace que los demás usuarios sientan que la app está caída. Al aislar esta lógica en un `Processor`, protegemos la memoria y velocidad de la API principal, ganamos resiliencia (reintentos automáticos sin que el usuario tenga que recargar la página) y podemos escalar el procesamiento agregando más "Cocineros" a futuro.

---

### [FASE 3: EL PLAN DE ACCIÓN (PASO A PASO)] | ⏱️ 7 min

Para no enredarnos, vamos a ejecutar este sprint en **3 mini-pasos** muy concretos:

1. **Crear el procesador:** Crearemos el archivo `scraper.processor.ts` dentro de la carpeta `src/queue/`.
2. **Conectar servicios:** Inyectaremos nuestro `RedditService` (y futuramente el de YouTube) dentro del procesador para que pueda hacer el trabajo real.
3. **Registrar al trabajador:** Añadiremos el procesador a los `providers` del archivo `queue.module.ts` para que NestJS lo reconozca y lo arranque junto con la aplicación.

**Los archivos clave en el campo de batalla:**

- `scraper.processor.ts` _(Nuevo)_: Este archivo es nuestro **Jefe de Cocina**. Usará decoradores especiales de BullMQ para "escuchar" una cola específica (ej. `scrape-queue`). Cuando llegue un trabajo, extraerá los datos (qué subreddits o videos queremos investigar) y llamará a los servicios correspondientes para procesarlo de forma asíncrona.
- `queue.module.ts` _(Modificación)_: Este archivo es el **Registro de Empleados**. Aquí es donde daremos de alta a nuestro `ScraperProcessor` (añadiéndolo a la lista de `providers`) para que el framework sepa que este trabajador existe y debe ponerlo a escuchar.

---

### [RESPUESTA DEL MENTOR: LA ANATOMÍA DE LOS NOMBRES DE ARCHIVO]

Excelente pregunta. Esa convención de nombres (`entidad.rol.ts`, ej: `scraper.processor.ts` o `user.service.ts`) no es un "patrón de diseño" formal del GoF (Gang of Four), sino una **Convención de Nomenclatura Estructural** heredada de **Angular** (el framework web en el que se inspiró NestJS).

**¿Por qué lo hacemos así?**

1. **Separación Visual Inmediata:** Si tienes 50 archivos abiertos en tu editor, al leer `reddit.service.ts` y `reddit.controller.ts`, tu cerebro sabe en milisegundos que el primero tiene "lógica de negocio pesada" y el segundo "solo recibe rutas HTTP".
2. **Descubrimiento y Herramientas (CLI):** Las herramientas automatizadas (como el CLI de NestJS) o los linters pueden usar expresiones regulares para buscar archivos que terminen en `.module.ts` y saber que ahí deben inyectar dependencias automáticamente.
3. **Cohesión de Dominio:** En lugar de tener una carpeta gigante llamada `controllers/` y otra `services/` (patrón MVC clásico tipo Ruby on Rails), NestJS usa un patrón de "Estructura por Funcionalidad" (Feature-based structure). Todo lo de Reddit va en la carpeta `reddit/`, y los sufijos `.service`, `.controller`, `.module` nos dan el contexto y rol exacto de ese bloque de código.

_(Fin de la nota mental de arquitectura, ¡ahora al combate!)_

---

### [FASE 4: EL COMBATE (CODIFICACIÓN GUIADA)] | ⏱️ 20 min

Vamos a crear nuestro **Jefe de Cocina**.

1. Crea el archivo `scraper.processor.ts` dentro de `apps/backend/src/queue/`.
2. Pega la siguiente estructura base e intenta rellenar los huecos (`_____`).

**Estructura Base (`scraper.processor.ts`):**

```typescript
import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { Logger } from "@nestjs/common";
// Ojo: verifica que la ruta de tu RedditService coincida
import { RedditService } from "../reddit/reddit.service";

// 1. Decorador que convierte esta clase en un Processor y la suscribe a la cola 'scrape-queue'
@_____(_____)
export class ScraperProcessor extends _____ {
  private readonly logger = new Logger(ScraperProcessor.name);

  // 2. Inyección de dependencias: Traemos la "receta" de Reddit
  constructor(private readonly redditService: _____) {
    super();
  }

  // 3. Este método es el que se ejecuta automáticamente cuando llega un nuevo ticket a la cola
  async _____(job: Job<any, any, string>): Promise<any> {
    this.logger.debug(`¡Nuevo ticket recibido! Job ID: ${job.id}`);

    // Extraemos la información del trabajo. Asumimos que viene con { subreddit: 'startups', limit: 50 }
    const { subreddit } = job.data;

    try {
      this.logger.log(`Procesando scraping para: ${subreddit}`);

      // 4. Llamamos a la función real de scraping de nuestro servicio (ej. fetchTopPosts)
      const result = await this._____._____(subreddit);

      this.logger.log(
        `Scraping finalizado para ${subreddit}. Items: ${result?.length || 0}`,
      );
      return result;
    } catch (error) {
      this.logger.error(`Error escrapeando ${subreddit}:`, error);
      // Lanzamos el error de nuevo para que BullMQ sepa que el Job falló y aplique reintentos
      throw error;
    }
  }
}
```

#### Desglose de Sintaxis (Análisis antes de que rellenes)

- `@Processor('nombre')`: Es una función decoradora (Metadata) de `@nestjs/bullmq` que le avisa a NestJS que esta clase escuchará eventos de Redis.
- `WorkerHost`: Es una clase base abstracta de BullMQ. Nuestra clase debe **heredar** de ella (`extends`) para tener el superpoder de procesar trabajos en el ecosistema Nest.
- `constructor(private readonly ...)`: El patrón clásico de **Inyección de Dependencias**. Le decimos al framework: "Cuando crees este procesador, necesito que me pases una instancia viva del servicio de Reddit".
- `job: Job`: Es el ticket de pedido. Viene con `.id`, `.data` (los datos que mandamos al encolar) y más utilidades.
- El método principal de la clase que hereda de `WorkerHost` suele llamarse `process` obligatoriamente para cumplir con el contrato de la interfaz.

---

### [FASE 4.1: ANÁLISIS SINTÁCTICO PROFUNDO (LÍNEA A LÍNEA)]

¡Excelente trabajo rellenando los huecos! El código está **perfecto** y usaste `fetchSubredditHot`, lo cual es correcto. Como solicitaste, aquí tienes la radiografía gramatical y sintáctica de todo el archivo, como si estuviera leyendo el código a una computadora humana:

```typescript
// 1. Las Importaciones
import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { Logger } from "@nestjs/common";
import { RedditService } from "../reddit/reddit.service";
```

- **`import { ... } from '...'`**: Sintaxis estándar de ES6 (ECMAScript 6) para traer código de otros archivos o librerías. Lo que está entre llaves `{}` se llama **Destructuración de Importación**, significa "trae solo estas piezas específicas del paquete, no todo el paquete".

```typescript
@Processor('scrape-queue')
```

- **`@` (Arroba)**: En TypeScript, esto denota un **Decorador**. Un decorador es literalmente una función que "envuelve" a la clase que tiene debajo y le inyecta metadatos (información invisible). En este caso, le dice al framework NestJS: _"Oye, la clase que viene aquí abajo no es una clase normal, es un consumidor de la cola llamada 'scrape-queue'"_.

```typescript
export class ScraperProcessor extends WorkerHost {
```

- **`export`**: Hace que esta clase sea pública para que otros archivos (como nuestro `queue.module.ts`) puedan importarla.
- **`class`**: Define el plano/molde de nuestro objeto (Programación Orientada a Objetos).
- **`extends WorkerHost`**: La palabra clave `extends` indica **Herencia**. Estamos diciendo que `ScraperProcessor` es un hijo de la clase `WorkerHost` (que viene de BullMQ). Al ser hijo, hereda métodos y propiedades internas que BullMQ necesita para manejar los hilos de trabajo (workers) por debajo.

```typescript
  private readonly logger = new Logger(ScraperProcessor.name);
```

- **`private`**: Modificador de acceso. Significa que este `logger` solo puede ser usado _dentro_ de esta clase. Ningún archivo externo puede llamarlo.
- **`readonly`**: Impide que alguien reasigne el valor de `this.logger` después de que se ha inicializado. Protege la variable de modificaciones accidentales.
- **`new Logger(...)`**: Instancia un objeto de la clase `Logger` de NestJS. Le pasamos `ScraperProcessor.name` (que devuelve el string `"ScraperProcessor"`) para que en la terminal veamos los mensajes con el prefijo `[ScraperProcessor]`. Es puro orden visual.

```typescript
  constructor(private readonly redditService: RedditService) {
    super();
  }
```

- **`constructor`**: Es la función especial que se ejecuta automáticamente en el instante en que NestJS crea (instancia) esta clase en la memoria.
- **`(private readonly redditService: RedditService)`**: Esto es "Inyección de Dependencias" y TypeScript hace magia aquí. Al poner `private readonly` dentro de los paréntesis del constructor, TypeScript automáticamente crea una variable en la clase y le asigna el valor. NestJS lee el tipo `RedditService` y dice: _"Ah, él necesita el servicio de Reddit. Yo se lo paso automáticamente."_
- **`super();`**: **CRÍTICO**. Como nuestra clase hereda (`extends`) de `WorkerHost`, estamos obligados a llamar al constructor de nuestro padre antes de hacer cualquier cosa. `super()` invoca el constructor de `WorkerHost` para que se inicialice correctamente. Si lo borras, TypeScript arrojará un error.

```typescript
  async process(job: Job<any, any, string>): Promise<any> {
```

- **`async`**: Declara que esta función es asíncrona, lo que significa que nos permite usar la palabra clave `await` por dentro para esperar operaciones lentas (como peticiones HTTP).
- **`process`**: Este nombre no es aleatorio. La clase padre `WorkerHost` nos obliga por contrato (interface) a implementar una función llamada exactamente `process`. Es el punto de entrada de cada trabajo.
- **`job: Job<any, any, string>`**: Declaramos un parámetro llamado `job` de tipo `Job` (clase de bullmq). Los `< >` son **Genéricos** en TypeScript. Definen el tipo de datos que maneja el trabajo: `<TipoDelData, TipoDelResultado, TipoDelNombre>`. Aquí usamos `any` para no complicarnos por ahora, y `string` para el nombre de la cola.
- **`: Promise<any>`**: Tipado de retorno. Significa "Esta función devolverá una Promesa (porque es `async`) que eventualmente resolverá en cualquier tipo de dato (`any`)".

```typescript
this.logger.debug(`¡Nuevo ticket recibido! Job ID: ${job.id}`);
const { subreddit } = job.data;
```

- **`job.data`**: Accede a la propiedad `data` del objeto `job`. Aquí es donde viven los parámetros reales que nosotros encolamos (ej. `{ subreddit: 'startups' }`).
- **`const { subreddit } = ...`**: **Destructuración de Objetos**. En lugar de escribir `const subreddit = job.data.subreddit;`, sacamos directamente la propiedad `subreddit` del objeto en una línea elegante.

```typescript
    try { ... } catch (error) { ... }
```

- **`try/catch`**: Bloque de control de errores. El código intenta ejecutar el bloque `try`. Si _cualquier_ cosa falla dentro (ej. se cae el internet, la API de Reddit devuelve un error 500), la ejecución salta instantáneamente al bloque `catch` con el detalle del `error`.

```typescript
const result = await this.redditService.fetchSubredditHot(subreddit);
return result;
```

- **`await`**: Pausa la ejecución de _esta función_ (sin bloquear a toda la aplicación) hasta que `fetchSubredditHot` termine de traer los datos y resuelva su promesa.
- **`return result`**: Al terminar el bloque `process`, devolvemos el resultado. BullMQ agarra este valor retornado y lo guarda en Redis como el resultado exitoso del Job, por si queremos consultarlo después.

```typescript
throw error;
```

- **`throw`**: Significa "Lanzar". Al atrapar el error en el `catch`, lo imprimimos en consola, pero luego lo volvemos a lanzar (`throw error`). **¿Por qué?** Si no lo lanzamos, la función `process` terminaría "exitosamente" en silencio, y BullMQ pensaría que el trabajo se completó bien. Al lanzarlo, la función colapsa, BullMQ detecta el colapso, marca el Job como `FAILED` y evalúa si debe reintentarlo.

---

### [FASE 4.3: ANÁLISIS SINTÁCTICO DE QUEUE.MODULE (Y UNA PEQUEÑA CORRECCIÓN SENIOR)]

Veo los cambios en tu `queue.module.ts`. Has hecho un gran trabajo deduciendo qué piezas faltaban, pero como tu Mentor Senior, detecté un pequeño "gotcha" (trampa) muy común en NestJS sobre dónde colocar el `RedditModule`.

Antes de la explicación línea a línea, **corrige esto en tu archivo**:
Sacaste el `RedditModule` y lo metiste en los `imports` de `BullModule.forRootAsync`. Esto hace que el módulo de Redis conozca Reddit, pero quien necesita conocer a Reddit es el `QueueModule` en sí (porque él es el jefe directo del `ScraperProcessor`).

**Debe quedar así en tu archivo:**

```typescript
@Module({
  imports: [
    RedditModule, // <-- ¡Aquí va! A nivel del QueueModule
    BullModule.forRootAsync({
      imports: [ConfigModule], // El BullModule solo necesita el ConfigModule para leer el .env
      // ...
    }),
    BullModule.registerQueue({ name: SCRAPER_QUEUE }),
  ],
  exports: [BullModule],
  providers: [ScraperProcessor],
})
```

_Haz ese cambio rápido en tu código._

Ahora sí, **la radiografía gramatical y sintáctica de tu archivo `queue.module.ts`:**

```typescript
import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { ScraperProcessor } from "./scraper.processor";
import { RedditModule } from "../reddit/reddit.module";
```

- **Importaciones:** Igual que antes, traemos las piezas necesarias. `BullModule` es la librería oficial para Redis, `ConfigModule` es para leer variables de entorno (`.env`), y nuestras propias clases locales (`ScraperProcessor` y `RedditModule`).

```typescript
export const SCRAPER_QUEUE = "scraper";
```

- **`export const`**: Definimos una constante inmutable y la hacemos pública.
- **Por qué:** Los "Magic Strings" (strings quemados en el código como `'scraper'`) son peligrosos. Si mañana le cambias el nombre a la cola y se te olvida actualizarlo en un rincón de la app, todo se rompe en silencio. Al usar una constante, si la cambias aquí, se actualiza automáticamente en toda la app donde la importes.

```typescript
@Module({ ... })
export class QueueModule { }
```

- **`@Module(...)`**: El decorador rey de NestJS. Envuelve una clase vacía (`QueueModule`) y la convierte en un bloque de construcción arquitectónico. Todo dentro de NestJS está agrupado en Módulos (como si fueran piezas de Lego).

```typescript
  imports: [ ... ]
```

- **`imports`**: Es la lista de "Dependencias de Módulos". Aquí le decimos: _"Para que el `QueueModule` funcione, necesito que traigas las herramientas del `RedditModule` (para que el processor pueda escrapear) y de `BullModule` (para conectarme a la cola)"_.

```typescript
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST'),
          port: configService.get<number>('REDIS_PORT'),
        },
      }),
    }),
```

- **`forRootAsync`**: Configuración global y asíncrona de BullMQ. A diferencia de un `forRoot` normal donde le pasas la IP fija, aquí le decimos: _"Espérate a que la app lea el archivo `.env` antes de intentar conectarte a Redis"_.
- **`imports: [ConfigModule]` (interno)**: Le dice a BullMQ que necesita usar el servicio de configuración para existir.
- **`inject: [ConfigService]`**: Inyecta literalmente el servicio de variables de entorno dentro de la función de abajo.
- **`useFactory: async (...) => ({ ... })`**: El patrón **Factory** (Fábrica). Es una función que construye dinámicamente el objeto de configuración. Llama a `configService.get()` para leer tu `.env` y retorna las credenciales de Redis.

```typescript
    BullModule.registerQueue({ name: SCRAPER_QUEUE }),
```

- **`registerQueue`**: Mientras `forRoot` establece la conexión general, `registerQueue` crea/registra una "bandeja de entrada" específica en Redis. En este caso, registra la cola llamada `scraper`.

```typescript
  exports: [ BullModule ],
```

- **`exports`**: Hace que lo que está adentro sea público para _otros módulos_ que importen el `QueueModule`. Si nuestro "Mesero" (ej. un Controlador en otro lado) quiere meter trabajos a la cola, necesita acceder a `BullModule`. Al exportarlo aquí, se lo facilitamos.

```typescript
  providers: [ ScraperProcessor ],
```

- **`providers`**: La lista de "Trabajadores" que pertenecen a este módulo. Al poner a `ScraperProcessor` aquí, NestJS lo instancia al arrancar la app, le inyecta su `RedditService` que sacó del `RedditModule`, y lo deja corriendo de fondo escuchando a Redis.

---

### [FASE 5: EL SENIOR PITCH & CIERRE] | ⏱️ 10 min

¡Felicidades! Has implementado una arquitectura de colas asíncronas con persistencia y aislamiento de responsabilidades. Esto es trabajo de nivel mid-senior para arriba.

**🎤 Tu "Pitch" para entrevistas (Memoriza esto):**

> _"Para evitar bloquear el Event Loop de Node.js con tareas intensivas de scraping, implementé una arquitectura dirigida por eventos utilizando BullMQ y Redis. Extraje la lógica pesada del ciclo de Request-Response hacia un `ScraperProcessor` dedicado en background, manejando la concurrencia e inyectando los servicios de dominio necesarios de forma modular. Esto garantiza resiliencia ante rate-limits externos gracias a las políticas de reintentos de la cola."_

**🧠 Pregunta de Refuerzo (Responde por el chat):**
Si nuestro "Jefe de Cocina" (`ScraperProcessor`) se cayera porque la base de datos de Reddit se apagó temporalmente y la función arrojara un error, **¿qué pasaría con ese "Ticket" (Job) en nuestra arquitectura actual?** 
1. ¿Se pierde para siempre y el usuario nunca obtiene sus datos?
2. ¿Se queda atascado en el limbo bloqueando a los demás?
3. ¿Pasa algo más gracias a BullMQ y cómo programamos el `throw error`?

---

### [RESPUESTA FINAL DEL MENTOR: EL GRAN CUADRO Y LA MAGIA DE BULLMQ]

**1. ¿En qué parte del flujo entra el Scraper Processor?**
Excelente duda arquitectónica. Imagina el flujo de datos así:
1. **El Cliente (Frontend/Usuario)** hace un POST a `/api/scrape` diciendo: *"Quiero datos del subreddit de startups"*.
2. **El Controlador (El Mesero)** recibe esa petición. En lugar de hacer el scraping ahí mismo (lo cual tardaría mucho y haría que la petición HTTP del usuario diera un error de *timeout*), el controlador inyecta la cola y hace algo como esto: `await this.scrapeQueue.add('reddit-job', { subreddit: 'startups' })`.
3. El Controlador le responde casi instantáneamente al usuario: *"¡Pedido recibido! Estamos procesándolo en background"*.
4. **Redis (La Cinta de Comandas)** recibe ese ticket (Job) y lo guarda en su memoria de forma segura.
5. **(AQUÍ ENTRA NUESTRO ARCHIVO)** El `ScraperProcessor` (El Cocinero), que está siempre vivo escuchando en el fondo gracias a `@Processor('scrape-queue')`, ve que hay un ticket nuevo. Lo saca de la fila y empieza a ejecutar automáticamente su función `process()`.

En resumen: El **Controlador** (que ensamblaremos en otro Sprint para exponer la API) es quien mete los trabajos a la cola, y nuestro **ScraperProcessor** es un demonio silencioso que los va sacando y ejecutando uno a uno.

**2. Sobre la Pregunta de Refuerzo (El `try/catch` y el `throw error`)**
Tu respuesta es parcialmente correcta: el `catch` nos permite capturar el error y registrar un mensaje con nuestro Logger. ¡Pero la magia real ocurre por el **`throw error;`**!
Si solo logueamos el mensaje y no lanzamos el error de nuevo, la función `process` termina su ejecución normalmente y BullMQ pensaría: *"Ah, terminó sin crashear. Job COMPLETADO exitosamente"*. ¡Los datos se perderían para siempre!
Al lanzar explícitamente el `throw error`, le estamos gritando al framework: *"¡Colapsé!"*. BullMQ atrapa ese grito y hace 3 cosas automáticas:
- Marca el Job como **FAILED**.
- No lo borra de Redis (para que podamos inspeccionarlo con la extensión que descargaste).
- **Aplica las políticas de reintentos:** Si le decimos a la cola "Reintenta 3 veces si fallas", BullMQ automáticamente esperará unos segundos y volverá a empujar el ticket al Processor.

---

### [MENTOR MASTERCLASS: LA MAGIA OCULTA DE NESTJS (INVERSIÓN DE CONTROL)]

Es una duda brillante y es el obstáculo mental más grande de todo desarrollador Junior que entra a NestJS (o Spring Boot en Java, o Angular). 

Estás acostumbrado a la programación procedural o imperativa donde **tú tienes el control absoluto**: tú creas las instancias (`const p = new Processor()`) y tú dictas explícitamente cuándo actúan (`p.process()`). Si no lo escribes, no pasa.

Pero NestJS funciona bajo un principio de ingeniería de software llamado **Inversión de Control (IoC - Inversion of Control)**. Literalmente significa: *"Tú ya no llamas al código; el Framework llama a tu código"*.

**¿Cómo y cuándo sabe NestJS que es el turno del ScraperProcessor?**
Todo ocurre gracias a dos magias invisibles:

1. **El Arranque (El Escáner de Módulos):** 
Cuando ejecutas la aplicación (`npm run start:dev`), NestJS lee el `QueueModule` y ve a `ScraperProcessor` en la lista de `providers`. En ese preciso instante de arranque, NestJS dice: *"Ok, el desarrollador quiere que este trabajador exista"*. Él hace el `new ScraperProcessor()` por debajo, sin decírtelo, y lo deja vivo en la RAM de tu computadora.

2. **El Decorador "Chismoso" (Event Listener):** 
El texto `@Processor('scrape-queue')` no es solo un adorno. Los decoradores en TypeScript son en realidad funciones complejas que se inyectan en tu clase. Cuando NestJS arranca y ve ese decorador, la librería de BullMQ ejecuta internamente un código similar a esto:
   ```typescript
   // LO QUE NESTJS HACE EN SECRETO POR TI:
   redisConnection.subscribe('scrape-queue');
   redisConnection.on('nuevo_mensaje', (job) => {
       scraperProcessor.process(job); // <- ¡Aquí está la llamada que buscabas!
   });
   ```

**¡Esa es la pieza del rompecabezas que no veías!** El código que dice *"Es tu turno, interviene"* está escondido dentro del decorador `@Processor`. Tú jamás llamas a la función `process()`. BullMQ lo hace automáticamente usando eventos (Pub/Sub) tan pronto como Redis le avisa que entró un nuevo ticket.

Y así pasa con todo en NestJS:
- En un `@Controller()`, tú no escribes `app.get('/ruta', funcion)`. Pones `@Get('/ruta')` y el framework amarra la ruta por ti.
- En un `@Injectable()`, tú no pasas las variables de un archivo a otro. NestJS lee los `constructors` y se las pasa como por arte de magia.

Tu trabajo como ingeniero en NestJS **no es conectar las tuberías manualmente**, sino **etiquetar bien las piezas** (`@Processor`, `@Controller`) y decirle a RRHH (`module.ts -> providers`) que las contrate. El framework hace la fontanería en secreto.

Dime si este concepto de *"Inversión de Control"* y *"Decoradores"* hace que el esqueleto de la aplicación te haga mucho más sentido ahora. ¡Piénsalo y me cuentas!```
