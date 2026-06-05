import app from './app.js';
import { env } from './config/env.js';
import prisma from './config/db.js';
import redis from './config/redis.js';
import { refreshFxRates } from './features/fx/index.js';
import { startScheduler } from './features/scheduler/scheduler.js';
import { logger } from './shared/utils/logger.js';

const FX_REFRESH_INTERVAL_MS = 6 * 60 * 60 * 1000; // 6 hours

const startServer = async () => {
  // Verify DB connection (adapter connects lazily — a lightweight query confirms it)
  await prisma.$queryRaw`SELECT 1`;
  logger.info('Database connected');

  // Verify Redis connection
  await redis.connect();

  // Initial FX rate load
  try {
    await refreshFxRates();
  } catch (err) {
    logger.warn('Initial FX rate fetch failed — will retry on first request', { error: err.message });
  }

  // Schedule periodic FX refresh
  setInterval(async () => {
    try {
      await refreshFxRates();
    } catch (err) {
      logger.error('Scheduled FX rate refresh failed', { error: err.message });
    }
  }, FX_REFRESH_INTERVAL_MS);

  // Start cron scheduler (weekly digest + any future jobs)
  startScheduler();

  app.listen(env.PORT, () => {
    logger.info(`Server running on port ${env.PORT} [${env.NODE_ENV}]`);
  });
};

// Graceful shutdown
const shutdown = async (signal) => {
  logger.info(`${signal} received — shutting down gracefully`);
  await prisma.$disconnect().catch(() => {});
  await redis.quit();
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection', { reason: String(reason) });
  process.exit(1);
});

startServer().catch((err) => {
  logger.error('Failed to start server', { error: err.message });
  process.exit(1);
});
