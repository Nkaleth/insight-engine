import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validate } from './config/config.schema';
import { WinstonModule } from 'nest-winston';
import { winstonConfig } from './config/logger.config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { YoutubeModule } from './youtube/youtube.module';
import { RedditModule } from './reddit/reddit.module';

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
    YoutubeModule,
    RedditModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
