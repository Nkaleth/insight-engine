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
  async analyze(@Body() body: { subreddit: string; limit?: number }) {
    const { subreddit, limit = 15 } = body;
    return this.redditAnalysisService.analyzeSubreddit(subreddit, limit);
  }
}
