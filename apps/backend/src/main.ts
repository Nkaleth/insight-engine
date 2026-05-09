import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Logger, ValidationPipe } from '@nestjs/common';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  // CORS: permite peticiones desde el frontend en desarrollo
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // Tu logger existente sigue totalmente intacto
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  // 1. Activamos al Guardia de Insumos (Validation Pipe Global)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // 2. Activamos al Head Waiter (Interceptor Global)
  app.useGlobalInterceptors(new TransformInterceptor());

  // 3. Configuración de Swagger (El Menú del Restaurante)
  const config = new DocumentBuilder()
    .setTitle('Insight Engine API')
    .setDescription('Documentación de la API para Arqueología de la Frustración')
    .setVersion('1.0')
    .addBearerAuth()
    .build(); // <- 1. ¿Qué método usamos para "construir" finalmente esta configuración?

  // Creamos el documento estandarizado escaneando la app y la config
  const documentFactory = () => SwaggerModule.createDocument(app, config); // <- 2. ¿Qué método del SwaggerModule "crea el documento"?

  // Levantamos la interfaz visual en la ruta '/api-docs'
  SwaggerModule.setup('api-docs', app, documentFactory); // <- 3 y 4. ¿Qué método "monta" o "configura" (setup) la UI, y qué string de ruta le pasamos como primer argumento para verla en la web?

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  Logger.log(
    `🚀 Insight Engine Backend corriendo en http://localhost:${port}`,
    'Bootstrap'
  );
}
bootstrap();
