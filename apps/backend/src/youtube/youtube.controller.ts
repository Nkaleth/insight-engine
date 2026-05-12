import { Controller, Post, Get, Delete, Body, Param, Res, NotFoundException, HttpCode } from '@nestjs/common';
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
    const { videoUrl, maxComments = 5000, forceRefresh = false } = body;
    return this.youtubeAnalysisService.analyzeVideo(videoUrl, maxComments, forceRefresh);
  }

  @ApiOperation({ summary: 'Generar ideas de contenido de un video de YouTube' })
  @Post('content-ideas')
  async contentIdeas(@Body() body: AnalyzeYoutubeDto) {
    const { videoUrl, maxComments = 5000, forceRefresh = false } = body;
    return this.youtubeAnalysisService.analyzeContentIdeas(videoUrl, maxComments, forceRefresh);
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

  @ApiOperation({ summary: 'Eliminar un reporte .md' })
  @Delete('reports/:type/:fileName')
  @HttpCode(204)
  async deleteReport(
    @Param('type') type: string,
    @Param('fileName') fileName: string,
  ) {
    if (type !== 'pain-points' && type !== 'content-ideas') {
      throw new NotFoundException('Tipo de reporte inválido');
    }
    try {
      await this.reportsService.deleteReport(type as 'pain-points' | 'content-ideas', fileName);
    } catch {
      throw new NotFoundException(`Reporte no encontrado: ${fileName}`);
    }
  }

  @ApiOperation({ summary: 'Eliminar un CSV de comentarios' })
  @Delete('reports/csv/:source/:csvFileName')
  @HttpCode(204)
  async deleteCsv(
    @Param('source') source: string,
    @Param('csvFileName') csvFileName: string,
  ) {
    if (source !== 'youtube' && source !== 'reddit') {
      throw new NotFoundException('Fuente inválida');
    }
    try {
      await this.reportsService.deleteCsv(csvFileName, source as 'youtube' | 'reddit');
    } catch {
      throw new NotFoundException(`CSV no encontrado: ${csvFileName}`);
    }
  }
}
