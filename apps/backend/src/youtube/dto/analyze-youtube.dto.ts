import { IsUrl, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AnalyzeYoutubeDto {
  @ApiProperty({
    description: 'URL completa del video de YouTube a analizar',
    example: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  })
  @IsUrl()
  videoUrl: string;

  @ApiPropertyOptional({
    description: 'Número máximo de comentarios a extraer (default: 5000)',
    minimum: 10,
    maximum: 10000,
    default: 5000,
  })
  @IsOptional()
  @IsNumber()
  @Min(10)
  @Max(10000)
  maxComments?: number;

  @ApiPropertyOptional({
    description: 'Forzar extracción desde la API, borrando vectores y CSV existentes',
    default: false,
  })
  @IsOptional()
  forceRefresh?: boolean;
}
