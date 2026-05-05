import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { RedditService } from './reddit.service';
import { QueueModule } from 'src/queue/queue.module';

@Module({
  imports: [
    HttpModule,
    ConfigModule,
    forwardRef(() => QueueModule),
  ],
  providers: [RedditService],
  exports: [RedditService],
})
export class RedditModule { }
