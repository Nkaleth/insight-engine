import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  Logger.log(
    `🚀 Insight Engine Backend corriendo en http://localhost:${port}`,
    'Bootstrap'
  );
}
bootstrap();
