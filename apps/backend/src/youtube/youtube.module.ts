import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { YoutubeProvider } from './youtube.provider';
import { YoutubeService } from './youtube.service';
import { YoutubeAnalysisService } from './youtube-analysis.service';
import { ReportsService } from './reports.service';
import { YoutubeController } from './youtube.controller';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [
    ConfigModule,
    AiModule,
  ],
  controllers: [YoutubeController],
  providers: [YoutubeProvider, YoutubeService, YoutubeAnalysisService, ReportsService],
  exports: [YoutubeService, YoutubeAnalysisService, ReportsService],
})
export class YoutubeModule { }