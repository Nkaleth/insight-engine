# Sprint 21: Global Pipes & Interceptors

**Objetivo:** Normalización automática de respuestas para mantener contratos de API predecibles.

---

**Mentor:**
¡Entendido, aspirante! Me pongo el sombrero de Mentor Senior Staff. Vamos a pulir este backend para que cualquier equipo de frontend que lo consuma sienta que está conectándose a una API de grado empresarial. 

En este Sprint 21, aunque el título dice "Global Pipes", vamos a implementar **dos guardianes globales** que van de la mano: el `ValidationPipe` (para limpiar lo que entra) y el `TransformInterceptor` (para estandarizar lo que sale).

### [FASE 1: VERIFICACIÓN DE UTENSILIOS] | ⏱️ 3 min

Para este módulo trabajaremos exclusivamente en el backend (`apps/backend`). Necesitaremos asegurarnos de tener instaladas un par de librerías esenciales para que las "tuberías" de NestJS puedan validar datos automáticamente.

1. **Terminal en la ruta correcta:** Abre tu terminal y asegúrate de estar dentro de `apps/backend`.
2. **Dependencias clave:** Verifica si tenemos instaladas las librerías de validación. Si no, instálalas ejecutando este comando (usando el gestor de paquetes de nuestro monorepo, asumiendo que usas `pnpm`):
   ```bash
   pnpm add class-validator class-transformer
   ```
   *(Glosario rápido: `class-validator` nos permite usar decoradores como `@IsString()` en nuestros DTOs, y `class-transformer` traduce los objetos JSON puros que llegan por HTTP a clases reales de TypeScript que NestJS pueda entender y validar).*

¿Todo listo con las herramientas? Confírmame con un "Listo" o dime si tienes alguna duda sobre estas dependencias para pasar a la **FASE 2**.

**Junior:**
Listo

---

**Mentor:**
Excelente. Avancemos.

### [FASE 2: LA ANALOGÍA DEL CHEF & EL "POR QUÉ"] | ⏱️ 5 min

**1. La Analogía: El Guardia de Insumos y el Head Waiter Perfeccionista**
Imagina la cocina de un restaurante con estrellas Michelin:
* El **`ValidationPipe`** es el estricto Guardia en la puerta de entregas. Si un proveedor trae tomates en mal estado (datos inválidos, tipos incorrectos), este guardia rechaza la caja inmediatamente antes de que siquiera cruce la puerta de la cocina. Como cocinero, jamás te preocupas por revisar si el ingrediente sirve; si llega a tu estación (tu Controlador), tienes la garantía de que es impecable.
* El **`TransformInterceptor`** es el *Head Waiter* perfeccionista en la "mesa de pase". No importa si los cocineros emplataron la comida de manera un poco distinta por el apuro de la orden; el *Head Waiter* limpia los bordes, traslada la comida al mismo plato estándar del restaurante y le coloca una campana plateada encima. Cada plato que llega a la mesa del cliente se ve **exactamente igual** por fuera.

**2. El "Por Qué" Senior: ¿Qué error de novato evitamos?**
* **El error de Junior (Spaghetti Validation & Inconsistent APIs):** Los juniors suelen llenar todos sus controladores de `if (!body.email) throw Error()`. Peor aún, un endpoint responde con `{ "data": [...] }`, otro responde con el arreglo directo `[...]`, y otro con `{ "success": true, "payload": [...] }`. Esto vuelve loco al equipo de frontend, que tiene que programar un *parser* distinto para cada llamada a la API.
* **La visión Senior:** Al usar un Pipe global y un Interceptor global, aislamos la validación y el formateo en la "frontera" de la aplicación. Mantenemos nuestros Controladores limpios (enfocados solo en lógica de negocio) y le damos al Frontend un **contrato predecible e inquebrantable** (ej. siempre van a recibir `{ statusCode, data, message }`). Esto reduce dramáticamente la deuda técnica y los bugs de integración.

¿Hace sentido esta analogía y el dolor de cabeza técnico que estamos evitando? Confírmame si hay alguna duda o dime "Siguiente" para pasar a la **FASE 3**.

**Junior:**
pasemos a la fase 3

---

**Mentor:**
Excelente. Aquí tienes nuestro plan de acción. Lo haremos paso a paso para no abrumarnos.

### [FASE 3: EL PLAN DE ACCIÓN (PASO A PASO)] | ⏱️ 7 min

Solo necesitamos 3 mini-pasos para implementar esta arquitectura a prueba de balas:

1. **Definir la Estructura (Interface):**
   * *Archivo:* (Lo pondremos dentro del interceptor) Definiremos una `interface Response<T>`.
   * *Qué hace:* Es el "contrato legal" que le dice a TypeScript: *"A partir de hoy, TODAS las respuestas tendrán exactamente estas propiedades: `statusCode`, `message` (opcional) y `data`"*.
2. **Crear el Interceptor (`transform.interceptor.ts`):**
   * *Archivo:* Crearemos este nuevo archivo en la ruta `apps/backend/src/common/interceptors/transform.interceptor.ts`.
   * *Qué hace:* Este es nuestro "Head Waiter". Su trabajo es interceptar silenciosamente lo que sea que devuelva el Controlador, meterlo dentro de la propiedad `data`, agregar el estado HTTP de éxito (`statusCode`), y enviarlo finalmente hacia el Frontend.
3. **Instalar los Guardianes Globales (`main.ts`):**
   * *Archivo:* Editaremos el archivo maestro `apps/backend/src/main.ts`.
   * *Qué hace:* Aquí le diremos a la aplicación de NestJS que active tanto nuestro `TransformInterceptor` como el `ValidationPipe` integrado **a nivel global**. Al hacerlo aquí, evitamos tener que importarlos ruta por ruta.

¿Tienes clara la secuencia y la responsabilidad de cada archivo? Si es así, dime "A combatir" para pasar a la **FASE 4** y ensuciarnos las manos con código.

**Junior:**
pasemos a la fase 4

---

**Mentor:**
¡A las trincheras! Vamos a construir esto paso a paso.

### [FASE 4: EL COMBATE (CODIFICACIÓN GUIADA)] | ⏱️ 20 min

Vamos a empezar creando nuestro **Interceptor** (El "Head Waiter"). 
Crea el archivo `apps/backend/src/common/interceptors/transform.interceptor.ts` (si la carpeta no existe, créala).

Aquí tienes la **ESTRUCTURA BASE**. Tu misión es reemplazar los `_____` con el código correcto basándote en la lógica.

```typescript
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

// 1. EL CONTRATO
export interface Response<T> {
  statusCode: number;
  message?: string;
  data: T;
}

// 2. EL INTERCEPTOR (El "Head Waiter")
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    // Obtenemos el contexto HTTP para saber qué código de estado se generó (ej: 200, 201)
    const ctx = context.switchToHttp();
    const response = ctx.getResponse();
    const currentStatusCode = response.statusCode;

    // Ejecutamos el Controlador (next.handle()) e interceptamos lo que devuelve (data)
    return next.handle().pipe(
      map((controllerData) => ({
        statusCode: _____, // <--- ¿Qué variable contiene el estado HTTP de éxito?
        data: _____,       // <--- ¿Qué variable contiene lo que resolvió el controlador?
      })),
    );
  }
}
```

#### 🔍 Desglose de Sintaxis (Análisis línea por línea):
*   `interface Response<T>`: Define nuestra estructura estándar. Usamos `<T>` (un tipo Genérico) porque la `data` puede ser un Array, un String, o un Objeto complejo; el interceptor no necesita saber qué es, solo necesita saber que va en la propiedad `data`.
*   `implements NestInterceptor`: Para que NestJS reconozca esta clase como un Interceptor válido, estamos obligados a implementar el método `intercept`.
*   `context.switchToHttp()`: NestJS es agnóstico, puede correr WebSockets o Microservicios. Aquí le decimos explícitamente: *"Sácame el contexto de protocolo HTTP para poder leer el response de Express/Fastify"*.
*   `next.handle()`: Esto literalmente dice "Pásale la pelota al Controlador para que haga su trabajo de base de datos".
*   `.pipe(map(...))`: Usamos programación reactiva (RxJS). Significa: *"Cuando el controlador termine, captura lo que iba a devolver, pásalo por este 'tubo' (`pipe`), y transfórmalo (`map`) en el nuevo objeto que definimos arriba"*.

**Tu Turno:** Dime exactamente cómo quedarían esas dos líneas donde están los `_____`. Tómate tu tiempo.

**Junior:**
Listo, completado.

---

**Mentor:**
¡Impecable! Lo resolviste perfectamente. Acabas de crear un Interceptor funcional.

Ahora vamos al paso final de este combate: **Instalar a nuestros guardianes globales.**

Abre el archivo maestro `apps/backend/src/main.ts`. Aquí le vamos a decir a NestJS que el Guardia de Insumos (`ValidationPipe`) y el *Head Waiter* (`TransformInterceptor`) deben trabajar para **TODAS** las rutas de nuestra aplicación automáticamente.

Aquí tienes la **ESTRUCTURA BASE**. Tu misión es descubrir y reemplazar los dos `_____` con los métodos correctos de NestJS.

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
// Importamos nuestras herramientas de validación e intercepción
import { ValidationPipe } from '@nestjs/common';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Activamos al Guardia de Insumos (Validation Pipe Global)
  app._____(
    new ValidationPipe({
      whitelist: true,            
      forbidNonWhitelisted: true, 
      transform: true,            
    }),
  );

  // 2. Activamos al Head Waiter (Interceptor Global)
  app._____(new TransformInterceptor());

  await app.listen(3001); // Asegúrate de mantener el puerto que ya tuvieras configurado
}
bootstrap();
```

#### 🔍 Desglose de Sintaxis:
*   `new ValidationPipe({ ... })`: Estamos instanciando el pipe oficial de NestJS y pasándole 3 opciones críticas para la seguridad de un proyecto Senior:
    *   `whitelist: true`: Si un DTO solo pide `email` y `password`, pero un atacante manda `{ "email": "a", "password": "b", "esAdmin": true }`, el pipe arranca el campo `esAdmin` y solo deja pasar lo esperado.
    *   `forbidNonWhitelisted: true`: En lugar de solo remover los campos maliciosos/extra, esto hace que el servidor responda inmediatamente con un **HTTP 400 Bad Request**. Literalmente le tira la caja en la cara al proveedor.
    *   `transform: true`: Convierte automáticamente los JSON crudos que viajan por internet en clases reales de TypeScript para que los validadores (`@IsString()`) funcionen.

**Tu Turno:** 
Piensa en el nombre de las funciones de la variable `app`. Si queremos usar **Pipes** de manera **Global**, ¿cómo se llamaría el método? ¿Y para usar **Interceptors** de manera **Global**?

Rellena los `_____` en `main.ts` y avísame cuando lo tengas "Listo". Si no compila o tienes dudas, te doy una pista técnica.

**Junior:**
okay, pero como está ahora mi `apps/backend/src/main.ts`, estoy usando logger y WINSTON_MODULE_NEST_PROVIDER, ya no se usará eso? 

---

**Mentor:**
¡Excelente ojo y fantástica pregunta! Ese es exactamente el instinto de un desarrollador Senior: proteger el código base y la arquitectura que ya funciona.

**No, no vamos a borrar el logger de Winston.** Mi plantilla era una versión simplificada para enfocarnos en los conceptos, pero en la realidad, el Logger, los Pipes y los Interceptors conviven en total armonía en este archivo.

Aquí tienes la **ESTRUCTURA BASE CORREGIDA**, fusionando tu código actual con nuestros nuevos guardianes. Trata de rellenar los `_____`:

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Logger, ValidationPipe } from '@nestjs/common';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  
  // Tu logger existente sigue totalmente intacto
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  // 1. Activamos al Guardia de Insumos (Validation Pipe Global)
  app._____(
    new ValidationPipe({
      whitelist: true,            
      forbidNonWhitelisted: true, 
      transform: true,            
    }),
  );

  // 2. Activamos al Head Waiter (Interceptor Global)
  app._____(new TransformInterceptor());

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  Logger.log(
    `🚀 Insight Engine Backend corriendo en http://localhost:${port}`,
    'Bootstrap'
  );
}
bootstrap();
```

**Tu Turno:** Rellena los dos `_____` en tu archivo `apps/backend/src/main.ts` con los métodos de NestJS para usar Pipes e Interceptors globales (`useGlobal...`). Avísame con un "Listo" cuando lo tengas.

**Junior:**
listo,  @[apps/backend/src/main.ts]completado.

---

**Mentor:**
¡Brillante! Veo que usaste `app.useGlobalPipes()` y `app.useGlobalInterceptors()`. Has configurado exitosamente la barrera arquitectónica de tu aplicación. 

Pasemos al cierre del Sprint.

### [FASE 5: EL SENIOR PITCH & CIERRE] | ⏱️ 10 min

**1. Pitch de Entrevista:** 
*Reclutador: He visto tu proyecto "Insight Engine". ¿Cómo aseguraste la consistencia de los datos entre el Backend y el Frontend?*
*Tú:* "Para mantener un contrato de API predecible y evitar la deuda técnica de la validación defensiva (spaghetti code), implementé una arquitectura basada en **Global Enhancers** en NestJS. Configuré un `ValidationPipe` global con sanitización estricta (`whitelist` y `forbidNonWhitelisted`) que rechaza payloads sucios en la capa de red. Simultáneamente, construí un `TransformInterceptor` que normaliza automáticamente la salida de todos los controladores. Esto garantizó que el equipo de frontend siempre recibiera una estructura idéntica `(statusCode, data, message)`, reduciendo significativamente los bugs de integración."

**2. Pregunta de Refuerzo:**
Si mañana un desarrollador de Frontend viene corriendo a ti y te dice: *"¡Oye! Un nuevo endpoint del backend me está devolviendo un arreglo crudo `[1, 2, 3]` en lugar del objeto estándar `{ statusCode: 200, data: [1, 2, 3] }` que habíamos acordado"*. 

Como el Senior Staff del proyecto... **¿Qué archivo o configuración revisarías primero para asegurarte de que nuestro sistema global no se desconfiguró o rompió?**

(Respóndeme esto y daremos por cerrado este Sprint triunfalmente).

**Junior:**
revisaría el @[apps/backend/src/common/interceptors/transform.interceptor.ts], la parte del return en nuestro caso sol odevuelve statuscode y data

---

**Mentor:**
Respuesta a medias, ¡pero buen instinto!
Revisar `transform.interceptor.ts` es un excelente primer paso para ver si la *lógica* de transformación cambió. Pero, si el endpoint de pronto está devolviendo un arreglo crudo **directamente del controlador** sin pasar por el formato estandarizado, lo más probable es que alguien borró accidentalmente la línea `app.useGlobalInterceptors(new TransformInterceptor());` en tu archivo maestro `main.ts` (despidiendo así a nuestro *Head Waiter* global).

Dicho esto, ¡has dominado el concepto de Global Enhancers! 

### 🏆 SPRINT 21 COMPLETADO
Has subido otro nivel en tu viaje hacia Senior. Implementamos con éxito las tuberías globales y guardamos el registro íntegro de nuestra sesión en `sprint-21-mentor.md`.

Cuando estés listo para el siguiente desafío (Sprint 22: Swagger Documentation), simplemente dímelo.
