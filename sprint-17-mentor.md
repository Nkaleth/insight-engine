# Sprint 17: Next.js API Client

## Bitácora de Mentoría

Aquí registraremos tus preguntas y mis respuestas (Senior a Junior) durante este sprint.

### Q: Instalé las dependencias, pero noto en mi `pnpm-lock.yaml` que uso Next.js 16, no 14 como mencionaste en el plan general. ¿Esto influye en algo?
**A (Senior):** ¡Buen ojo leyendo el lockfile! En el mundo real, los stacks se actualizan constantemente. Next.js 16 mantiene retrocompatibilidad con los paradigmas introducidos en la versión 14 (App Router, Server Components y Server Actions). Para TanStack Query, la integración es exactamente la misma: seguiremos usando Client Components (`"use client"`) para envolver nuestra aplicación con el `QueryClientProvider` y manejar el estado reactivo en el navegador. Así que no te preocupes, el patrón arquitectónico sigue intacto y, de hecho, te beneficias de las optimizaciones de rendimiento de la v16 bajo el capó.

### Q: Concepto General - TanStack Query vs `useEffect`
**A (Senior):** 
**La Analogía del Chef:**
Imagina que TanStack Query es la combinación entre un **Maitre D'** muy astuto y un **Refrigerador Inteligente** en un restaurante de lujo. Cuando un cliente pide el plato estrella (datos), en lugar de gritarle a la cocina que empiece de cero (hacer un `fetch` a la API), el Maitre revisa el refrigerador (la **caché**). Si el plato está ahí y está fresco, lo sirve *inmediatamente*. Si está un poco frío (estado *stale*), se lo sirve rápido para que el cliente no espere, pero secretamente manda a la cocina a preparar uno nuevo en segundo plano para actualizar la mesa sin que el cliente se dé cuenta (*Stale-While-Revalidate*).

**El error de Junior que evitamos:**
El clásico `useState` + `useEffect`. Un Junior suele declarar estados para todo: `data`, `isLoading`, `error` y mete un `fetch` dentro de un `useEffect`. Esto causa **sobre-peticiones** (saturar el backend si el usuario cambia de pestaña), **Condiciones de Carrera** (mostrar datos viejos si la primera petición responde después de la segunda), y **Deuda Técnica** (mucho código repetitivo para manejar reintentos y paginación). TanStack Query elimina todo esto manejando la caché de forma predecible.

### Plan de Acción (Fase 3 - Next.js API Client)

1. **`lib/api.client.ts`**: Configuraremos la instancia base de Axios. Este archivo centralizará la `baseURL` y será el único lugar donde gestionaremos interceptores (ej. inyectar JWT a futuro).
2. **`providers/QueryProvider.tsx`**: Crearemos un "Client Component" que inicialice el `QueryClient` (el refrigerador) y envuelva la aplicación.
3. **`app/layout.tsx`**: Inyectaremos el `QueryProvider` en el layout raíz para que toda la app tenga acceso a la caché.
4. **`hooks/useAnalysis.ts`**: Crearemos un Custom Hook usando `useQuery`/`useMutation` para encapsular la llamada HTTP, aislando a la UI de la lógica de red.

### Q: Veo que dentro de frontend hay una carpeta `app` pero no veo una carpeta `src`. ¿Tendría que reconstruir lo que ya está por defecto?
**A (Senior):** ¡Para nada! Next.js soporta dos estructuras oficiales: con carpeta `src/` y sin ella (directorio raíz). Tu proyecto fue inicializado sin `src/`, lo cual significa que la carpeta `app/` vive directamente en la raíz de `frontend/`. Esto es totalmente estándar y válido.
La única diferencia es que en lugar de crear nuestros archivos en `apps/frontend/src/lib/...`, simplemente los crearemos al mismo nivel que `app/`, es decir:
- `apps/frontend/lib/api.client.ts`
- `apps/frontend/providers/QueryProvider.tsx`
- `apps/frontend/hooks/useAnalysis.ts`
No hay que reconstruir nada, solo nos adaptamos a la convención del proyecto.

### Q: ¿Por qué se usa `useState(() => new QueryClient(...))` en `QueryProvider.tsx`? Nunca había visto ese uso de useState.
**A (Senior):** ¡Excelente pregunta! Lo que estás viendo se llama **Lazy Initialization (Inicialización Perezosa)** en React.
Normalmente, un Junior haría esto: `const [queryClient] = useState(new QueryClient())`. 
**El problema:** Cada vez que React re-renderiza este componente, Javascript evalúa todo el código de nuevo. Eso significa que crearía un `new QueryClient()` en la memoria *en cada render*, para luego tirarlo a la basura inmediatamente porque `useState` recuerda el primer valor. Es un desperdicio enorme de CPU y memoria.
**La solución Senior:** Al pasarle una función de flecha al `useState` `() => new QueryClient()`, le estamos diciendo a React: *"Oye, solo ejecuta esta función la PRIMERA vez que montes el componente. Si te re-renderizas, ni siquiera mires esta función"*. 
Además, instanciar el cliente DENTRO del componente y no afuera del archivo asegura que, en un entorno de Server-Side Rendering (SSR) como Next.js, la caché no se comparta globalmente entre diferentes usuarios que entren al mismo tiempo.

### Q: Ya tengo un `.env` en la raíz. ¿Es necesario crear OTRO en el frontend? ¿Dónde lo pongo?
**A (Senior):** **SÍ, es estrictamente necesario.** El `.env` de la raíz tiene secretos de tu base de datos (PostgreSQL, JWT). El frontend NUNCA debe acceder a ese archivo por seguridad. 
Debes crear un archivo llamado **`.env.local`** específicamente dentro de la carpeta **`apps/frontend/`** (es decir, la ruta completa es `apps/frontend/.env.local`). Ahí colocarás solo variables seguras para el navegador, como:
`NEXT_PUBLIC_API_URL=http://localhost:3000/api`

### Q: Explícame a detalle `useAnalysis.ts` letra por letra. Y, por cierto, no recuerdo haber creado `/ai/analyze` en el backend.
**A (Senior):** Tienes una memoria fotográfica. ¡No, no la hemos creado aún! Esa ruta la construiremos en el backend durante el **Sprint 24 (`ai.controller.ts`)**. Lo que acabamos de hacer aquí se llama **Diseño Contract-First (o Mocking)**. Como Frontend y Backend en equipos grandes suelen avanzar en paralelo, el Frontend asume un "contrato" (una URL y una forma de datos) y avanza. Cuando el Backend esté listo, mágicamente todo encajará.

**Análisis profundo del código (Gramática y Sintaxis):**
1. **`import { useMutation }`**: Traemos el hook. En TanStack Query hay dos reyes: `useQuery` (para GET, leer datos solos) y `useMutation` (para POST/PUT/DELETE, o sea, enviar datos y alterar estados).
2. **`import { apiClient }`**: Importamos nuestro soldado ya configurado con la URL base y timeout.
3. **`interface AnalysisResponse {...}`**: Tipado de TypeScript. Le decimos al compilador qué forma tendrá el JSON de respuesta. Esto nos da autocompletado mágico y evita el temido error `undefined is not an object` en tiempo de ejecución.
4. **`export function useAnalyzeText() {`**: Declaramos nuestro Custom Hook. En React, la regla de oro es que cualquier función que use hooks por dentro debe empezar con la palabra `use`.
5. **`return useMutation({`**: Retornamos el objeto vivo que React Query nos da. Este objeto contendrá banderas útiles como `.isPending` (para mostrar un spinner) o `.isError`.
6. **`mutationFn: async (textToAnalyze: string) => {`**: Es el corazón del hook. Es la función asíncrona que React Query ejecutará *solo cuando el usuario haga clic en un botón*. Recibe el texto que queremos analizar.
7. **`await apiClient.post<AnalysisResponse>('/ai/analyze', { text: textToAnalyze })`**: Hacemos la llamada. Nota el `<AnalysisResponse>`: aquí le decimos a Axios "Oye, confía en mí, lo que te devuelva el servidor tiene esta estructura". Axios automáticamente une esta ruta relativa con el `http://localhost:3000/api` que configuramos antes. El segundo parámetro `{ text... }` es el payload o cuerpo del POST.
### Q: Para ejecutar el hook, ¿no se llama a `analyzer.mutationFn`? Explícame el flujo lógico de todo lo que hemos hecho en este sprint.
**A (Senior):** Es un error súper común, pero la respuesta es **No**. La propiedad correcta que llamas desde el botón es **`analyzer.mutate`** (o `analyzer.mutateAsync`). 
`mutationFn` es solo el *manual de instrucciones* interno que le dimos a TanStack Query. Cuando tú llamas a `.mutate("mi texto")`, TanStack Query dice: *"Ah, me pidieron mutar. Voy a poner mi estado interno `.isPending` en `true` para que la UI muestre un spinner, luego voy a leer las instrucciones de `mutationFn` para saber cómo hacer el POST, y cuando termine, guardaré el resultado en `.data` y pondré `.isPending` en `false`"*. Todo eso te lo hace automáticamente la función `.mutate()`.

**El Flujo Lógico y Arquitectónico (The Big Picture):**
Imagina que estamos construyendo un restaurante moderno:

1. **`api.client.ts` (El Vehículo de Reparto):** 
   Es solo un camión (Axios) pre-configurado. Sabe que siempre debe salir de la misma central (`baseURL: http://localhost:3000/api`) y que si un viaje tarda más de 10 segundos, se cancela (`timeout`).

2. **`QueryProvider.tsx` (El Gerente del Restaurante y su Libreta):**
   Es el motor de TanStack Query. Él anota todo lo que se pide, decide qué guardar en caché y qué volver a pedir. Le dijimos que no vuelva a pedir platos solo porque el cliente miró por la ventana (`refetchOnWindowFocus: false`).

3. **`layout.tsx` (El Edificio):**
   Al envolver toda nuestra aplicación web (`children`) con el `QueryProvider`, nos aseguramos de que cualquier mesa del restaurante (cualquier componente) pueda hablar con el Gerente.

4. **`useAnalysis.ts` (El Camarero Especializado):**
   Es un "Custom Hook". El componente visual (el cliente en la mesa) no sabe cómo cocinar ni cómo manejar el camión de reparto. El componente solo llama al camarero: `const analyzer = useAnalyzeText()`. El camarero es el único que sabe que hay que usar el `apiClient` (camión) para hacer un POST a `/ai/analyze` (instrucción en `mutationFn`).

### Q: En `useAnalysis.ts`, `useAnalyzeText()` retorna `useMutation`. Pero dentro veo `return response.data;`. ¿En qué momento sucede `isPending`? ¿El return final es la función o los datos?
**A (Senior):** ¡Excelente nivel de profundidad! Acabas de chocar con uno de los conceptos más confusos de los callbacks en Javascript. Tienes una pequeña confusión de "quién retorna qué". Vamos a desarmarlo con un bisturí.

Hay **DOS** `return` en ese código, y le hablan a personas distintas:

**El PRIMER `return` (Línea 15): `return useMutation(...)`**
Este es el return de tu hook `useAnalyzeText`. Le está hablando **a tu componente React** (la UI). 
¿Qué devuelve exactamente `useMutation()`? NO devuelve los datos directamente. Devuelve un **Objeto Gigante** lleno de herramientas. Cuando en tu componente haces `const analyzer = useAnalyzeText()`, la variable `analyzer` se convierte en este objeto:
```javascript
{
  mutate: (texto) => { ... }, // La función que tú llamas con el onClick
  isPending: false,           // El estado de carga (booleano)
  isError: false,             // Si falló (booleano)
  data: undefined             // ¡Aquí terminarán tus datos!
}
```

**El SEGUNDO `return` (Línea 22): `return response.data`**
Este return está *dentro* de `mutationFn`. Este return NO le habla a tu componente visual. Este return le habla **al motor interno de TanStack Query**.

**El Flujo Exacto (Milisegundo a Milisegundo):**
1. Tu componente React se renderiza y llama a `const analyzer = useAnalyzeText()`. El objeto nace con `isPending: false` y `data: undefined`.
2. El usuario hace clic en el botón. El botón ejecuta: `analyzer.mutate("Hola")`.
3. TanStack Query despierta. Toma el control. Lo primero que hace es actualizar su propio objeto: cambia `isPending` a `true` y avisa a React que re-renderice la pantalla (¡así aparece tu spinner!).
4. TanStack Query lee tu configuración y dice: *"A ver, ¿qué función me pasaron en `mutationFn`? Ah, esta"*. Y la ejecuta, pasándole el "Hola".
5. Tu `mutationFn` viaja a la API con Axios, espera, recibe el JSON, y hace `return response.data`.
6. TanStack Query "atrapa" ese `response.data` que devolviste.
7. TanStack Query actualiza su objeto de nuevo: toma tu `response.data` y lo mete dentro de `analyzer.data`. Cambia `isPending` a `false`.
8. React vuelve a re-renderizar tu pantalla. Esta vez, como `analyzer.data` ya no es undefined, tu pantalla muestra los nichos de mercado.

En resumen: Tú no devuelves la data a la UI directamente. Tú le devuelves la data a TanStack Query (dentro de `mutationFn`), y TanStack Query se encarga de re-empaquetarla en el objeto que te dio al principio y forzar el re-render de React.

### Q: Pero en mi código no veo declarada la función `mutate`, solo veo `mutationFn`. ¿De dónde sale `mutate`? Y sobre la respuesta: ¿no se supone que analizar comentarios masivos tarda mucho? ¿Por qué dices que responde "rápido"?
**A (Senior):** ¡Dos observaciones brillantes! Vamos por partes:

**1. ¿De dónde sale `.mutate` si yo no lo programé?**
Sale del código fuente de la librería `@tanstack/react-query`. Piensa en `useMutation` como una **Máquina de Café** que fabricó otra persona.
- `mutationFn` (Los granos de café): Es lo que TÚ le metes a la máquina por arriba. Le dices "Esta es la receta para conectarse a NestJS".
- `.mutate()` (El botón de encendido): Es el botón que la máquina de café trae por fuera. Tú no programaste el botón, te lo regaló la máquina. Cuando en tu botón de React aprietas `.mutate()`, la máquina se enciende, procesa tus "granos" (`mutationFn`), y te escupe el café caliente (`.data`). ¡Por eso no lo ves en tu archivo, porque viene empaquetado en el `return` mágico de la librería!

**2. ¿Devuelve rápido? ¡Para nada! Tienes toda la razón.**
En mi ejemplo anterior dije "viaja al backend, vuelve y muestra los resultados", haciéndolo sonar casi instantáneo. Pero tienes toda la razón en cuestionarlo: ¡Vamos a procesar cientos de comentarios usando Inteligencia Artificial local (Ollama) en el Sprint 24!
Eso **NO** será rápido. Podría tardar 20 segundos, 1 minuto, o más dependiendo de tu VRAM.
### Q: ¿Entonces `mutationFn` es el input de `useMutation`? ¿Al dar click se hace `useMutation(input).mutate()`?
**A (Senior):** ¡Estás a un milímetro de la verdad absoluta! Tienes la idea conceptual perfecta, pero la sintaxis de React funciona ligeramente distinto debido a las **Reglas de los Hooks**.

1. **¿`mutationFn` es el input de `useMutation`?** 
¡SÍ! Exactamente. `useMutation` recibe un objeto de configuración como parámetro (input), y `mutationFn` es una de las propiedades de ese objeto. Le estás pasando la "receta" a la máquina.

2. **¿Al dar click se hace `useMutation(input).mutate()`?**
**Conceptualmente SÍ, pero sintácticamente NO.** 
Por reglas estrictas de React, **nunca** puedes llamar a un Hook (nada que empiece con `use...`) dentro de un evento como `onClick`. Los Hooks solo pueden ejecutarse en la raíz del componente cuando este se renderiza.

Así es como se vería el código real en tu componente visual (el paso que haremos en un futuro sprint):

```tsx
// Tu archivo de UI: MiBoton.tsx
import { useAnalyzeText } from '../hooks/useAnalysis';

export function MiBoton() {
  // 1. INSTANCIACIÓN (Ocurre al cargar la página)
  // Llamamos al hook en la raíz del componente. 
  // Aquí se ejecuta internamente el `useMutation(input)`. 
  // La máquina de café se "enchufa" y queda lista, pero NO prepara café aún.
  const analyzer = useAnalyzeText(); 

  // 2. EJECUCIÓN (Ocurre al dar click)
  return (
    <button onClick={() => {
      // Como 'analyzer' ya es el objeto retornado por useMutation,
      // simplemente llamamos a su método interno.
      analyzer.mutate("Texto gigante de Reddit");
    }}>
      Analizar con Ollama
    </button>
  );
}
```

Si hiciéramos `<button onClick={() => useMutation(input).mutate()}>`, React lanzaría un error crítico diciendo: *"Invalid hook call. Hooks can only be called inside of the body of a function component"*. 
Por eso, primero preparamos la herramienta al inicio del componente asignándola a la variable `analyzer`, y luego usamos sus botones internos en el momento que el usuario interactúe.

### Q: Bueno está más claro; entonces TanStack son hooks como `useEffect`, `useState` y demás.
**A (Senior):** ¡BINGO! Exactamente eso. TanStack Query es simplemente una librería que te regala "Custom Hooks" (hooks personalizados). 
En lugar de que tú, como desarrollador, tengas que escribir a mano un `useState` para la data, otro `useState` para el error, otro `useState` para el loading, y un `useEffect` gigantesco para hacer el `fetch`... la gente de TanStack metió todo ese código repetitivo dentro de sus propios hooks (`useQuery` y `useMutation`). Al final del día, bajo el capó, TanStack Query está usando `useState` y `useEffect` por ti, pero de una forma infinitamente más optimizada y limpia. ¡Esa es la magia!
