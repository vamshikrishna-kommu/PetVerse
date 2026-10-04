import { createApp } from './app';
import { connectDatabase } from './config/database';
import { env } from './config/env';
import { logger } from './shared/utils/logger';
import { automationService } from './modules/automation/services/automation.service';
import { notificationSubscriber } from './modules/notifications/subscribers/notification.subscriber';
import { reminderSubscriber } from './modules/reminders/subscribers/reminder.subscriber';
import { reminderService } from './modules/reminders/services/reminder.service';

const PORT = env.PORT;

async function bootstrap() {
  logger.info(`🚀 Starting PetVerse API (${env.NODE_ENV})...`);

  // Connect to database first
  await connectDatabase();

  // Initialize Background Services & Subscribers
  automationService.init();
  notificationSubscriber.init();
  reminderSubscriber.init();
  reminderService.startWorker();

  const app = createApp();
  const server = app.listen(PORT, '0.0.0.0', () => {
    logger.info(`✅ API running at http://0.0.0.0:${PORT}`);
    logger.info(`📋 Health: http://localhost:${PORT}/health`);
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info(`${signal} received — shutting down gracefully...`);
    server.close(() => {
      reminderService.stopWorker();
      logger.info('HTTP server closed');
      process.exit(0);
    });

    // Force exit after 10s
    setTimeout(() => {
      logger.error('Force shutdown after timeout');
      process.exit(1);
    }, 10_000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Unhandled errors
  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled Rejection:', reason);
  });

  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
  });
}

bootstrap().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
