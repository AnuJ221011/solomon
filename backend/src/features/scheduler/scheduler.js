import cron from 'node-cron';
import { sendWeeklyDigests } from './digest.service.js';
import { logger } from '../../shared/utils/logger.js';

/**
 * Registers all scheduled jobs.
 * Called once from server.js after the server starts.
 */
export const startScheduler = () => {
  // ── Weekly buyer digest ─────────────────────────────────────
  // Every Monday at 9:00 AM UTC (= 2:30 PM IST, 9 AM GMT)
  cron.schedule('0 9 * * 1', async () => {
    logger.info('Cron: weekly digest triggered');
    try {
      const result = await sendWeeklyDigests();
      logger.info('Cron: weekly digest finished', result);
    } catch (err) {
      logger.error('Cron: weekly digest failed', { error: err.message });
    }
  }, { timezone: 'UTC' });

  logger.info('Scheduler started — weekly digest: every Monday 09:00 UTC');
};
