import { errorResponse } from '../utils/responseEnvelope.js';

/**
 * Creates an in-memory sliding window rate limiter middleware.
 * @param {object} options
 * @param {number} options.windowMs - Time window in milliseconds
 * @param {number} options.max - Max allowed requests per IP within the window
 * @param {string} options.message - Custom error message
 */
export function createRateLimiter({ windowMs = 60 * 1000, max = 20, message = 'Too many requests, please try again later.' } = {}) {
  const requests = new Map();

  // Periodic cleanup of expired IP records
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [ip, data] of requests.entries()) {
      if (now > data.resetTime) {
        requests.delete(ip);
      }
    }
  }, windowMs);

  if (cleanupInterval.unref) {
    cleanupInterval.unref();
  }

  return (req, res, next) => {
    // In test environment, allow bypassing rate limits
    if (process.env.NODE_ENV === 'test') {
      return next();
    }

    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    const now = Date.now();

    let record = requests.get(ip);
    if (!record || now > record.resetTime) {
      record = {
        count: 1,
        resetTime: now + windowMs,
      };
      requests.set(ip, record);
    } else {
      record.count += 1;
    }

    const remaining = Math.max(0, max - record.count);
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));

    if (record.count > max) {
      return res
        .status(429)
        .json(
          errorResponse(
            'RATE_LIMIT_EXCEEDED',
            message,
            [{ retryAfterSeconds: Math.ceil((record.resetTime - now) / 1000) }],
            req.id
          )
        );
    }

    next();
  };
}

// Pre-configured rate limiters
export const authRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute window
  max: 15, // max 15 login/register attempts per minute per IP
  message: 'Too many authentication attempts from this IP address. Please wait a minute before trying again.',
});
