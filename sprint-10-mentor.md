# SPRINT 10: Reddit Scraper (El Ojo Clínico del Senior)
**Objetivo:** Extracción de datos no estructurados de comunidades sociales para análisis de sentimiento.

## Fase 1: Verificación de Utensilios - Pivot Estratégico
**El Reto:** La API oficial de Reddit (Devvit) ahora requiere configuraciones complejas y términos estrictos, no ideales para extracción externa de datos públicos.
**El "Senior Hack":** Usar los endpoints públicos `.json` (ej. `reddit.com/r/startups/hot.json`) que devuelven la data cruda sin necesidad de tokens OAuth.
**Herramientas Instaladas:**
- `@nestjs/axios` y `axios` para peticiones HTTP asíncronas.
- Variable de entorno `REDDIT_USER_AGENT` para identificarnos como un bot legítimo y evitar bloqueos del firewall de Reddit.

## Fase 2: La Analogía del Chef y El "Por Qué"
**La Analogía:** Si envías a un ayudante a comprar ingredientes corriendo y agarrando todo de golpe, el guardia de seguridad lo echa. Hay que enseñarle a entrar con su gafete de la empresa (`User-Agent`), pedir con calma y saber esperar si hay fila.
**El Por Qué (Visión Senior):** Evitamos el error de novato de hacer un simple `axios.get` en un bucle for (lo cual causaría un baneo de IP casi inmediato por *Rate Limiting*). Encapsulamos la lógica en un *Provider* para aislar el control de peticiones de la lógica central de la app.

## Fase 3: El Plan de Acción
1. **Crear el Esqueleto:** Generar el Módulo y el Servicio de Reddit (`nest g module reddit` y `nest g service reddit`).
2. **Configurar la Caja de Herramientas:** Inyectar `HttpModule` y `ConfigModule` en `RedditModule`.
3. **La Lógica de Extracción:** Construir el método en `RedditService` que hace la petición HTTP inyectando nuestra configuración de identidad.

## Fase 4: El Combate (Codificación)
**Archivos creados/modificados:**
- `reddit.module.ts`: Se importaron y configuraron `HttpModule` y `ConfigModule`, y se exportó `RedditService`.
- `reddit.service.ts`: Se implementó la inyección de dependencias (`HttpService`, `ConfigService`).
- **Resolución de Error TypeScript:** Se cambió `.get<string>()` por `.getOrThrow<string>()` para aplicar el principio **"Fail Fast"**, asegurando que el servidor se niegue a arrancar (crushee) de forma controlada si falta el `REDDIT_USER_AGENT` en el `.env`, evitando fallos silenciosos en producción.

### Desglose Sintáctico Clave:
- **`firstValueFrom` (RxJS):** Convierte el flujo continuo (Observable / "Manguera") nativo de `@nestjs/axios` en una Promesa estática ("Balde"), adaptándolo al paradigma asíncrono estándar (`async/await`) ideal para peticiones únicas.
- **Encapsulamiento de Arquitectura:** Si la URL o el proveedor cambia (ej. de `.json` a `.xml`), solo se modifica el Servicio (`reddit.service.ts`), manteniendo intactos los Controladores y la lógica de base de datos.

## Fase 5: El Senior Pitch
> *"Implementé un servicio de extracción aislado utilizando `@nestjs/axios`. En lugar de llamar a las APIs directamente desde los controladores, encapsulé la lógica en un Provider que maneja sus propias inyecciones de configuración (`ConfigService`) asegurando el principio de Fail Fast mediante `getOrThrow`. Además, utilicé RxJS (`firstValueFrom`) para adaptar el paradigma reactivo de NestJS al flujo asíncrono estándar, lo que me permite controlar los identificadores de sesión (User-Agent) de forma centralizada y prevenir baneos por rate-limiting."*
