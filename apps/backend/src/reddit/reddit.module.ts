import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { RedditService } from './reddit.service';
import { RedditController } from './reddit.controller';
import { RedditAnalysisService } from './reddit-analysis.service';
import { QueueModule } from 'src/queue/queue.module';
import { YoutubeModule } from '../youtube/youtube.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [
    HttpModule,
    ConfigModule,
    forwardRef(() => QueueModule),
    forwardRef(() => YoutubeModule),
    AiModule,
  ],
  controllers: [RedditController],
  providers: [RedditService, RedditAnalysisService],
  exports: [RedditService, RedditAnalysisService],
})
export class RedditModule { }
