import { ZodError } from 'zod';
import { sendError } from '../utils/response.js';

/**
 * Validates req.body against a Zod schema.
 * Returns 422 with field-level errors on failure.
 */
export const validate = (schema) => async (req, res, next) => {
  try {
    req.body = await schema.parseAsync(req.body);
    next();
  } catch (err) {
    if (err instanceof ZodError) {
      const errors = err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return sendError(res, 'Validation failed', 422, errors);
    }
    next(err);
  }
};

/**
 * Validates req.query against a Zod schema.
 */
export const validateQuery = (schema) => async (req, res, next) => {
  try {
    req.query = await schema.parseAsync(req.query);
    next();
  } catch (err) {
    if (err instanceof ZodError) {
      const errors = err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return sendError(res, 'Invalid query parameters', 422, errors);
    }
    next(err);
  }
};
