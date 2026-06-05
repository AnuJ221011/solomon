import { logger } from '../utils/logger.js';
import { sendError } from '../utils/response.js';

export const notFound = (req, res) => {
  sendError(res, `Route not found: ${req.method} ${req.originalUrl}`, 404);
};

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  logger.error('Unhandled error', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.originalUrl,
    method: req.method,
  });

  // Prisma known request errors
  if (err.code === 'P2002') {
    return sendError(res, 'A record with this value already exists', 409);
  }
  if (err.code === 'P2025') {
    return sendError(res, 'Record not found', 404);
  }

  const statusCode = err.statusCode ?? err.status ?? 500;
  const message = statusCode < 500 ? err.message : 'Internal server error';
  sendError(res, message, statusCode);
};
