import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller'; // <-- 1. Importamos el cajero

@Module({
  controllers: [UsersController], // <-- 2. Registramos el cajero en la sucursal
  providers: [UsersService]
})
export class UsersModule {}
