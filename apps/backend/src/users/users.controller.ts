// apps/backend/src/users/users.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';

// 1. Aquí definimos que todas las rutas de este archivo empezarán con /users
@Controller('users')
export class UsersController {

  // 2. Inyectamos a nuestro Cerebro (UsersService) en el constructor para poder usarlo
  constructor(private readonly usersService: UsersService) { }

  // 3. Esta acción responderá a las peticiones POST (Crear algo nuevo)
  @Post() // TU CÓDIGO AQUÍ: ¿Qué decorador de NestJS usamos para recibir peticiones POST? (Pista: Lo importaste arriba en la línea 2)
  create(@Body() createUserDto: CreateUserDto) {

    // TU CÓDIGO AQUÍ: Usa el decorador @Body() para indicarle a NestJS que el 'createUserDto' viene dentro del "Cuerpo" de la petición HTTP.

    // Le pasamos el paquete de datos ya filtrado por la aduana directamente a la licuadora (el Servicio)
    return this.usersService.create(createUserDto);
  }
}