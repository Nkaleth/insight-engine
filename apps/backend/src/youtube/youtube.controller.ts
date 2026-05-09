import { Controller, Post, Get, Body, Param, Res, NotFoundException } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { YoutubeAnalysisService } from './youtube-analysis.service';
import { ReportsService } from './reports.service';
import { AnalyzeYoutubeDto } from './dto/analyze-youtube.dto';

@ApiTags('YouTube')
@Controller('youtube')
export class YoutubeController {
  constructor(
    private readonly youtubeAnalysisService: YoutubeAnalysisService,
    private readonly reportsService: ReportsService,
  ) {}

  @ApiOperation({ summary: 'Analizar comentarios de un video de YouTube' })
  @Post('analyze')
  async analyze(@Body() body: AnalyzeYoutubeDto) {
    const { videoUrl, maxComments = 200 } = body;
    return this.youtubeAnalysisService.analyzeVideo(videoUrl, maxComments);
  }

  @ApiOperation({ summary: 'Generar ideas de contenido de un video de YouTube' })
  @Post('content-ideas')
  async contentIdeas(@Body() body: AnalyzeYoutubeDto) {
    const { videoUrl, maxComments = 200 } = body;
    return this.youtubeAnalysisService.analyzeContentIdeas(videoUrl, maxComments);
  }

  @ApiOperation({ summary: 'Listar todos los reportes guardados' })
  @Get('reports')
  async listReports() {
    return this.reportsService.listReports();
  }

  @ApiOperation({ summary: 'Leer el contenido de un reporte .md' })
  @Get('reports/:type/:fileName')
  async getReport(
    @Param('type') type: string,
    @Param('fileName') fileName: string,
    @Res() res: any,
  ) {
    if (type !== 'pain-points' && type !== 'content-ideas') {
      throw new NotFoundException('Tipo de reporte inválido');
    }
    try {
      const content = await this.reportsService.readReport(
        type as 'pain-points' | 'content-ideas',
        fileName,
      );
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.send(content);
    } catch {
      throw new NotFoundException(`Reporte no encontrado: ${fileName}`);
    }
  }
}

