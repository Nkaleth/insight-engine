import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validate } from './config/config.schema';

@Module({
  imports: [ConfigModule.forRoot({
    validate,
    isGlobal: true
  })],
  controllers: [],
  providers: [],
})
export class AppModule { }
