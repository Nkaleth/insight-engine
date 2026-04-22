import { Controller, Get, UseGuards } from '@nestjs/common'; // TU CÓDIGO AQUÍ: Importa el decorador oficial de NestJS que se usa para "activar" guardias. Pista: Empieza con "Use..."
import { Roles } from './auth/decorators/roles.decorators'; // Nuestro estampador
import { Role } from './auth/enums/role.enum'; // Nuestro diccionario
import { RolesGuard } from './auth/guards/roles.guard'; // Nuestro cadenero
// Asumimos que aquí también importarías tu JwtAuthGuard del sprint pasado

@Controller('dashboard')
export class AppController {

  @Get('finanzas-secretas')
  @UseGuards(RolesGuard) // Activa a nuestro Cadenero
  @Roles(Role.ADMIN) // Pega el post-it VIP
  getSecretData() {
    return { data: 'Los inversionistas van a retirar sus fondos mañana.' };
  }
}
