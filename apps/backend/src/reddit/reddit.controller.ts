import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { RedditAnalysisService } from './reddit-analysis.service';

@Controller('reddit')
export class RedditController {
  constructor(private readonly redditAnalysisService: RedditAnalysisService) {}

  /**
   * Scrappea un subreddit, analiza los posts con Ollama y devuelve
   * pain points estructurados + clusters para el MarketMap.
   */
  @Post('analyze')
  async analyze(@Body() body: { subreddit: string; limit?: number; forceRefresh?: boolean }) {
    const { subreddit, limit = 50, forceRefresh = false } = body;
    return this.redditAnalysisService.analyzeSubreddit(subreddit, limit, forceRefresh);
  }
}
