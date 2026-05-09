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
    description: 'Número máximo de comentarios a extraer (default: 200)',
    minimum: 10,
    maximum: 500,
    default: 200,
  })
  @IsOptional()
  @IsNumber()
  @Min(10)
  @Max(500)
  maxComments?: number;
}
