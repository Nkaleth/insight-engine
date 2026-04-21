import { format, transports } from 'winston';
import { utilities as nestWinstonModuleUtilities, WinstonModule } from 'nest-winston';
import DailyRotateFile = require('winston-daily-rotate-file');
import * as winston from 'winston';

export const winstonConfig = {
  // 1. ¿Qué información extra queremos en todos los logs? 
  // (timestamp, etc). Nest-Winston nos ayuda con su formato.
  format: format.combine(
    winston.format.timestamp(),
    nestWinstonModuleUtilities.format.nestLike('Insight-engine', {
      colors: true,
      prettyPrint: true,
      processId: true,
      appName: true,
    }),
  ),

  // 2. ¿A dónde enviamos los logs?
  transports: [
    // TRANSPORT 1: La Consola (Para cuando estamos desarrollando)
    new transports.Console(),

    new DailyRotateFile({
      dirname: 'logs',
      filename: 'insight-engine-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxFiles: '14d',
    }),
  ],
};
