import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common'; // TU CÓDIGO AQUÍ: Importa "ExecutionContext". Es el objeto que contiene toda la info de la petición que estamos interceptando.

import { Reflector } from '@nestjs/core';
import { Role } from '../enums/role.enum';
import { ROLES_KEY } from '../decorators/roles.decorators';

// 3. @Injectable() es la etiqueta para Dependency Injection. Le dice a NestJS: "Puedes instanciar esta clase donde la necesiten".
@Injectable()
export class RolesGuard implements CanActivate {

  // 4. El constructor pide (inyecta) la herramienta Reflector para poder usarla dentro de la clase usando "this.reflector".
  constructor(private reflector: Reflector) { }

  // 5. canActivate es el corazón del Guardia. Si retorna true, pasas. Si retorna false, NestJS lanza un error 403 Forbidden.
  canActivate(context: ExecutionContext): boolean { // TU CÓDIGO AQUÍ: ¿Qué tipo de dato es 'context'? Es el que importaste arriba.

    // 6. Usamos el Reflector (la lupa) para buscar un post-it con la llave ROLES_KEY.
    // Busca primero en el método (ej. un endpoint específico) y luego en la clase (el controlador entero).
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // 7. Si no hay post-it (requiredRoles no existe), significa que la ruta es para todo público. Pasas directo.
    if (!requiredRoles) {
      return true;
    }

    // 8. Convertimos el contexto genérico en un contexto HTTP y extraemos el objeto 'request' (la petición web).
    const { user } = context.switchToHttp().getRequest(); // TU CÓDIGO AQUÍ: ¿Qué método de NestJS nos da la petición (Request)? Pista: su nombre es "getRequest"

    // 9. Si el usuario no existe en la petición (no traía JWT o falló el sprint anterior), lo rebotamos.
    if (!user) {
      return false;
    }

    // 10. requiredRoles es un arreglo, ej: ['admin']. 
    // Revisamos si ALGUNO de los roles permitidos coincide con el rol que trae el usuario en su JWT.
    return requiredRoles.some((role) => user.role === role); // TU CÓDIGO AQUÍ: Qué función nativa de arreglos en JavaScript verifica si "algún" elemento cumple una condición? Pista: Empieza con "s" y significa "alguno" en inglés.
  }
}
