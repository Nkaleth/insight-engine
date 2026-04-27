import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
// 1. Importamos TODA la librería de bcrypt (la licuadora)
import * as bcrypt from "bcrypt";
import { CreateUserDto } from "./dto/create-user.dto";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class UsersService {
  // 1. Instanciamos la conexión a la Base de Datos
  private prisma: PrismaClient;

  constructor(private configService: ConfigService) {
    // Validamos que la variable de entorno exista usando el ConfigService oficial de NestJS
    const connectionString = this.configService.get<string>('DATABASE_URL');
    if (!connectionString) {
      throw new Error("DATABASE_URL is not defined in the environment variables.");
    }
    
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    this.prisma = new PrismaClient({ adapter });
  }

  // 2. Nuestra función debe ser "async" porque la criptografía es un trabajo   pesado para el procesador y tomará unos milisegundos.
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
  }
}