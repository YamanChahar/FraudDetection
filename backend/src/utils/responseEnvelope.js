/**
 * Standard uniform API response envelopes for TRACE
 */

export function successResponse(data, meta = {}) {
  return {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta,
    },
  };
}

export function errorResponse(code, message, details = [], requestId = null) {
  return {
    success: false,
    data: null,
    error: {
      code,
      message,
      details,
      timestamp: new Date().toISOString(),
      ...(requestId ? { requestId } : {}),
    },
  };
}
