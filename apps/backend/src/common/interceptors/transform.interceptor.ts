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
        statusCode: currentStatusCode,
        data: controllerData,
      })),
    );
  }
}
