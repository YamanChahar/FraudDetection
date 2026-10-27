import { verifyAccessToken } from '../utils/tokenUtils.js';
import { errorResponse } from '../utils/responseEnvelope.js';

/**
 * Authentication middleware that validates short-lived Bearer JWT access tokens.
 */
export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res
      .status(401)
      .json(errorResponse('UNAUTHORIZED', 'Authentication token required. Please provide a valid Bearer token.', [], req.id));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyAccessToken(token);
    req.user = {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role,
      name: decoded.name,
    };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res
        .status(401)
        .json(errorResponse('TOKEN_EXPIRED', 'Access token has expired. Please refresh your session.', [], req.id));
    }

    return res
      .status(401)
      .json(errorResponse('INVALID_TOKEN', 'Authentication token is invalid or corrupted.', [], req.id));
  }
}
