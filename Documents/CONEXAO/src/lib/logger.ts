import pino from 'pino';

// Define se estamos num ambiente de desenvolvimento para formatar bonitinho
const isDevelopment = process.env.NODE_ENV !== 'production';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname', // Ocultar pid e hostname no dev para ficar mais limpo
        },
      }
    : undefined, // Em prod (Docker/Portainer), logs brutos em JSON são melhores para indexação
  formatters: {
    level: (label) => {
      return { level: label.toUpperCase() };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});
