import { ZodError } from 'zod';
import { errorResponse } from '../utils/responseEnvelope.js';

/**
 * Higher-order middleware to validate request data against Zod schemas.
 * @param {object} schemas - Object containing optional body, query, and params Zod schemas.
 * @param {import('zod').ZodSchema} [schemas.body] - Zod schema for req.body
 * @param {import('zod').ZodSchema} [schemas.query] - Zod schema for req.query
 * @param {import('zod').ZodSchema} [schemas.params] - Zod schema for req.params
 */
export function validateRequest({ body, query, params }) {
  return (req, res, next) => {
    try {
      if (body) {
        req.body = body.parse(req.body);
      }
      if (query) {
        req.query = query.parse(req.query);
      }
      if (params) {
        req.params = params.parse(req.params);
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
          code: e.code,
        }));
        return res.status(422).json(
          errorResponse('VALIDATION_ERROR', 'Request validation failed', details, req.id)
        );
      }
      next(error);
    }
  };
}
