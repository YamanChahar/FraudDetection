/**
 * TypeScript type definitions for FraudLens API contracts.
 * Matches backend/app/schemas.py exact structure.
 */

export interface HealthResponse {
  status: string;
  model_loaded: boolean;
  model_name: string | null;
  dataset_connected: boolean;
  version: string;
}

export interface ThresholdsConfig {
  low_threshold: number;
  high_threshold: number;
}

export interface SinglePredictionRequest {
  features: Record<string, number>;
  thresholds?: ThresholdsConfig;
}

export interface SinglePredictionResponse {
  fraud_probability: number;
  risk_score: number;
  risk_category: 'Low Risk' | 'Medium Risk' | 'High Risk' | string;
  operational_recommendation: string;
  model_name: string;
  threshold_configuration: {
    low_threshold: number;
    high_threshold: number;
  };
  disclaimer: string;
}

export interface BatchPredictionSummary {
  total: number;
  low_risk_count: number;
  medium_risk_count: number;
  high_risk_count: number;
  low_risk_pct: number;
  medium_risk_pct: number;
  high_risk_pct: number;
}

export interface BatchPredictionResponse {
  summary: BatchPredictionSummary;
  results: Record<string, any>[];
  columns: string[];
}

export interface ModelInfoResponse {
  model_name: string;
  algorithm: string;
  feature_count: number;
  features: string[];
  default_thresholds: {
    low_risk: number;
    high_risk: number;
  };
  hyperparameters: Record<string, any>;
  dataset_provenance: {
    name: string;
    total_records: number;
    fraud_records: number;
    fraud_prevalence: string;
    time_window: string;
  };
  probability_calibration_notice: string;
  regulatory_disclaimer: string;
}

export interface ModelMetricsResponse {
  selected_model: {
    id?: string;
    name: string;
    selection_reason?: string;
    artifact_path?: string;
    pr_auc?: number;
    roc_auc?: number;
    f1?: number;
    precision?: number;
    recall?: number;
    confusion_matrix?: {
      tn?: number;
      fp?: number;
      fn?: number;
      tp?: number;
      true_negatives?: number;
      false_positives?: number;
      false_negatives?: number;
      true_positives?: number;
      [key: string]: any;
    };
    [key: string]: any;
  };
  models: Record<
    string,
    {
      pr_auc?: number;
      roc_auc?: number;
      f1?: number;
      precision?: number;
      recall?: number;
      average_precision?: number;
      confusion_matrix?: {
        tn?: number;
        fp?: number;
        fn?: number;
        tp?: number;
        true_negatives?: number;
        false_positives?: number;
        false_negatives?: number;
        true_positives?: number;
        [key: string]: any;
      };
      metrics?: Record<string, any>;
      model_name?: string;
      [key: string]: any;
    }
  >;
  split_summary: Record<string, any>;
}

export interface FeatureContribution {
  feature: string;
  raw_value: number;
  shap_value: number;
  direction: 'increases_risk' | 'decreases_risk' | string;
  abs_impact: number;
}

export interface LocalExplanationRequest {
  features: Record<string, number>;
  top_n?: number;
}

export interface LocalExplanationResponse {
  base_value: number;
  predicted_probability: number;
  sum_shap_values: number;
  top_risk_increasing: FeatureContribution[];
  top_risk_decreasing: FeatureContribution[];
  contributions: FeatureContribution[];
  explained_class: string;
  output_scale: string;
}

export interface GlobalImportanceItem {
  feature: string;
  mean_abs_shap: number;
  relative_importance: number;
  rank: number;
}

export interface GlobalExplanationResponse {
  sample_size: number;
  model: string;
  explained_class: string;
  output_scale: string;
  feature_importance: GlobalImportanceItem[];
}

export interface TransactionExplorerItem {
  Class: number;
  Amount: number;
  Time: number;
  fraud_probability: number;
  risk_score: number;
  risk_category: string;
}

export interface TransactionExplorerResponse {
  total_matching: number;
  transactions: TransactionExplorerItem[];
}
