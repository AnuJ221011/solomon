import { sendError } from '../utils/response.js';

/**
 * Restricts a route to specific roles.
 * Must be used after authenticate middleware.
 * @param {...string} roles - Allowed roles (e.g. 'ADMIN', 'BRAND', 'BUYER')
 */
export const authorize = (...roles) =>
  (req, res, next) => {
    if (!req.user) return sendError(res, 'Unauthorised', 401);
    if (!roles.includes(req.user.role)) {
      return sendError(res, 'Forbidden — insufficient permissions', 403);
    }
    next();
  };
