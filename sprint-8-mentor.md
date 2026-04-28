# 👨‍🏫 Mensaje del Mentor (Backup por fallo de interfaz)

_(Las Fases 1 y 2 están completadas)_

## [FASE 3: EL PLAN DE ACCIÓN DEL SPRINT] | ⏱️ 7 min

Para no enredarnos y hacer las cosas paso a paso, vamos a dividir la creación de usuarios seguros en 5 mini-pasos. Nada de código gigante de golpe.

### 📌 Los 5 Mini-Pasos Tácticos

1. **Actualizar el Plano (Prisma):** Añadir el campo `password` a nuestro modelo de usuario en la base de datos.
2. **Crear la Aduana (DTO):** Definir un objeto estricto que diga exactamente qué datos exigimos para crear un usuario (email y password).
3. **Encender la Licuadora (Service):** Crear la lógica en el servicio de usuarios para atrapar la contraseña, "hashearla" usando `bcrypt` con una buena cantidad de Sal, y guardar el puré en la base de datos.
4. **Crear el Comparador (Service):** Hacer una función que tome una contraseña plana (cuando el usuario intenta loguearse), la vuelva a licuar y compare si el nuevo puré es idéntico al puré guardado.
5. **Abrir la Ventanilla (Controller):** Exponer esto como una ruta HTTP (`POST /users`) para poder probarlo desde Bruno.

### 🗺️ El Mapa de Archivos (Nuestras Armas)

- 📄 `prisma/schema.prisma` (MODIFICAR): El arquitecto. Le diremos que la tabla `User` ahora necesita una columna para guardar el hash.
- 📄 `src/users/dto/create-user.dto.ts` (NUEVO): El **Filtro de Aduana**. Es una clase simple que usa validadores para asegurarse de que el email es válido y que la contraseña no está en blanco.
- 📄 `src/users/users.service.ts` (MODIFICAR): El **Cerebro**. Aquí es donde importaremos `bcrypt` y haremos todo el trabajo pesado matemáticamente.
- 📄 `src/users/users.controller.ts` (NUEVO): El **Cajero**. Simplemente recibe la petición de Bruno y se la pasa al Cerebro.

---

_(Fase 3 Completada)_

## [FASE 4: EL COMBATE] | Round 1 🥊 (Base de Datos y DTO)

Vamos a ensuciarnos las manos. Empezaremos creando la tabla en la base de datos y nuestro "Filtro de Aduana" (DTO).

### Misión 1: Actualizar el Plano (Prisma)

Ve a `apps/backend/prisma/schema.prisma`. Veo que aún no tenemos un modelo de Usuario, así que vamos a crearlo desde cero.
Añade este bloque al final del archivo:

```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String   // Aquí guardaremos el puré, NO la contraseña plana
  role      String   @default("user") // Usaremos los roles del sprint anterior
  createdAt DateTime @default(now())
}
```

_Nota: Después de guardar el archivo, recuerda abrir tu terminal (en `apps/backend`) y ejecutar `npx prisma generate` para que NestJS se entere del nuevo modelo. (Si tuviéramos la base de datos levantada haríamos `db push`, pero por ahora con `generate` actualizamos los tipos)._

### Misión 2: Crear el DTO (La Aduana)

Vamos a instalar las librerías de validación automáticas de NestJS.
En tu terminal (dentro de `apps/backend`), ejecuta:
`pnpm add class-validator class-transformer`

Ahora crea el archivo `apps/backend/src/users/dto/create-user.dto.ts` y completa los huecos:

```typescript
// apps/backend/src/users/dto/create-user.dto.ts

// TU CÓDIGO AQUÍ: Importa IsEmail y IsString desde 'class-validator'
import { ________, ________, MinLength } from "class-validator";

export class CreateUserDto {
  // @IsEmail() es un decorador que hace que la petición sea rechazada automáticamente (Error 400 Bad Request) si el texto no tiene un '@' y un dominio válido.
  @________() // TU CÓDIGO AQUÍ: Usa el decorador de Email que importaste.
  email: string;

  @________() // TU CÓDIGO AQUÍ: Asegúrate de que la contraseña sea una cadena de texto (String). Pista: Is...
  @MinLength(6, { message: "La contraseña debe tener al menos 6 caracteres" })
  password: string;
}
```

**Tu Turno:**

1. Actualiza `schema.prisma` y corre el comando `generate`.
2. Instala las dos librerías.
3. Crea el `create-user.dto.ts` y rellena los 4 huecos (`________`).

**Respóndeme por el chat cuando lo hayas logrado o si alguna parte del código te parece "chino" para traducírtela.**

---

_(Round 1 Completado)_

## [FASE 4: EL COMBATE] | Round 2 🥊 (El Cerebro de la Licuadora)

Ahora vamos a meterle mano al archivo `apps/backend/src/users/users.service.ts` que generó el CLI. Aquí es donde traemos nuestra licuadora industrial (`bcrypt`) y hacemos el puré.

Reemplaza todo el contenido de tu `users.service.ts` con esto y llena los huecos:

```typescript
// apps/backend/src/users/users.service.ts
import { Injectable } from "@nestjs/common";
// 1. Importamos TODA la librería de bcrypt (la licuadora)
import * as bcrypt from "bcrypt";
import { CreateUserDto } from "./dto/create-user.dto";

@Injectable()
export class UsersService {
  // (Omitimos el constructor de Prisma por un momento para enfocarnos en la criptografía)

  // 2. Nuestra función debe ser "async" porque la criptografía es un trabajo pesado para el procesador y tomará unos milisegundos.
  async create(createUserDto: CreateUserDto) {
    // 3. Extraemos las propiedades que pasaron por la aduana del DTO
    const { email, password } = createUserDto;

    // 4. Definimos el nivel de Sal. (10 es el estándar de oro: lo suficientemente seguro, pero no tan lento como para colapsar tu servidor).
    const saltRounds = 10;

    // 5. ¡A licuar! Tomamos la contraseña plana y la mezclamos con la sal.
    // TU CÓDIGO AQUÍ: Llama a la librería 'bcrypt' y usa su función asíncrona que sirve para hacer el hash. Pista: su nombre es exactamente lo que hace en inglés.
    const hashedPassword = await ________.________(password, saltRounds);

    // 6. Aquí enviaríamos el 'hashedPassword' a Prisma para guardarlo en la Base de Datos.
    // Por ahora, solo retornaremos el resultado para que veas el puré en Bruno.
    return {
      mensaje: "Manzana licuada con éxito",
      emailGuardado: email,
      passwordReal: "Secreto, ni yo lo sé",
      pureMatematico: hashedPassword,
    };
  }
}
```

**Tu Turno:** Rellena los dos huecos (`________.________`) que faltan. Cuando lo tengas, dime "Listo" por el chat y pasamos a crear la ruta para probarlo en **Bruno**.

---

*(Round 2 Completado)*

## [FASE 4: EL COMBATE] | Round 3 🥊 (La Ventanilla de Cobro)

Ya tenemos el Cerebro (la licuadora). Ahora necesitamos abrir la ventanilla al público para que tu cliente REST (Bruno) o el Frontend puedan mandarnos los datos del usuario.

Abre el archivo `apps/backend/src/users/users.controller.ts` que generó el CLI, reemplaza su contenido con esto y completa los huecos:

```typescript
// apps/backend/src/users/users.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';

// 1. Aquí definimos que todas las rutas de este archivo empezarán con /users
@Controller('users')
export class UsersController {
  
  // 2. Inyectamos a nuestro Cerebro (UsersService) en el constructor para poder usarlo
  constructor(private readonly usersService: UsersService) {}

  // 3. Esta acción responderá a las peticiones POST (Crear algo nuevo)
  @________() // TU CÓDIGO AQUÍ: ¿Qué decorador de NestJS usamos para recibir peticiones POST? (Pista: Lo importaste arriba en la línea 2)
  create(@________() createUserDto: CreateUserDto) { 
    // TU CÓDIGO AQUÍ: Usa el decorador @Body() para indicarle a NestJS que el 'createUserDto' viene dentro del "Cuerpo" de la petición HTTP.
    
    // Le pasamos el paquete de datos ya filtrado por la aduana directamente a la licuadora (el Servicio)
    return this.usersService.create(createUserDto);
  }
}
```

**Tu Turno Final del Combate:** Rellena los dos huecos (`@________()`).

### 🧪 La Prueba de Fuego en Bruno:
1. Levanta tu servidor backend ejecutando en la consola (desde la raíz o la carpeta backend): `pnpm --filter backend run start:dev`
2. Abre **Bruno** y crea una nueva petición de tipo `POST` apuntando a: `http://localhost:3000/users`
3. Ve a la pestaña `Body`, elige `JSON` y escribe este paquete:
```json
{
  "email": "ceo@insight-engine.com",
  "password": "miSuperPassword123"
}
```
4. Haz clic en `Send`.

**Dime por el chat si lograste ver el "puré matemático" (hashedPassword) en la respuesta de Bruno.** 

---

*(Round 3 Completado)*

## [FASE 4: EL COMBATE] | Round 4 🥊 (La Persistencia / Guardar en BD)

¡Excelente pregunta! Efectivamente, hasta ahora solo estábamos "jugando" en la memoria RAM con el puré. Para guardar al usuario de verdad, necesitamos conectar la licuadora a la Base de Datos.

En NestJS, la mejor práctica es tener un `PrismaService` global, pero para mantener el enfoque de este sprint, vamos a importar el cliente de Prisma directamente en nuestro `users.service.ts`.

Abre `apps/backend/src/users/users.service.ts` y haz estos tres cambios:

1. Importa el cliente de Prisma en la **línea 1** (hasta arriba del archivo):
```typescript
import { PrismaClient } from '@prisma/client';
```

2. Adentro de tu clase `UsersService`, antes de la función `create`, crea la conexión a la base de datos:
```typescript
@Injectable()
export class UsersService {
  // 1. Instanciamos la conexión a la Base de Datos
  private prisma = new PrismaClient();
```

3. Por último, reemplaza el `return` falso que teníamos al final de la función `create` por la inserción real:
```typescript
    // 6. Ahora SÍ guardamos en Prisma
    const newUser = await this.prisma.user.create({
      data: {
        email: email,
        password: hashedPassword, // Guardamos el puré, NO la contraseña plana
      },
    });

    // 7. Devolvemos el usuario creado (pero ocultamos el password en la respuesta de Bruno por seguridad)
    return {
      message: 'Usuario guardado en la Base de Datos exitosamente',
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role
      }
    };
```

**Tu Turno Final:** Aplica estos cambios en tu `users.service.ts`.
Vuelve a darle a `Send` en Bruno (si te da error de correo duplicado, cámbiale el correo en el JSON de Bruno). Si te responde con el mensaje "Usuario guardado en la Base de Datos", ¡lo habremos logrado!

**Dime por el chat cuando lo consigas y cerramos el Sprint.**
