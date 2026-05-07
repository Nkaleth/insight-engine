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
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // 2. Activamos al Head Waiter (Interceptor Global)
  app.useGlobalInterceptors(new TransformInterceptor());

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  Logger.log(
    `🚀 Insight Engine Backend corriendo en http://localhost:${port}`,
    'Bootstrap'
  );
}
bootstrap();
