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
    const hashedPassword = await bcrypt.hash(password, saltRounds);

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