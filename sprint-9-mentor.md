# Sprint 9: YouTube Data API (Mentorías)

¡Entendido, recluta! Prepárate, porque a partir de este momento entramos en modo "Senior". Mi objetivo no es solo que escribas código, sino que entiendas la arquitectura detrás de él para que puedas defender cada línea en una entrevista de nivel Top-Tier.

Vamos a abordar el **Sprint 9: YouTube Data API**. Nuestro objetivo aquí es construir la tubería por donde entrará la materia prima de nuestro motor de insights: los comentarios y metadatos de YouTube.

Empecemos con la primera fase.

### [FASE 1: VERIFICACIÓN DE UTENSILIOS] | ⏱️ 3 min

Para este módulo vamos a necesitar conectar nuestro backend con los servidores de Google. Revisa tu "cinturón de herramientas" y confírmame que tenemos lo siguiente:

1. **El SDK Oficial de Google:** No vamos a reinventar la rueda haciendo peticiones HTTP a mano. Usaremos la librería oficial.
   - **Instalación:** Abre tu terminal y ejecuta este comando para agregarlo específicamente al backend (asumiendo que usamos `pnpm` con Turborepo):

     ```bash
     pnpm --filter backend add googleapis
     ```

2. **Llave de Acceso (API Key) de Google Cloud:** Google no deja que cualquiera extraiga sus datos de forma anónima a nivel masivo. Necesitamos un "pase de acceso".
   - **Cómo verificarlo:**
     1. Ve a la [Google Cloud Console](https://console.cloud.google.com/).
     2. Crea un proyecto nuevo (si no lo tienes).
     3. Ve a "APIs y Servicios" > "Biblioteca" y busca **YouTube Data API v3**. Habilítala.
     4. Ve a "Credenciales", haz clic en "Crear credenciales" y selecciona **Clave de API**.
     5. Guarda esa clave temporalmente en un lugar seguro (luego la pondremos en nuestras variables de entorno).

**¿Tienes la librería instalada y tu API Key lista en la mano? Escribe en el chat para confirmarme y pasar a la Fase 2.**

✅ _Completado: API Key lista y `googleapis` instalado._

---

### [FASE 2: LA ANALOGÍA DEL CHEF & EL "POR QUÉ"] | ⏱️ 5 min

**La Analogía:**
Imagina que YouTube es un gigantesco mercado mayorista de ingredientes (comentarios, vistas, likes). Como chef, necesitas esos ingredientes para el menú de tu restaurante (Insight Engine). Un cocinero inexperto saldría corriendo al mercado cada vez que necesita _un solo tomate_, agotándose en el viaje. Peor aún, el guardia de seguridad del mercado (el Rate Limit de Google) lo echaría a patadas por entrar y salir 500 veces en un minuto alterando el orden.

Nosotros, como Chefs Senior, no trabajamos así. Vamos a construir un **"Proveedor Oficial"** (un Service/Provider en NestJS). Este proveedor se encargará de hacer pedidos calculados, en bloque y de forma ordenada (Asíncrona), controlando estrictamente cuántos viajes hace para que el guardia del mercado jamás nos bloquee la entrada por pasarnos de la Cuota.

**El "Por Qué" Senior:**

- **¿Qué error de novato evitamos?** Evitamos el terrible "Error 429: Too Many Requests" (bloqueo por hacer muchas peticiones) y evitamos el "Acoplamiento Fuerte" (Strong Coupling).
- **Sustento:** Un junior pondría las llamadas a la API de YouTube directamente en los controladores o en la lógica de negocio principal. Si mañana YouTube cambia su SDK, o si decides cambiar YouTube por Vimeo, tendrías que reescribir medio backend. Al encapsular toda la lógica de Google en un único `youtube.provider.ts`, protegemos al resto de nuestra aplicación. El resto del sistema solo le dirá al Provider: _"Dame los datos de este video"_, y no le importará si el Provider usa la librería oficial de Google, llamadas HTTP puras, o palomas mensajeras para conseguirlos. Además, centralizarlo nos permitirá luego meter un sistema de control de colas (nuestro siguiente sprint con BullMQ) sin ensuciar la lógica.

**¿Tiene sentido para ti esta separación de responsabilidades y la necesidad de controlar la cuota? Confírmame por el chat para que saquemos los planos arquitectónicos en la Fase 3.**

✅ _Completado: Comprendida la separación de responsabilidades._

---

### RESPUESTA A TU DUDA ESTRATÉGICA 🧠

Excelente pregunta, visión de arquitecto. Tienes toda la razón: la verdadera "Arqueología de la Frustración" no viene de un video al azar, sino de videos altamente rankeados (donde se concentra la masa de usuarios).
Sin embargo, nuestro `youtube.provider.ts` será **agnóstico** (independiente) de esa lógica de negocio. El Provider solo sabrá hacer dos cosas maravillosamente bien: _"Buscar videos por temática"_ y _"Extraer comentarios de un video específico"_. La lógica inteligente de _cuáles_ videos buscar y _cómo_ rankearlos la manejaremos en Sprints posteriores (en el `scraper.processor.ts` y la Inteligencia Artificial). A esto se le llama **Separación de Preocupaciones (Separation of Concerns)**.

---

### [FASE 3: EL PLAN DE ACCIÓN (PASO A PASO)] | ⏱️ 7 min

Vamos a construir nuestra infraestructura de Google en 4 mini-pasos para mantenerlo modular y seguro:

1. **Inyección de Entorno:** Vamos a configurar tu API Key en las variables de entorno (`.env`) y a decirle a nuestro `Zod Config Module` (del Sprint 3) que valide su existencia. (Protección contra olvidos en producción).
2. **Generación del Módulo:** Crearemos el esqueleto de NestJS (`youtube.module.ts` y `youtube.provider.ts`).
3. **Método de Radar (`searchVideos`):** Construiremos la función para buscar los videos más relevantes de un nicho específico, controlando los resultados máximos.
4. **Método de Extracción (`getVideoComments`):** Construiremos la función que extraerá los comentarios del video, implementando un control de paginación (porque Google no te da todos los comentarios en una sola petición).

**Archivos que vamos a tocar o crear:**

- `.env` y `config.schema.ts`: Aquí guardaremos y validaremos tu llave secreta. (Este archivo asegura que la app no inicie si alguien olvida poner la API Key en el servidor).
- `youtube.module.ts`: El "distribuidor". Este archivo le dirá al resto de NestJS: _"Hey, el servicio de YouTube está disponible si lo necesitan"_.
- `youtube.provider.ts`: El "Motor Pesado". Este archivo es el único que hablará directamente con Google y consumirá la librería `googleapis`.

**¿Están claros los pasos y los archivos que vamos a modificar? Confírmame por el chat para ponernos los guantes, sacar el código base y pasar a la Fase 4: El Combate.**

✅ _Completado: Listo para el combate._

---

### [FASE 4: EL COMBATE (CODIFICACIÓN GUIADA)] | ⏱️ 20 min

¡Manos a la obra, soldado! Vamos a atacar el **Mini-Paso 1 (Inyección de Entorno)** y el **Mini-Paso 2 (El Provider Base)**.

#### Misión 1: Zod Config

Primero, ve a `apps/backend/src/config/config.schema.ts`. Necesitamos que Zod exija la existencia de `YOUTUBE_API_KEY`.
También, no olvides agregar tu llave real al archivo `apps/backend/.env`.

**Estructura Base (`config.schema.ts`):**

```typescript
export const envSchema = z.object({
  POSTGRES_USER: z.string(),
  // ... otras variables ...
  DATABASE_URL: z.url(),
  YOUTUBE_API_KEY: z._____(), // ⬅️ LLENA EL HUECO 1
});
```

#### Misión 2: El Cascarón del Youtube Provider

Crea un nuevo archivo en `apps/backend/src/youtube/youtube.provider.ts` (crea la carpeta si no existe). Aquí usaremos el patrón de Inyección de Dependencias.

**Estructura Base (`youtube.provider.ts`):**

```typescript
import { _____ } from "@nestjs/common"; // ⬅️ LLENA EL HUECO 2
import { ConfigService } from "@nestjs/config";
import { google, youtube_v3 } from "googleapis";

@_____() // ⬅️ LLENA EL HUECO 3: ¿Qué decorador le dice a NestJS "puedes inyectar esta clase en otras"?
export class YoutubeProvider {
  private readonly youtubeClient: youtube_v3.Youtube;

  constructor(private readonly configService: ConfigService) {
    // Inicializamos el cliente de Google usando la API Key de nuestro ConfigService
    this.youtubeClient = google.youtube({
      version: "v3",
      auth: this.configService.get<_____>("YOUTUBE_API_KEY"), // ⬅️ LLENA EL HUECO 4: ¿Qué tipo de dato retorna la llave?
    });
  }
}
```

---

#### 🧠 Análisis Sintáctico (El "Por Qué" de la Gramática)

- **`@_____()`:** En NestJS, las clases normales no son mágicas. Necesitamos "marcarlas" para que el sistema de Inyección de Dependencias (DI Container) las reconozca, las instancie solo una vez (Singleton) y las comparta con el resto del sistema.
- **`private readonly youtubeClient`:** Usamos `private` para que nadie fuera de esta clase toque al cliente de Google. Usamos `readonly` porque asegura que, una vez asignado en el constructor, nadie pueda sobreescribir la conexión por accidente. ¡Inmutabilidad táctica para evitar bugs!
- **`constructor(private readonly configService: ConfigService)`:** Aquí aplicamos el principio de Inversión de Dependencias (DIP). No "creamos" ni leemos las variables de entorno aquí adentro leyendo `process.env`; pedimos que nos las pasen (inyecten) de forma segura usando el `ConfigService` de NestJS, el cual ya fue validado por Zod.
- **`configService.get<_____>('...')`:** El método `get` de NestJS acepta un _Genérico_ en TypeScript (los diamantes `< >`). Esto le sirve a TypeScript para saber qué tipo de dato primitivo debe esperar de la variable de entorno y darnos autocompletado sin errores.

**Tu turno:**
Crea los archivos y completa los **4 huecos (`_____`)**. Cuando lo tengas, pégame aquí en el chat el código resuelto de `youtube.provider.ts` y `config.schema.ts` para revisarlos. Si fallas, aplicaremos la Regla de Pistas, sin juicios. ¡Adelante!

✅ _Completado: `youtube.provider.ts` y `config.schema.ts` resueltos correctamente. ¡Excelente uso de `@Injectable()` y genéricos!_

---

### [FASE 4: EL COMBATE (CODIFICACIÓN GUIADA)] - PARTE 2 | ⏱️ 15 min

Ahora vamos a darle vida a nuestro Provider agregándole sus dos "brazos operativos": buscar videos y extraer comentarios.

#### Misión 3: El Radar (`searchVideos`)

Añade este método dentro de tu clase `YoutubeProvider`. Este método buscará los videos más relevantes de un tema.

**Estructura Base (`youtube.provider.ts` - Añadir dentro de la clase):**

```typescript
  async searchVideos(query: string, maxResults: number = 10) {
    try {
      const response = await this.youtubeClient.search._____({ // ⬅️ LLENA EL HUECO 1: ¿Qué método de la API hace listas/búsquedas?
        part: ['snippet'],
        q: query,
        maxResults,
        type: ['video'],
        order: 'relevance',
      });

      return response.data.items || [];
    } catch (error) {
      // ⬅️ LLENA EL HUECO 2: ¿Qué clase de error nativo de NestJS deberíamos lanzar aquí si algo falla? (Pista: HTTPException o BadGatewayException)
      throw new _____(
        `Error al buscar en YouTube: ${(error as Error).message}`
      );
    }
  }
```

#### Misión 4: La Aspiradora de Comentarios (`getVideoComments`)

Añade este segundo método. Observa cómo manejamos el token de paginación para no saturarnos.

**Estructura Base (`youtube.provider.ts` - Añadir debajo del anterior):**

```typescript
  async getVideoComments(videoId: string, maxResults: number = 100, pageToken?: string) {
    try {
      const response = await this.youtubeClient.commentThreads._____({ // ⬅️ LLENA EL HUECO 3: ¿Qué método lista los hilos de comentarios?
        part: ['snippet'],
        videoId: videoId,
        maxResults,
        pageToken, // Si existe, trae la siguiente página de comentarios
        textFormat: 'plainText',
      });

      return {
        comments: response.data.items || [],
        nextPageToken: response.data.nextPageToken, // Vital para la paginación asíncrona
      };
    } catch (error) {
      throw new _____( // ⬅️ LLENA EL HUECO 4 (Usa el mismo del Hueco 2)
        `Error al extraer comentarios del video ${videoId}: ${(error as Error).message}`
      );
    }
  }
```

#### Misión 5: Registrar el Módulo

Finalmente, no olvides crear el archivo `apps/backend/src/youtube/youtube.module.ts`. Un Provider no existe para NestJS si no está registrado en un Módulo.

**Estructura Base (`youtube.module.ts`):**

```typescript
import { Module } from "@nestjs/common";
import { YoutubeProvider } from "./youtube.provider";

@Module({
  providers: [YoutubeProvider],
  exports: [_____], // ⬅️ LLENA EL HUECO 5: Si queremos usar el YoutubeProvider en otros módulos (como el Scraper), ¿qué debemos exportar aquí?
})
export class YoutubeModule {}
```

_(Asegúrate de importar este `YoutubeModule` en el array de imports de tu `app.module.ts` principal)._

---

#### 🧠 Análisis Sintáctico (El "Por Qué" de la Gramática)

- **`part: ['snippet']`:** Las APIs de Google son inmensas. Para ahorrar ancho de banda y Cuota, nos exigen decirle explícitamente qué parte del recurso queremos. "Snippet" nos trae el título, descripción y metadatos sin traer todo el objeto del video entero.
- **`nextPageToken`:** Google nunca devuelve 10,000 comentarios de golpe (tumbaría nuestro servidor). Devuelve un lote y un "ticket" (`nextPageToken`). En la siguiente petición asíncrona, le pasamos ese ticket para que nos dé el siguiente lote. ¡Escalabilidad pura!
- **`exports: [...]`:** En NestJS, los providers son privados al módulo por defecto (Encapsulamiento). Si no lo "exportamos", el resto de la aplicación no podrá inyectarlo, blindando nuestra arquitectura contra usos no autorizados.

**Tu turno:**
Completa los **5 huecos** de esta Parte 2. Cuando los tengas listos, pégame el código o avísame por aquí para validarlo. ¡Tú puedes!

✅ _Completado: Código de YouTube API completado y módulos conectados perfectamente. ¡Puntaje perfecto en la asignación!_

---

### [FASE 5: EL SENIOR PITCH & CIERRE] | ⏱️ 10 min

¡Felicidades! Has completado el Sprint 9. No solo logramos conectarnos a Google, sino que lo hicimos respetando los principios de Arquitectura Limpia y preparándonos para la escalabilidad.

#### 🎙️ El "Senior Pitch" (Para tu entrevista técnica)

Si en una entrevista te preguntan: _"¿Cómo manejaste la ingesta de datos externos en Insight Engine?"_, esto es lo que debes responder para proyectar nivel Senior:

> _"Implementé un Proveedor de Datos (Data Provider) en NestJS específicamente para la API de YouTube, inyectándole las credenciales mediante un ConfigService validado por Zod. En lugar de acoplar las llamadas HTTP directamente en la lógica de negocio, encapsulé la lógica de búsqueda de videos y la paginación asíncrona de comentarios dentro del Provider. Esto previno cuellos de botella de memoria al manejar los tokens de paginación que nos da Google, optimizando al mismo tiempo el consumo de la Cuota de la API."_

#### ❓ Tu Pregunta de Refuerzo (Responde en el chat)

Imagina que un desarrollador de tu equipo crea un nuevo módulo (`ScraperModule`) y quiere usar tu `YoutubeProvider`, pero cuando corre el servidor NestJS le lanza el error: _"Nest can't resolve dependencies of the ScraperService"_.

Considerando lo que aprendiste de Inyección de Dependencias, **¿Qué pequeña configuración (propiedad) dentro de `youtube.module.ts` crees que pudo haber borrado u olvidado alguien para causar este error de aislamiento?**

**¡Responde esta pregunta en el chat y habremos finalizado oficialmente el Sprint 9! 🚀**

✅ _Respuesta a la pregunta de refuerzo: Solicitada explicación detallada._

---

### 🎓 LA RESPUESTA DEL SENIOR: ENCAPSULAMIENTO Y SCOPE EN NESTJS

No te preocupes, ¡es uno de los errores más comunes y frustrantes en NestJS incluso para programadores Semi-Senior!

**La respuesta correcta es:** El desarrollador olvidó poner (o borró) el array `exports: [YoutubeProvider]` dentro de `youtube.module.ts`.

#### Las Bases Técnicas (El Sustento Arquitectónico)

NestJS utiliza un patrón de diseño llamado **Inyección de Dependencias (DI)** bajo un principio muy estricto de **Encapsulamiento de Módulos**.

Piensa en los Módulos de NestJS como "Cajas Fuertes" o habitaciones blindadas:

1. **Privacidad por defecto:** Cuando declaras un Provider en el array `providers: [YoutubeProvider]` de un Módulo, ese provider solo existe _dentro_ de esa caja fuerte. Sus métodos y lógica son totalmente invisibles e inaccesibles para el resto de la aplicación.
2. **El Error "Can't resolve dependencies":** Si el `ScraperModule` intenta usar tu `YoutubeProvider`, el motor de NestJS busca en la "caja fuerte" del Scraper y dice: _"No tengo esto aquí"_. Luego busca en las partes públicas de otros módulos y, al ver que el `YoutubeModule` lo tiene oculto, lanza el temido error porque no tiene permiso para sacarlo de ahí e inyectarlo.
3. **La Solución (El Array `exports`):** Al colocar `YoutubeProvider` dentro del array `exports`, estás abriendo una "ventanilla pública" en esa caja fuerte. Le estás diciendo explícitamente a NestJS: _"Otorgo permiso para que cualquier otro módulo que importe a `YoutubeModule`, pueda usar la instancia compartida (Singleton) de este Provider"_.

**Por qué esto es fundamental (El "Por Qué" Senior):**
Evita el "Código Espagueti" (Strong Coupling). En aplicaciones masivas empresariales, no quieres que cualquier desarrollador llame libremente a conexiones externas o bases de datos sin pasar por los canales oficiales. Al forzar la exportación explícita, controlamos exactamente qué clases son de uso interno privado y cuáles son interfaces públicas compartidas.

---

🏁 **¡SPRINT 9 FINALIZADO CON ÉXITO!** 🏁
Has construido la primera pieza de nuestra ingesta de datos: un proveedor asíncrono, paginado, con manejo de excepciones y perfectamente encapsulado.

Tómate un descanso de 5 minutos, repasa la lección, y cuando estés listo, avísame en este chat para iniciar el **Sprint 10: Reddit Scraper**. ¡Gran trabajo!
