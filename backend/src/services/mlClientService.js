import axios from 'axios';
import env from '../config/env.js';

/**
 * Internal HTTP client for Python FastAPI Machine Learning Service
 * Strict 1500ms initial timeout with internal service authentication
 */
const mlHttpClient = axios.create({
  baseURL: env.ML_SERVICE_URL,
  timeout: env.ML_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
    'X-Internal-Service-Key': env.INTERNAL_SERVICE_KEY,
  },
});

/**
 * Predicts transaction fraud risk with SHAP explainability via Python FastAPI service.
 * @param {Record<string, any>} features
 * @returns {Promise<any>}
 */
export async function predictTransaction(features) {
  try {
    const response = await mlHttpClient.post('/internal/v1/predict', features);
    return response.data;
  } catch (error) {
    const message = error.response?.data?.detail || error.message;
    const status = error.response?.status || (error.code === 'ECONNABORTED' ? 504 : 503);
    const err = new Error(`ML Service inference failure: ${message}`);
    err.status = status;
    err.code = error.code === 'ECONNABORTED' ? 'ML_TIMEOUT' : 'ML_SERVICE_ERROR';
    throw err;
  }
}

/**
 * Executes batch inference on multiple transaction records.
 * @param {Array<Record<string, any>>} transactions
 * @returns {Promise<any>}
 */
export async function batchPredict(transactions) {
  try {
    const response = await mlHttpClient.post('/internal/v1/batch-predict', { transactions });
    return response.data;
  } catch (error) {
    const message = error.response?.data?.detail || error.message;
    const status = error.response?.status || (error.code === 'ECONNABORTED' ? 504 : 503);
    const err = new Error(`ML Service batch inference failure: ${message}`);
    err.status = status;
    err.code = error.code === 'ECONNABORTED' ? 'ML_TIMEOUT' : 'ML_SERVICE_ERROR';
    throw err;
  }
}

/**
 * Retrieves active champion model metadata and historical evaluation benchmarks.
 * @returns {Promise<any>}
 */
export async function getModelMetadata() {
  try {
    const response = await mlHttpClient.get('/internal/v1/model/metadata');
    return response.data;
  } catch (error) {
    const message = error.response?.data?.detail || error.message;
    const err = new Error(`ML Service metadata error: ${message}`);
    err.status = error.response?.status || 503;
    err.code = 'ML_SERVICE_ERROR';
    throw err;
  }
}

/**
 * Checks connectivity and readiness of the Python ML Service
 */
export async function checkMlServiceHealth() {
  try {
    const response = await mlHttpClient.get('/internal/v1/health');
    return {
      available: true,
      data: response.data,
      status: response.status,
    };
  } catch (error) {
    return {
      available: false,
      error: error.response?.data || error.message,
      status: error.response?.status || (error.code === 'ECONNABORTED' ? 504 : 503),
      timedOut: error.code === 'ECONNABORTED',
    };
  }
}

export default mlHttpClient;
