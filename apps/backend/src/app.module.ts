import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validate } from './config/config.schema';
import { WinstonModule } from 'nest-winston';
import { winstonConfig } from './config/logger.config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '../../.env',
      validate,
      isGlobal: true
    }),
    WinstonModule.forRoot(winstonConfig),
    AuthModule,
    UsersModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
