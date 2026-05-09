# Sprint 25: El Puente Final - Integración Frontend y Backend

## Objetivo del Sprint
Conectar la arquitectura backend (Scraping + Ollama + NLP) con los componentes visuales del frontend (Dashboard, NeedFeed y MarketMap) mediante una interfaz dinámica. Reemplazar la data de prueba con análisis de sentimiento real alimentado por Reddit.

## Analogía del Chef
Teníamos una cocina industrial perfecta (Backend) y una sala de degustación preciosa (Frontend), pero los mozos no estaban pasando los platos. Hemos construido el pasaplatos final para que los ingredientes crudos (posts de Reddit) se conviertan en platos gourmet (Insights) y lleguen a las mesas (Mapas D3).

El error de novato que evitamos aquí es el **Acoplamiento Fuerte en Componentes Visuales**. En lugar de que `MarketMap` o `NeedFeed` hagan llamadas a la API directamente, hemos centralizado la petición en el `Dashboard` (`page.tsx`) y pasamos los datos hacia abajo a través de props. Esto hace que nuestros componentes visuales sean "tontos" y reutilizables en cualquier otro contexto.

---

## Plan de Acción Ejecutado

1. **Creación del Endpoint Orchestrador (`/reddit/analyze`)**
   - Construimos `reddit-analysis.service.ts` para orquestar la obtención de posts top (`RedditService`) y su análisis narrativo (`NarrativeAuditorService`).
2. **Estructuración de Datos**
   - Mapeamos los resultados de la IA en dos formatos paralelos: `PainPoints` (para la lista vertical) y `ClusterNodes`/`ClusterLinks` (para el mapa gravitacional D3.js).
3. **Actualización del Hook TanStack Query**
   - Tipamos estrictamente `useRedditAnalysis` para esperar las nuevas estructuras respetando el envoltorio del `TransformInterceptor` (`{statusCode, data}`).
4. **Refactorización del Dashboard**
   - Convertimos `page.tsx` en un *Client Component* que maneja el estado de búsqueda (subreddit) y ejecuta la mutación.
5. **Componentes Puros**
   - Modificamos `MarketMap` y `NeedFeed` para que dejen de usar datos hardcodeados y dependan de props, incluyendo estados de carga (`isLoading`) y vacío.

---

## Archivos Clave Modificados

- `apps/backend/src/reddit/reddit.controller.ts` (NUEVO)
- `apps/backend/src/reddit/reddit-analysis.service.ts` (NUEVO)
- `apps/frontend/app/page.tsx`
- `apps/frontend/components/MarketMap.tsx`
- `apps/frontend/components/NeedFeed.tsx`
- `apps/frontend/hooks/useAnalysis.ts`

---

## El "Senior Pitch" (Entrevista)

> *"Para el flujo principal de valor del producto, diseñé un orquestador en NestJS que coordina la ingesta asíncrona de datos desde Reddit y su procesamiento en un pipeline de inferencia local usando Ollama. En el frontend, apliqué el patrón de 'Smart/Dumb Components' con Next.js: centralicé el manejo de estado asíncrono en la vista principal usando TanStack Query, pasando la data hidratada hacia componentes de presentación puros como visualizaciones D3.js. Esto me permitió mantener un flujo de datos unidireccional predecible y optimizar los renders."*

---

## Pregunta de Refuerzo
¿Por qué crees que decidimos hacer que `page.tsx` llame al backend y pase los datos como `props` a `MarketMap` y `NeedFeed`, en lugar de dejar que cada componente haga su propia llamada a la API?
