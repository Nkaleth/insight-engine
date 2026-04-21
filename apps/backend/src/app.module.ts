import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validate } from './config/config.schema';
import { WinstonModule } from 'nest-winston';
import { winstonConfig } from './config/logger.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '../../.env',
      validate,
      isGlobal: true
    }),
    WinstonModule.forRoot(winstonConfig),
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
