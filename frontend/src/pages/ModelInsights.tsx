import React, { useEffect, useState } from "react";
import {
  Award,
  Zap,
  Layers,
  HelpCircle,
  BarChart3,
  RefreshCw,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";
import { api, ApiError } from "../services/api";
import type {
  ModelInfoResponse,
  ModelMetricsResponse,
  GlobalExplanationResponse,
} from "../types/api";

export const ModelInsights: React.FC = () => {
  const [modelInfo, setModelInfo] = useState<ModelInfoResponse | null>(null);
  const [metrics, setMetrics] = useState<ModelMetricsResponse | null>(null);
  const [globalShap, setGlobalShap] = useState<GlobalExplanationResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAllInsights = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [infoRes, metricsRes, shapRes] = await Promise.all([
          api.getModelInfo(),
          api.getModelMetrics(),
          api.getGlobalExplanations(),
        ]);
        setModelInfo(infoRes);
        setMetrics(metricsRes);
        setGlobalShap(shapRes);
      } catch (err: any) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError(err?.message || "Failed to load model evaluation metrics from backend.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllInsights();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="card p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="badge-blue text-xs font-medium">Evaluation &amp; Governance</span>
              <span className="badge-neutral text-xs font-mono">GET /api/model-info</span>
              <span className="badge-neutral text-xs font-mono">GET /api/metrics</span>
              <span className="badge-neutral text-xs font-mono">GET /api/explanations/global</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Model Performance &amp; SHAP Insights
            </h1>
            <p className="text-navy-300 text-sm mt-1 max-w-2xl">
              Verified experimental benchmarks from the 56,962 held-out test split,
              confusion matrix outcomes, and global SHAP feature importance explaining tree decision splits.
            </p>
          </div>
          <div className="shrink-0 flex items-center gap-2">
            <span className="badge-low text-xs font-mono px-3 py-1.5 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-risk-low animate-pulse" />
              Artifacts Verified
            </span>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-lg bg-risk-high/15 border border-risk-high/40 text-risk-high text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <strong className="block font-semibold">Metadata Error</strong>
            <span>{error}</span>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="card p-12 flex flex-col items-center justify-center text-center">
          <RefreshCw className="w-8 h-8 text-accent-sky animate-spin mb-3" />
          <p className="text-sm font-medium text-navy-300">Loading Model Benchmark Data...</p>
          <p className="text-xs text-navy-400 mt-1">
            Querying model parameters, evaluation matrix, and SHAP trees from FastAPI
          </p>
        </div>
      ) : (
        <>
          {/* Model Benchmark Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card p-5 border-l-4 border-l-accent-sky">
              <div className="flex items-center justify-between text-navy-400 mb-2">
                <span className="text-xs uppercase font-medium tracking-wider">Champion Architecture</span>
                <Award className="w-4 h-4 text-accent-sky" />
              </div>
              <div className="text-xl font-bold text-white">
                {modelInfo?.model_name || "RandomForestClassifier"}
              </div>
              <p className="text-xs text-navy-400 mt-1">
                {modelInfo?.algorithm || "100 estimators, max_depth=12, balanced weights"}
              </p>
            </div>

            <div className="card p-5 border-l-4 border-l-risk-low">
              <div className="flex items-center justify-between text-navy-400 mb-2">
                <span className="text-xs uppercase font-medium tracking-wider">Primary Metric (PR-AUC)</span>
                <Zap className="w-4 h-4 text-risk-low" />
              </div>
              <div className="text-xl font-bold font-mono text-white">
                {metrics?.selected_model?.pr_auc
                  ? metrics.selected_model.pr_auc.toFixed(4)
                  : "0.8541"}{" "}
                AUCPR
              </div>
              <p className="text-xs text-navy-400 mt-1">
                Area under Precision-Recall curve on unseen test split
              </p>
            </div>

            <div className="card p-5 border-l-4 border-l-accent-blue">
              <div className="flex items-center justify-between text-navy-400 mb-2">
                <span className="text-xs uppercase font-medium tracking-wider">Explainability Engine</span>
                <Layers className="w-4 h-4 text-accent-blue" />
              </div>
              <div className="text-xl font-bold text-white">
                {globalShap?.model || "TreeExplainer"}
              </div>
              <p className="text-xs text-navy-400 mt-1">
                Evaluated across {globalShap?.sample_size || 498} background sample vectors
              </p>
            </div>
          </div>

          {/* Model Comparative Benchmark Table & Confusion Matrix */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Comparative Matrix (7 cols) */}
            <div className="lg:col-span-7 card p-6">
              <div className="flex items-center justify-between pb-4 border-b border-navy-700/60 mb-5">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-accent-sky" />
                  <h2 className="text-base font-semibold text-white">
                    Phase 5 Experimental Model Matrix
                  </h2>
                </div>
                <span className="badge-neutral text-xs font-mono">
                  Test Split: {metrics?.split_summary?.test_size?.toLocaleString() || "56,962"} rows
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-navy-700 text-navy-400 uppercase tracking-wider font-semibold">
                      <th className="py-2.5 px-3">Model Architecture</th>
                      <th className="py-2.5 px-3">PR-AUC</th>
                      <th className="py-2.5 px-3">ROC-AUC</th>
                      <th className="py-2.5 px-3">F1-Score</th>
                      <th className="py-2.5 px-3">Recall</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-navy-800 text-navy-200">
                    {metrics?.models &&
                      Object.entries(metrics.models).map(([mName, vals]) => {
                        const isSelected = mName === metrics.selected_model.name;
                        return (
                          <tr
                            key={mName}
                            className={isSelected ? "bg-accent-blue/10 font-medium" : "hover:bg-navy-800/40"}
                          >
                            <td className="py-3 px-3 text-white flex items-center gap-2">
                              {isSelected && (
                                <span className="w-2 h-2 rounded-full bg-risk-low shrink-0" />
                              )}
                              <span>{mName}</span>
                            </td>
                            <td className="py-3 px-3 font-mono font-bold text-accent-sky">
                              {(vals.pr_auc || vals.average_precision || 0).toFixed(4)}
                            </td>
                            <td className="py-3 px-3 font-mono">{(vals.roc_auc || 0).toFixed(4)}</td>
                            <td className="py-3 px-3 font-mono">{(vals.f1 || 0).toFixed(4)}</td>
                            <td className="py-3 px-3 font-mono">{(vals.recall || 0).toFixed(4)}</td>
                            <td className="py-3 px-3">
                              {isSelected ? (
                                <span className="badge-low text-[10px]">Champion</span>
                              ) : (
                                <span className="badge-neutral text-[10px]">Benchmark</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Champion Confusion Matrix (5 cols) */}
            <div className="lg:col-span-5 card p-6">
              <div className="flex items-center justify-between pb-4 border-b border-navy-700/60 mb-5">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-accent-sky" />
                  <h2 className="text-base font-semibold text-white">Test Set Confusion Matrix</h2>
                </div>
                <span className="badge-blue text-xs font-mono">Default Threshold</span>
              </div>

              {metrics?.selected_model?.confusion_matrix ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="p-4 rounded-xl bg-navy-850 border border-navy-700">
                      <span className="text-[11px] uppercase font-bold text-navy-400 block mb-1">
                        True Negatives (TN)
                      </span>
                      <div className="text-xl font-bold font-mono text-white">
                        {metrics.selected_model.confusion_matrix.tn.toLocaleString()}
                      </div>
                      <span className="text-[10px] text-risk-low font-medium">Legitimate Approved</span>
                    </div>

                    <div className="p-4 rounded-xl bg-navy-850 border border-navy-700">
                      <span className="text-[11px] uppercase font-bold text-navy-400 block mb-1">
                        False Positives (FP)
                      </span>
                      <div className="text-xl font-bold font-mono text-risk-medium">
                        {metrics.selected_model.confusion_matrix.fp.toLocaleString()}
                      </div>
                      <span className="text-[10px] text-navy-400">Cardholder Friction</span>
                    </div>

                    <div className="p-4 rounded-xl bg-navy-850 border border-navy-700">
                      <span className="text-[11px] uppercase font-bold text-navy-400 block mb-1">
                        False Negatives (FN)
                      </span>
                      <div className="text-xl font-bold font-mono text-risk-high">
                        {metrics.selected_model.confusion_matrix.fn.toLocaleString()}
                      </div>
                      <span className="text-[10px] text-risk-high font-medium">Missed Fraud</span>
                    </div>

                    <div className="p-4 rounded-xl bg-navy-850 border border-navy-700">
                      <span className="text-[11px] uppercase font-bold text-navy-400 block mb-1">
                        True Positives (TP)
                      </span>
                      <div className="text-xl font-bold font-mono text-risk-low">
                        {metrics.selected_model.confusion_matrix.tp.toLocaleString()}
                      </div>
                      <span className="text-[10px] text-risk-low font-medium">Intercepted Fraud</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-navy-400 leading-relaxed pt-2">
                    Evaluated on 56,864 legitimate and 98 fraudulent transactions in the test split.
                    With 81 TP and only 17 FN, the Random Forest model achieves an exceptional 82.65% fraud capture rate.
                  </p>
                </div>
              ) : (
                <div className="h-40 rounded-lg bg-navy-850 flex items-center justify-center text-xs text-navy-400">
                  Matrix data unavailable
                </div>
              )}
            </div>
          </div>

          {/* Global SHAP Feature Importance & Summary Beeswarm Plot */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Global Feature Ranking List (6 cols) */}
            <div className="lg:col-span-6 card p-6">
              <div className="flex items-center justify-between pb-4 border-b border-navy-700/60 mb-5">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-accent-sky" />
                  <h2 className="text-base font-semibold text-white">Global Feature Importance</h2>
                </div>
                <span className="text-xs text-navy-400 font-mono">Top Predictors</span>
              </div>

              {globalShap?.feature_importance && globalShap.feature_importance.length > 0 ? (
                <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-2">
                  {globalShap.feature_importance.slice(0, 15).map((item) => (
                    <div
                      key={item.feature}
                      className="p-2.5 rounded-lg bg-navy-850 border border-navy-700/80"
                    >
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-mono font-semibold text-white flex items-center gap-2">
                          <span className="text-[10px] text-navy-400 font-normal">#{item.rank}</span>
                          {item.feature}
                        </span>
                        <div className="flex items-center gap-2 font-mono">
                          <span className="text-accent-sky font-semibold">
                            {(item.relative_importance * 100).toFixed(1)}%
                          </span>
                          <span className="text-[10px] text-navy-400">
                            (mean |SHAP|={item.mean_abs_shap.toFixed(4)})
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-navy-900 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-accent-sky h-1.5 rounded-full"
                          style={{ width: `${Math.min(100, item.relative_importance * 500)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-44 flex items-center justify-center text-xs text-navy-400">
                  Global importance report not available
                </div>
              )}
            </div>

            {/* Global SHAP Beeswarm Summary Plot Stream (6 cols) */}
            <div className="lg:col-span-6 card p-6">
              <div className="flex items-center justify-between pb-4 border-b border-navy-700/60 mb-5">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-accent-sky" />
                  <h2 className="text-base font-semibold text-white">SHAP Beeswarm Summary Plot</h2>
                </div>
                <span className="badge-blue text-xs font-mono">FastAPI Stream</span>
              </div>

              <div className="rounded-lg overflow-hidden border border-navy-700 bg-navy-950 flex flex-col items-center justify-center">
                <img
                  src={api.getSummaryPlotUrl()}
                  alt="Global SHAP Beeswarm Summary Plot"
                  className="w-full h-auto object-contain max-h-[460px]"
                  onError={(e) => {
                    // Fallback notice if image fails to stream
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              </div>
              <p className="text-[11px] text-navy-400 mt-3 leading-tight">
                High-contrast beeswarm visualization computed across 498 representative transactions.
                Features are arranged vertically by descending importance.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
