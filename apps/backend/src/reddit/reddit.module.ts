import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { RedditService } from './reddit.service';

@Module({
  imports: [
    HttpModule,
    ConfigModule,
  ],
  providers: [RedditService],
  exports: [RedditService],
})
export class RedditModule { }
