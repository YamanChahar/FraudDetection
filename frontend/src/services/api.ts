/**
 * Centralized API Service for communicating with the FraudLens FastAPI ML backend.
 * Handles environment-based URL resolution, request serialization, error parsing, and typing.
 */

import type {
  HealthResponse,
  ModelInfoResponse,
  ModelMetricsResponse,
  SinglePredictionResponse,
  BatchPredictionResponse,
  LocalExplanationResponse,
  GlobalExplanationResponse,
  TransactionExplorerResponse,
  ThresholdsConfig,
} from "../types/api";

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000").replace(/\/$/, "");

export class ApiError extends Error {
  status: number;
  details?: any;

  constructor(message: string, status: number, details?: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        Accept: "application/json",
        ...options?.headers,
      },
    });

    if (!response.ok) {
      let errorMessage = `Request failed with status ${response.status}`;
      let errorDetails: any = null;
      try {
        const errorData = await response.json();
        errorDetails = errorData;
        if (errorData?.detail) {
          if (typeof errorData.detail === "string") {
            errorMessage = errorData.detail;
          } else if (Array.isArray(errorData.detail)) {
            // Pydantic validation error array
            errorMessage = errorData.detail
              .map((d: any) => `${d.loc?.join(".") || "field"}: ${d.msg}`)
              .join("; ");
          } else {
            errorMessage = JSON.stringify(errorData.detail);
          }
        }
      } catch {
        // Fallback to text status
        errorMessage = response.statusText || errorMessage;
      }
      throw new ApiError(errorMessage, response.status, errorDetails);
    }

    return (await response.json()) as T;
  } catch (err: any) {
    if (err instanceof ApiError) {
      throw err;
    }
    // Network errors (e.g. backend server offline, CORS block)
    throw new ApiError(
      err?.message || "Failed to connect to backend server. Verify the FastAPI service is running on port 8000.",
      0,
      err
    );
  }
}

export const api = {
  getBaseUrl(): string {
    return BASE_URL;
  },

  /**
   * Health status of API service, ML model readiness, and dataset presence.
   */
  async getHealth(): Promise<HealthResponse> {
    return request<HealthResponse>("/api/health");
  },

  /**
   * Model governance, hyperparameter configuration, feature list, and calibration note.
   */
  async getModelInfo(): Promise<ModelInfoResponse> {
    return request<ModelInfoResponse>("/api/model-info");
  },

  /**
   * Verified evaluation metrics and test split comparative performance.
   */
  async getModelMetrics(): Promise<ModelMetricsResponse> {
    return request<ModelMetricsResponse>("/api/metrics");
  },

  /**
   * Score a single transaction across all 30 canonical features.
   */
  async predictSingle(
    features: Record<string, number>,
    thresholds?: ThresholdsConfig
  ): Promise<SinglePredictionResponse> {
    return request<SinglePredictionResponse>("/api/predict", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        features,
        thresholds: thresholds || undefined,
      }),
    });
  },

  /**
   * High-throughput batch scoring of an uploaded CSV file.
   */
  async predictBatch(
    file: File,
    thresholds?: { low_threshold?: number; high_threshold?: number }
  ): Promise<BatchPredictionResponse> {
    const formData = new FormData();
    formData.append("file", file);

    const params = new URLSearchParams();
    if (thresholds?.low_threshold !== undefined) {
      params.append("low_threshold", thresholds.low_threshold.toString());
    }
    if (thresholds?.high_threshold !== undefined) {
      params.append("high_threshold", thresholds.high_threshold.toString());
    }

    const query = params.toString() ? `?${params.toString()}` : "";
    const url = `${BASE_URL}/api/predict/batch${query}`;

    try {
      const response = await fetch(url, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        let msg = `Batch prediction failed (${response.status})`;
        try {
          const err = await response.json();
          msg = err.detail || msg;
        } catch {}
        throw new ApiError(msg, response.status);
      }

      return (await response.json()) as BatchPredictionResponse;
    } catch (err: any) {
      if (err instanceof ApiError) throw err;
      throw new ApiError(err?.message || "Batch scoring failed", 0, err);
    }
  },

  /**
   * URL for downloading the verified 10-row sample CSV.
   */
  getSampleBatchUrl(): string {
    return `${BASE_URL}/api/sample-batch`;
  },

  /**
   * Global SHAP importance rankings.
   */
  async getGlobalExplanations(): Promise<GlobalExplanationResponse> {
    return request<GlobalExplanationResponse>("/api/explanations/global");
  },

  /**
   * URL for the precomputed beeswarm summary plot image.
   */
  getSummaryPlotUrl(): string {
    return `${BASE_URL}/api/explanations/summary-plot`;
  },

  /**
   * Local SHAP instance attribution explaining top risk-increasing/decreasing drivers.
   */
  async explainLocal(
    features: Record<string, number>,
    top_n: number = 5
  ): Promise<LocalExplanationResponse> {
    return request<LocalExplanationResponse>("/api/explanations/local", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        features,
        top_n,
      }),
    });
  },

  /**
   * Transaction explorer records with live model predictions.
   */
  async getTransactions(params?: {
    class_filter?: "all" | "legitimate" | "fraudulent";
    min_amount?: number;
    max_amount?: number;
    limit?: number;
  }): Promise<TransactionExplorerResponse> {
    const q = new URLSearchParams();
    if (params?.class_filter) q.append("class_filter", params.class_filter);
    if (params?.min_amount !== undefined) q.append("min_amount", params.min_amount.toString());
    if (params?.max_amount !== undefined) q.append("max_amount", params.max_amount.toString());
    if (params?.limit !== undefined) q.append("limit", params.limit.toString());

    const queryString = q.toString() ? `?${q.toString()}` : "";
    return request<TransactionExplorerResponse>(`/api/transactions/explorer${queryString}`);
  },
};
