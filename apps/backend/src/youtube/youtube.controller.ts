import { Controller, Post, Body } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { YoutubeAnalysisService } from './youtube-analysis.service';
import { AnalyzeYoutubeDto } from './dto/analyze-youtube.dto';

@ApiTags('YouTube')
@Controller('youtube')
export class YoutubeController {
  constructor(
    private readonly youtubeAnalysisService: YoutubeAnalysisService,
  ) {}

  /**
   * Scrappea los comentarios de un video de YouTube, los almacena en CSV
   * y ejecuta un análisis de pain points + clusters con Ollama.
   */
  @ApiOperation({
    summary: 'Analizar comentarios de un video de YouTube',
    description:
      'Dado una URL de YouTube, extrae los comentarios, los exporta a CSV y ejecuta el análisis de insights con el Narrative Auditor (Ollama).',
  })
  @Post('analyze')
  async analyze(@Body() body: AnalyzeYoutubeDto) {
    const { videoUrl, maxComments = 200 } = body;
    return this.youtubeAnalysisService.analyzeVideo(videoUrl, maxComments);
  }
}
