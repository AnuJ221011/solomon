import passport from '../../config/passport.js';
import { sendError } from '../utils/response.js';

/**
 * Requires a valid JWT access token. Attaches req.user on success.
 */
export const authenticate = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user) => {
    if (err) return next(err);
    if (!user) return sendError(res, 'Unauthorised', 401);
    req.user = user;
    next();
  })(req, res, next);
};

/**
 * Requires authentication AND that the user's email is verified.
 */
export const requireVerified = (req, res, next) => {
  authenticate(req, res, () => {
    if (!req.user.isEmailVerified) {
      return sendError(res, 'Email verification required', 403);
    }
    next();
  });
};

/**
 * Optionally attaches req.user if a valid token is present.
 * Does NOT block the request if no token or invalid token.
 * Used for public routes that personalise for logged-in users.
 */
export const optionalAuthenticate = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user) => {
    if (user) req.user = user;
    next();
  })(req, res, next);
};
