import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { RedditService } from './reddit.service';
import { RedditController } from './reddit.controller';
import { RedditAnalysisService } from './reddit-analysis.service';
import { QueueModule } from 'src/queue/queue.module';

@Module({
  imports: [
    HttpModule,
    ConfigModule,
    forwardRef(() => QueueModule),
  ],
  controllers: [RedditController],
  providers: [RedditService, RedditAnalysisService],
  exports: [RedditService, RedditAnalysisService],
})
export class RedditModule { }
