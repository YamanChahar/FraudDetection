import { randomUUID } from 'crypto';

export function correlationIdMiddleware(req, res, next) {
  const correlationId = req.headers['x-request-id'] || randomUUID();
  req.id = correlationId;
  res.setHeader('X-Request-Id', correlationId);
  next();
}
