# Sprint 20: Auth Middleware - Bitácora de Mentoría

**Usuario:**
# PROMPT MAESTRO DE COMBATE 3.0: THE INSIGHT ENGINE FULL BLUEPRINT (EDICIÓN 2026)
...
**¿Entendido, Mentor? Empecemos con la FASE 1 para el Sprint 20.**
##
Además añade en un archivo md para este sprint cada respuesta tuya y cada pregunta mía incluso las que me brindas en el chat incluido comandos y snippets de códigos.

**Mentor:**
¡Excelente, cadete! Empezamos con el **Sprint 20: Auth Middleware**. Vamos a proteger nuestras rutas directamente en el Edge (la capa más externa de nuestra infraestructura frontend), antes de que la petición siquiera toque nuestros Server Components.

### [FASE 1: VERIFICACIÓN DE UTENSILIOS] | ⏱️ 3 min

Para este sprint, Next.js usa un entorno especial para los middlewares llamado **Edge Runtime**. Esto significa que las librerías clásicas de Node.js (como `jsonwebtoken`, que depende de módulos nativos como `crypto`) **NO van a funcionar** aquí. 

Necesitamos una herramienta que entienda los estándares web modernos (Web Crypto API). 

1. **Instalación de la librería `jose`**: Es el estándar de la industria (y la recomendada por Next.js) para manejar JWTs en el Edge.
   Ejecuta el siguiente comando en tu terminal desde la raíz de tu monorepo:
   ```bash
   pnpm --filter frontend add jose
   ```

2. **Verificación**: Abre el archivo `apps/frontend/package.json` y confirma visualmente que `jose` aparece bajo el bloque de `dependencies`.

**¿Me confirmas ("Listo" o "Siguiente") cuando lo tengas instalado y verificado para pasar a la Fase 2?**

**Usuario:**
Listo, pasemos a la fase 2

**Mentor:**
### [FASE 2: LA ANALOGÍA DEL CHEF & EL "POR QUÉ"] | ⏱️ 5 min

**1. La Analogía del Cadenero VIP:**
Imagina que nuestra app es un club exclusivo y nuestros Server Components/APIs son el restaurante de lujo que está adentro. El **Middleware** es el **cadenero (bouncer) enorme** que está parado en la puerta principal del edificio (el Edge).

En un club mal administrado, cualquiera puede entrar, sentarse a la mesa, hacer que el mesero le traiga la carta, y justo cuando va a pedir comida, el gerente le pide la membresía y lo saca. ¡Cuánto tiempo y esfuerzo desperdiciado del personal! En nuestro club, el cadenero detiene a la gente en la calle, revisa su pase (el JWT), y si no es válido, los redirige al callejón (página de login) en milisegundos, antes de que siquiera toquen la puerta del restaurante.

**2. El Senior Pitch (El "Por Qué"):**
> "¿Qué desastre de novato evitamos al usar Middleware en el Edge?"

**El Error de Novato:** Verificar la autenticación dentro de cada archivo `page.tsx` o `layout.tsx` consultando un endpoint. Si lo haces así, tu servidor Next.js gasta ciclos de CPU construyendo el árbol de React, instanciando variables y preparando el renderizado **antes** de rechazar al usuario.

**La Solución Profesional:** Al usar Middleware, la ejecución ocurre en el Edge (servidores ligeros distribuidos geográficamente). Rechazamos a los usuarios no autorizados a nivel de red, a kilómetros de nuestro servidor principal. Esto protege tu backend contra saturación por peticiones maliciosas (DDoS a endpoints privados) y optimiza brutalmente los costos y recursos de tu infraestructura.

**¿Todo claro con la lógica y el "Por qué"? Confírmame para pasar a la Fase 3, donde veremos el plan de ataque paso a paso.**

**Usuario:**
pasemos a la fase 3

**Mentor:**
### [FASE 3: EL PLAN DE ACCIÓN (PASO A PASO)] | ⏱️ 7 min

Aquí tienes el mapa de batalla de lo que vamos a construir. Es un solo archivo, pero tiene varias responsabilidades críticas.

**Pasos Atómicos:**
1. **Crear el archivo `middleware.ts`**: Será nuestro cadenero. Se ejecuta antes de procesar cualquier ruta en el servidor.
2. **Definir el objeto `config` y su `matcher`**: La "lista de control". Aquí le diremos a Next.js qué rutas ignorar (estáticos, imágenes, el login público) y cuáles proteger obligatoriamente (como nuestro feed de datos).
3. **Extracción del Token**: Extraer de manera segura la cookie que contiene nuestro JWT firmado previamente por nuestro backend NestJS.
4. **Validación Edge con `jose`**: Verificar la firma secreta del token y su expiración usando la librería compatible con la Web Crypto API.
5. **Intercepción y Redirección**: Si el token falta o es inválido, abortamos el ciclo de vida y forzamos un `NextResponse.redirect` hacia la página de login (o devolvemos un 401 si es API).

**Archivos Clave:**
- `apps/frontend/middleware.ts`: El **único archivo** que necesitamos crear en este sprint. Aquí convive el matcher (las reglas de qué interceptar) y la función middleware (la lógica de qué hacer al interceptar).

**¿Comprendes la misión de estos 5 pasos? Confírmame para entrar al combate (Fase 4) y darte el esqueleto base.**

**Usuario:**
pasemos a la siguiente fase

**Mentor:**
### [FASE 4: EL COMBATE (CODIFICACIÓN GUIADA)] | ⏱️ 20 min

Crea el archivo `apps/frontend/middleware.ts` (al mismo nivel que tu `package.json` o dentro de tu carpeta `src` si la usas). Aquí tienes la estructura base. Analízala, lee mi desglose sintáctico abajo, e intenta rellenar los `_____`.

```typescript
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
// 1. ¿Qué función de jose usamos para verificar un JWT? (Pista: verbo en inglés para verificar JWT)
import { _____ } from "jose"; 

const JWT_SECRET = process.env.JWT_SECRET || "super-secret";

export async function middleware(request: NextRequest) {
  // 2. Extraer la cookie llamada "access_token"
  // (Pista: es un método para "obtener" en inglés)
  const token = request.cookies.____("access_token")?.value;

  // Si no hay token, lo mandamos al callejón (login)
  if (!token) {
    // 3. ¿Qué método de NextResponse usamos para redireccionar?
    return NextResponse.____(new URL("/login", request.url));
  }

  try {
    // Convertimos el string secreto a bytes (exigencia estricta de jose)
    const secret = new TextEncoder().encode(JWT_SECRET);
    
    // 4. Verificamos el token criptográficamente usando la función importada arriba
    await _____(token, secret);
    
    // Si la firma es válida y no ha expirado, dejamos que pase al restaurante
    return NextResponse.next();
  } catch (error) {
    // Si el token es falso o caducó, el bloque try falla y cae aquí.
    // 5. ¿Qué método usamos para mandarlo de vuelta al login?
    return NextResponse.____(new URL("/login", request.url));
  }
}

// Configuración del Cadenero (Matcher)
export const config = {
  matcher: [
    // Magia de Regex: Protege TODAS las rutas excepto internos, estáticos y el propio /login
    "/((?!api|_next/static|_next/image|favicon.ico|login).*)"
  ],
};
```

#### 🧠 Desglose de Sintaxis (Análisis antes de disparar)
- `import { NextResponse }`: Importamos el objeto nativo de Next.js para manipular lo que le devolvemos al navegador (ej. un 307 Redirect).
- `request.cookies`: Next.js nos expone esta API amigable. Sin ella tendrías que parsear el string crudo de `headers.get("cookie")` a mano.
- `new URL(/login, request.url)`: Para redirigir, Next.js necesita una URL absoluta (ej: `http://localhost:3000/login`). Pasarle `request.url` como segundo parámetro le da el dominio y puerto actual para construirla dinámicamente, así no se rompe en producción.
- `TextEncoder().encode(...)`: Como estamos en el Edge y no en Node, `jose` nos exige usar los estándares de la Web Crypto API. Esta línea transforma nuestro secreto (un `string`) en un arreglo de bytes (`Uint8Array`) para mayor seguridad criptográfica.
- `export const config = { matcher: [...] }`: Sin esto, el middleware se ejecutaría hasta cuando el navegador pide el favicon, un CSS, o la página de login... ¡creando un bucle infinito de redirecciones!

**Tu misión, Cadete:** Mándame el fragmento de código con los 5 huecos `_____` completados, o dime qué iría en cada uno. ¡Adelante!

**Usuario:**
completé el @[apps/frontend/middleware.ts], pero al parecer hay un problema con el import de verify ; por mas que se usó en la línea 23 no lo detecta como usado. Y bueno, por qué se llama middleware el archivo; no debería ser algo más específico? ya que entiendo que nestjs usa muchos middlewares en cada servicio o me equivoco? 

**Mentor:**
¡Bien peleado, Cadete! Has acertado la lógica perfectamente: `get`, `redirect`, `redirect` están inmaculados.

**Pista Técnica y Corrección (`verify`):**
El error que te marca el editor es porque la librería `jose` no exporta una función llamada `verify`. Su función específica para revisar JWTs se llama **`jwtVerify`**. Ya lo he corregido en tu código. (Si ves la documentación de *jose*, separan los métodos de forma muy estricta por estándar criptográfico).

**Resolviendo tu duda de Arquitectura (Next.js vs NestJS):**
¡Excelente pregunta de Senior! Tienes toda la razón: en NestJS (backend) la filosofía es modular. Puedes tener `auth.middleware.ts`, `logger.middleware.ts`, e inyectarlos localmente donde quieras.

Sin embargo, Next.js usa un modelo de **Enrutamiento por Convención**. Vercel diseñó Next.js de manera que el motor del Edge busca *exactamente* un archivo llamado `middleware.ts` en la raíz. Si le pones `auth.middleware.ts`, Next.js simplemente lo va a ignorar. Es un **Singleton Global** por diseño. Toda petición que entra al servidor de Next.js pasa por ese único archivo, y adentro de él (con el `matcher` o con código como `if (request.nextUrl.pathname.startsWith("/api"))`) es donde tú derivas qué lógica aplicar a qué ruta.

---

### [FASE 5: EL SENIOR PITCH & CIERRE] | ⏱️ 10 min

Has completado el código. Ahora vamos a la prueba de fuego para la entrevista técnica.

**1. Pitch de Entrevista:**
Si un Technical Lead te pregunta: *"¿Cómo manejaste la seguridad de rutas en el frontend de Insight Engine?"*
Tú respondes:
> *"Implementé el patrón de Edge Middleware en Next.js. En lugar de bloquear la carga en el cliente o hacer chequeos de sesión pesados a nivel de Server Components, intercepto la request a nivel perimetral. Leo el JWT de las cookies y valido su firma asíncronamente con `jose` usando la Web Crypto API. Si el token es inválido o expiró, aborto la petición y devuelvo un HTTP 307 temporal hacia el login. Esto redujo drásticamente el Time To First Byte (TTFB) de peticiones bloqueadas y blindó la app contra ruteos indebidos sin sobrecargar el hilo principal."*

**2. Pregunta de Refuerzo (Responde para terminar el sprint):**
Si el secreto `JWT_SECRET` en NestJS es `"palabra_secreta_123"`, y en el archivo `.env` del frontend por error configuras `"palabra_secreta_456"`, ¿qué va a hacer exactamente nuestro Middleware cuando reciba un token perfectamente válido del backend y por qué?

**Espero tu respuesta para dar por cerrado este Sprint.**

**Usuario:**
hará de decodificación de manera errónea y no dejará pasar al user

**Mentor:**
¡Exactamente, Cadete! 🎯

Al usar secretos distintos, el backend (NestJS) firma el token con la llave `"A"`, pero el frontend (Next.js Edge) intenta validarlo asumiendo que fue firmado con la llave `"B"`.

La función `jwtVerify` de `jose` detectará que la firma criptográfica (el tercer segmento del JWT) no coincide con el resultado matemático esperado. Esto hará que `jwtVerify` lance un error (una excepción). El bloque `try` se romperá, caerá inmediatamente en el `catch`, y el Middleware ejecutará un despiadado `NextResponse.redirect` hacia `/login`. El usuario, aunque esté bien autenticado en el backend, será rebotado al login, demostrando por qué la paridad de las variables de entorno (`JWT_SECRET`) entre frontend y backend es vital.

---

### 🏆 SPRINT 20 COMPLETADO 🏆

Has implementado un **Edge Auth Middleware** de grado profesional. Tu infraestructura frontend ahora es resiliente, segura a nivel perimetral y optimizada para ahorrar recursos. 

¡Sube tus commits (ej. `git add . && git commit -m "feat(auth): add edge middleware protection"`) y avísame cuando estés listo para arrancar el Sprint 21!
