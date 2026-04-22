import { z } from 'zod';

// 1. El Manifiesto Paramilitar: Definimos qué aceptamos y de qué tipo.
export const envSchema = z.object({
  POSTGRES_USER: z.string(),
  POSTGRES_PASSWORD: z.string(),
  POSTGRES_DB: z.string(),
  // Zod coerce convierte los numéros de texto del .env a Number reales
  POSTGRES_PORT: z.coerce.number().default(5432),
  REDIS_PORT: z.coerce.number().default(6379),
  JWT_SECRET: z.string(),
});

export type EnvConfig = z.infer<typeof envSchema>;

// 2. El Inspector que le pasaremos a NestJS
export function validate(config: Record<string, unknown>) {
  const parsed = envSchema.safeParse(config);

  if (!parsed.success) {
    console.error(
      '❌ Error fatal en Variables de Entorno:',
      parsed.error.issues,
    );
    throw new Error('Configuración inválida. El servidor no puede iniciar.');
  }

  return parsed.data;
}
