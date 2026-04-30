# SPRINT 13: OLLAMA FACTORY (MENTORÍA)

¡Entendido, Cadete! Nos adentramos en territorio profundo. Hasta ahora hemos movido datos como obreros (colas, scrapers, APIs). A partir del Sprint 13, le vamos a dar un **cerebro** a nuestra aplicación.

Vamos a construir el **Ollama Factory**, un cliente de inferencia local que nos permitirá usar modelos de lenguaje (LLMs) sin pagar un solo centavo en APIs externas, manteniendo los datos de nuestros análisis completamente privados.

Aquí tienes la **FASE 1**. Lee con atención y haz las verificaciones.

---

### [FASE 1: VERIFICACIÓN DE UTENSILIOS] 🛠️

Para este módulo necesitamos asegurarnos de que el motor de IA está instalado y de que nuestro backend pueda hablar con él. Verifica lo siguiente:

1. **Ollama (El Motor Core):**
   Necesitas tener el software de Ollama instalado en tu sistema Linux.
   - **Verificación:** Abre tu terminal y ejecuta: `ollama --version`. Debería devolverte la versión instalada.
   - Si no lo tienes, instálalo con: `curl -fsSL https://ollama.com/install.sh | sh`

2. **Descargar un Modelo Base (Mistral o Llama 3):**
   Ollama por sí solo es el motor, pero necesita un "cerebro" (los pesos del modelo). Vamos a usar un modelo ligero pero potente para desarrollo.
   - **Comando:** En tu terminal ejecuta: `ollama pull llama3.2` (o `ollama pull mistral` si lo prefieres). Esto descargará el modelo (pesa un par de GB, así que dale un momento).

3. **SDK de Ollama para Node.js:**
   Nuestro backend en NestJS necesita una librería oficial para comunicarse con el motor local sin tener que armar peticiones HTTP crudas a mano.
   - **Comando:** En la terminal de tu monorepo, dentro de `apps/backend`, instala la dependencia:

     ```bash
     pnpm --filter backend add ollama
     ```

**¿Están listos estos 3 utensilios en tu máquina? Confírmame (aquí o en el chat) para pasar a la FASE 2 y añadirte la Analogía del Chef y el "Por Qué" hacemos esto.**

---

### [FASE 2: LA ANALOGÍA DEL CHEF & EL "POR QUÉ"] 👨‍🍳 | ⏱️ 5 min

¡Excelente elección de modelo! Gemma es robusto y te dará análisis muy profundos.

**1. La Analogía Visual:**
Imagina que **Ollama** es una enorme cocina industrial que instalamos en el sótano de nuestro restaurante (tu PC local). El modelo **Gemma 4:26b** es un Sous-Chef experto y musculoso que acabas de contratar.

Nuestro **Ollama Factory** (el código que vamos a construir) es el intercomunicador exclusivo del montacargas. Es la única vía oficial para que nuestros meseros (el backend) le pasen las comandas (prompts) al Sous-Chef en el sótano, y este devuelva el plato terminado. Si los meseros bajaran al sótano y le gritaran al Chef directamente cada vez, tendríamos un caos.

**2. El "Por Qué" (Visión Senior):**
_¿Qué error de novato (Junior) evitamos al hacer esto de forma profesional?_

El error clásico de un Junior es importar la librería en cada archivo que la necesite y hacer `const ai = new Ollama()` cincuenta veces.
¿El desastre a futuro?

- **Fugas de memoria (Memory Leaks):** Creas múltiples clientes que saturan los puertos.
- **Deuda Técnica:** Si mañana decides cambiar a OpenAI o a un servidor remoto, tendrías que modificar 50 archivos distintos.

**La Solución Senior:** Usaremos el Patrón **Singleton** e **Inyección de Dependencias (Dependency Injection - DI)** de NestJS. Vamos a crear UNA SOLA instancia de conexión al motor de Ollama, y la compartiremos con quien la pida a través de un "Provider". Centralizamos el poder en un solo lugar.

**(Nota sobre Glosario):**

- _Singleton:_ Un patrón de diseño que asegura que una clase solo tenga _una_ instancia viva en toda la aplicación.
- _Dependency Injection (DI):_ En lugar de que un archivo "cree" su propia herramienta, NestJS se la "inyecta" (se la pasa ya lista para usar) cuando el archivo la pide.
- _Provider:_ En NestJS, es simplemente una clase/servicio que puede ser inyectado en otras partes de la app.

**¿Queda clara la analogía y el motivo de arquitectura para evitar el desastre? Confírmame para pasar a la FASE 3: El Plan de Acción.**

---

### [FASE 3: EL PLAN DE ACCIÓN (PASO A PASO)] 🗺️ | ⏱️ 7 min

Este es nuestro mapa de batalla para construir el intercomunicador. Lo haremos en 4 pasos precisos:

1. **Crear el módulo AI (`ai.module.ts`):**
   Este archivo es la "caja fuerte". Agrupará todo lo relacionado con inteligencia artificial para que el resto de la aplicación no tenga que preocuparse de sus partes internas.

2. **Crear el archivo de constantes (`ai.constants.ts`):**
   Aquí guardaremos un "Token" (un nombre clave, ej: `'OLLAMA_CLIENT'`) para identificar a nuestro Ollama Client. Esto evita escribir strings a mano (que causan _typos_ o "dedazos") en toda la app.

3. **Crear el Provider / Factory (`ollama.client.ts`):**
   Este es el intercomunicador real. Aquí es donde le decimos a NestJS: "Cuando alguien pida el Token del paso 2, constrúyele UNA sola instancia de la librería de Ollama apuntando a nuestro puerto local (por defecto `http://127.0.0.1:11434`) y devuélvesela".

4. **Exportar el Provider:**
   Le diremos al `ai.module.ts` que haga público este cliente para que otros módulos (como el procesador de scrapers) puedan inyectarlo y pedir análisis.

**¿Estás listo para ensuciarte las manos con el código? Confírmame para pasar a la FASE 4: El Combate (donde te daré el esqueleto con los huecos a rellenar).**

---

### [FASE 4: EL COMBATE (CODIFICACIÓN GUIADA)] ⚔️ | ⏱️ 20 min

Vamos a construir nuestra Factory y el módulo AI. Crearemos 3 archivos dentro de la carpeta `apps/backend/src/ai/`.

Crea los archivos y llena los huecos (`_____`) usando la lógica que hemos discutido.

#### Archivo 1: `ai.constants.ts`

Este archivo guarda el nombre de nuestro token para inyectar la dependencia.

```typescript
// apps/backend/src/ai/ai.constants.ts
export const _____ = "OLLAMA_CLIENT_TOKEN";
```

#### Archivo 2: `ollama.client.ts`

Aquí está la Factory (nuestro intercomunicador Singleton).

```typescript
// apps/backend/src/ai/ollama.client.ts
import { Provider } from "@nestjs/common";
import { Ollama } from "ollama";
import { OLLAMA_CLIENT } from "./ai.constants";

export const OllamaFactory: _____ = {
  provide: _____, // Aquí va el Token que creamos para identificar este provider
  useFactory: () => {
    // Aquí instanciamos el cliente real de Ollama (el único que existirá)
    return new _____({ host: "http://127.0.0.1:11434" });
  },
};
```

#### Archivo 3: `ai.module.ts`

Finalmente, registramos el Provider en el módulo para que NestJS lo conozca.

```typescript
// apps/backend/src/ai/ai.module.ts
import { Global, Module } from "@nestjs/common";
import { OllamaFactory } from "./ollama.client";

@_____() // Pista: Queremos que este módulo esté disponible en toda la app sin tener que importarlo 100 veces.
@Module({
  providers: [_____], // Aquí registramos nuestra Factory
  exports: [_____], // Y aquí la exportamos para que otros módulos la puedan usar
})
export class AiModule {}
```

#### 🔍 Desglose de Sintaxis (Antes de que lo resuelvas)

- `Provider`: Es una interfaz de NestJS que asegura que nuestro objeto `OllamaFactory` tenga la forma correcta (con `provide` y `useFactory`).
- `provide`: Es el "nombre" bajo el cual guardaremos nuestro cliente en el contenedor de dependencias de NestJS.
- `useFactory`: Es una función que NestJS ejecutará **una sola vez**. Lo que devuelva esta función es lo que NestJS inyectará cada vez que alguien pida el cliente.
- `@Global()`: Es un decorador que marca un módulo para que sus "exports" estén disponibles en todos los demás módulos automáticamente.

**Tu turno, Cadete.** Cópialo, rellena los `_____`, y pásame el código resultante de los 3 archivos aquí en el chat para revisarlo. Si te trabas, pídeme una pista.

---

### [CODE REVIEW & REFACTOR SENIOR] 🔍

¡Excelente instinto, Cadete! Tienes **TODA LA RAZÓN**. Hardcodear IPs o URLs es un pecado capital (y GitGuardian te va a gritar con justa razón). Eso debe venir del `.env`.

Además, detecté un detalle en tu código. Vamos a pulirlo:

1. **Decorador sobrante:** En `ai.module.ts` pusiste `@Injectable()`. Los módulos solo llevan `@Module()` (y `@Global()`). El `@Injectable()` es solo para clases que van a ser "inyectadas" (como Servicios). Ya he removido ese decorador de tu código.
2. **Inyectar el `.env` (La verdadera magia Senior):**
   Para leer el `.env` en una Factory, necesitamos inyectar el `ConfigService` de NestJS.

Aquí tienes cómo debe quedar tu `ollama.client.ts` para leer del `.env`:

```typescript
// apps/backend/src/ai/ollama.client.ts
import { Provider } from "@nestjs/common";
import { Ollama } from "ollama";
import { ConfigService } from "@nestjs/config";
import { OLLAMA_CLIENT } from "./ai.constants";

export const OllamaFactory: Provider = {
  provide: OLLAMA_CLIENT,
  // 1. Le decimos a la factory que necesita inyectar dependencias
  inject: [ConfigService],
  // 2. Recibimos el ConfigService como argumento
  useFactory: (configService: ConfigService) => {
    // 3. Leemos del .env (si no existe, usamos el host por defecto)
    const host = configService.get<string>(
      "OLLAMA_HOST",
      "http://127.0.0.1:11434",
    );
    return new Ollama({ host });
  },
};
```

_(Asegúrate de agregar `OLLAMA_HOST=http://127.0.0.1:11434` a tu archivo `.env` en el backend)._

---

### [FASE 5: EL SENIOR PITCH & CIERRE] 🎤 | ⏱️ 10 min

¡Felicidades! Has construido una arquitectura limpia para IA local.

**El Pitch (Lo que dirás en la entrevista):**

> "Implementé un cliente de inferencia local optimizado para modelos LLM usando el patrón Singleton y Dependency Injection en NestJS. Esto centraliza la configuración (como el host cargado dinámicamente desde variables de entorno), evita fugas de memoria al crear múltiples instancias de conexión, y nos permite cambiar el modelo o proveedor subyacente sin tener que reescribir la lógica de negocio."

**Pregunta de Refuerzo para ti:**
Si mañana decidimos cambiar de Ollama a OpenAI, ¿En cuántos archivos tendríamos que cambiar la instanciación de la IA gracias a la arquitectura que acabamos de armar?

**Respóndeme la pregunta y habremos terminado oficialmente el Sprint 13.**
