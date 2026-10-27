import { hasPermission } from '../config/permissions.js';
import { errorResponse } from '../utils/responseEnvelope.js';

/**
 * Middleware factory requiring user to possess at least one of the specified roles.
 * @param {string|string[]} roles - Single role string or array of allowed roles
 */
export function requireRole(roles) {
  const allowed = Array.isArray(roles) ? roles : [roles];

  return (req, res, next) => {
    if (!req.user) {
      return res
        .status(401)
        .json(errorResponse('UNAUTHORIZED', 'Authentication is required before checking permissions.', [], req.id));
    }

    if (!allowed.includes(req.user.role)) {
      return res
        .status(403)
        .json(
          errorResponse(
            'FORBIDDEN',
            `Insufficient permissions. Access requires one of [${allowed.join(', ')}], but your role is '${req.user.role}'.`,
            [],
            req.id
          )
        );
    }

    next();
  };
}

/**
 * Middleware factory requiring user role to hold a specific functional permission.
 * @param {string} permission - Named permission key from PERMISSIONS
 */
export function requirePermission(permission) {
  return (req, res, next) => {
    if (!req.user) {
      return res
        .status(401)
        .json(errorResponse('UNAUTHORIZED', 'Authentication is required before checking permissions.', [], req.id));
    }

    if (!hasPermission(req.user.role, permission)) {
      return res
        .status(403)
        .json(
          errorResponse(
            'FORBIDDEN',
            `Access denied. Role '${req.user.role}' lacks the required '${permission}' permission.`,
            [],
            req.id
          )
        );
    }

    next();
  };
}
