import { errorResponse } from '../utils/responseEnvelope.js';

export function errorHandler(err, req, res, _next) {
  let status = err.status || err.statusCode || 500;
  let code = err.code || 'INTERNAL_SERVER_ERROR';
  let message = err.message || 'An unexpected internal error occurred';
  let details = err.details || [];

  // Mongoose Validation Error (Schema field constraints)
  if (err.name === 'ValidationError') {
    status = 422;
    code = 'VALIDATION_ERROR';
    message = 'Database model validation failed';
    details = Object.keys(err.errors || {}).map((field) => ({
      field,
      message: err.errors[field].message,
      kind: err.errors[field].kind,
    }));
  }
  // Mongoose CastError (e.g. Invalid ObjectId casting)
  else if (err.name === 'CastError') {
    status = 400;
    code = 'INVALID_IDENTIFIER';
    message = `Invalid identifier format for field '${err.path}'`;
    details = [{ field: err.path, value: err.value, message }];
  }
  // MongoDB Duplicate Key Error (Unique index violation, E11000)
  else if (err.code === 11000 || (err.name === 'MongoServerError' && err.code === 11000)) {
    status = 409;
    code = 'CONFLICT';
    const fields = err.keyValue ? Object.keys(err.keyValue).join(', ') : 'field';
    message = `Unique constraint violation: duplicate value for ${fields}`;
    details = [{ field: fields, keyValue: err.keyValue, message }];
  }
  // MongoDB Connection / Server Selection Timeout Error
  else if (
    err.name === 'MongooseServerSelectionError' ||
    err.name === 'MongoNetworkError' ||
    err.name === 'MongoTimeoutError' ||
    err.name === 'MongoServerSelectionError' ||
    (err.message && err.message.includes('buffering timed out')) ||
    (err.message && err.message.includes('connect ECONNREFUSED'))
  ) {
    status = 503;
    code = 'DATABASE_UNAVAILABLE';
    message = 'MongoDB server is currently unreachable. Please check database service.';
    details = [{ error: err.name, message: err.message }];
  }
  // Payload Too Large / Entity Too Large (HTTP 413)
  else if (err.status === 413 || err.statusCode === 413 || err.type === 'entity.too.large') {
    status = 413;
    code = 'PAYLOAD_TOO_LARGE';
    message = 'Request payload exceeds the maximum allowed size limit (50MB). Please reduce the file size or number of records.';
    details = [{ error: err.name, message: err.message }];
  }

  if (status >= 500) {
    console.error(`[Unhandled Error] Request ${req.id || 'N/A'}:`, err.message || err);
  }

  res.status(status).json(errorResponse(code, message, details, req.id));
}
