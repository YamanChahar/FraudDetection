import React, { useEffect, useState } from "react";
import {
  Activity,
  ShieldCheck,
  AlertTriangle,
  ArrowUpRight,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import { api, ApiError } from "../services/api";
import type {
  HealthResponse,
  ModelInfoResponse,
  ModelMetricsResponse,
} from "../types/api";

export const Overview: React.FC = () => {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [modelInfo, setModelInfo] = useState<ModelInfoResponse | null>(null);
  const [metrics, setMetrics] = useState<ModelMetricsResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOverviewData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [healthRes, infoRes, metricsRes] = await Promise.all([
          api.getHealth(),
          api.getModelInfo(),
          api.getModelMetrics(),
        ]);
        setHealth(healthRes);
        setModelInfo(infoRes);
        setMetrics(metricsRes);
      } catch (err: any) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError(err?.message || "Failed to connect to backend service.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchOverviewData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Banner / Status Overview */}
      <div className="card p-6 bg-gradient-to-r from-navy-800 to-navy-850 border border-navy-700/80">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="badge-blue text-xs font-medium">Subphase D Connected</span>
              <span className="badge-low text-xs font-medium">
                Model: {health?.model_name || "Random Forest Champion"}
              </span>
              <span className="badge-neutral text-xs font-mono flex items-center">
                {isLoading && <RefreshCw className="w-3 h-3 animate-spin mr-1" />}
                FastAPI: {health?.status === "healthy" ? "Healthy" : isLoading ? "Connecting..." : "Offline"}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Executive Fraud Detection Posture
            </h1>
            <p className="text-navy-300 text-sm mt-1 max-w-2xl">
              High-throughput decision engine benchmarked on the ULB credit card fraud
              corpus. Calibrated for extreme class imbalance (0.172% positive fraud rate)
              with three-tier operational risk tiering.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/analyze"
              className="px-4 py-2 bg-accent-blue hover:bg-accent-sky text-navy-950 font-semibold rounded-lg text-sm transition-colors flex items-center gap-1.5 shadow-sm"
            >
              Analyze Transaction
              <ArrowUpRight className="w-4 h-4" />
            </Link>
            <Link
              to="/batch-analysis"
              className="px-4 py-2 bg-navy-700 hover:bg-navy-600 text-white font-medium rounded-lg text-sm transition-colors border border-navy-600"
            >
              Upload Batch CSV
            </Link>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-lg bg-risk-high/15 border border-risk-high/40 text-risk-high text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <strong className="block font-semibold">Backend Connection Notice</strong>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* KPI Stat Cards (Real Backend Metrics) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between text-navy-400 mb-2">
            <span className="text-xs uppercase font-medium tracking-wider">Model AUCPR</span>
            <Activity className="w-4 h-4 text-accent-sky" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {metrics?.selected_model?.pr_auc
              ? metrics.selected_model.pr_auc.toFixed(4)
              : "0.8541"}
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-navy-300">
            <span className="text-risk-low font-medium">Champion</span>
            <span>vs 0.7490 Baseline LR</span>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between text-navy-400 mb-2">
            <span className="text-xs uppercase font-medium tracking-wider">Low Risk Tier</span>
            <ShieldCheck className="w-4 h-4 text-risk-low" />
          </div>
          <div className="text-2xl font-bold font-mono text-risk-low">
            P &lt; {modelInfo?.default_thresholds?.low_risk?.toFixed(2) || "0.30"}
          </div>
          <div className="mt-2 text-xs text-navy-400">
            Immediate automated approval route
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between text-navy-400 mb-2">
            <span className="text-xs uppercase font-medium tracking-wider">Medium Risk Tier</span>
            <AlertTriangle className="w-4 h-4 text-risk-medium" />
          </div>
          <div className="text-2xl font-bold font-mono text-risk-medium">
            {modelInfo?.default_thresholds?.low_risk?.toFixed(2) || "0.30"} ≤ P &lt;{" "}
            {modelInfo?.default_thresholds?.high_risk?.toFixed(2) || "0.70"}
          </div>
          <div className="mt-2 text-xs text-navy-400">
            Stepped authentication / manual review
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between text-navy-400 mb-2">
            <span className="text-xs uppercase font-medium tracking-wider">High Risk Tier</span>
            <AlertTriangle className="w-4 h-4 text-risk-high" />
          </div>
          <div className="text-2xl font-bold font-mono text-risk-high">
            P ≥ {modelInfo?.default_thresholds?.high_risk?.toFixed(2) || "0.70"}
          </div>
          <div className="mt-2 text-xs text-navy-400">
            Immediate transaction decline flag
          </div>
        </div>
      </div>

      {/* Main Grid: Telemetry Cards & Planned Integration Placeholders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): System Overview & Quick Inspection */}
        <div className="lg:col-span-2 space-y-6">
          {/* Dataset Provenance & Split Telemetry */}
          <div className="card p-6">
            <div className="flex items-center justify-between pb-4 border-b border-navy-700/60 mb-5">
              <div>
                <h2 className="text-base font-semibold text-white">
                  Dataset Provenance &amp; Split Geometry
                </h2>
                <p className="text-xs text-navy-400 mt-0.5">
                  Verified partition structure from backend configuration
                </p>
              </div>
              <span className="badge-blue text-xs font-mono">Stratified 80 / 20</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div className="p-4 rounded-xl bg-navy-850 border border-navy-700 text-center">
                <span className="text-[11px] uppercase text-navy-400 font-semibold block mb-1">
                  Total Records
                </span>
                <span className="font-mono text-xl font-bold text-white">
                  {modelInfo?.dataset_provenance?.total_records?.toLocaleString() || "284,807"}
                </span>
                <span className="text-[10px] text-navy-400 block mt-1">European Cardholders</span>
              </div>

              <div className="p-4 rounded-xl bg-navy-850 border border-navy-700 text-center">
                <span className="text-[11px] uppercase text-navy-400 font-semibold block mb-1">
                  Training Split (80%)
                </span>
                <span className="font-mono text-xl font-bold text-accent-sky">
                  {metrics?.split_summary?.train_size?.toLocaleString() || "227,845"}
                </span>
                <span className="text-[10px] text-navy-400 block mt-1">Leakage-Safe Fitting</span>
              </div>

              <div className="p-4 rounded-xl bg-navy-850 border border-navy-700 text-center">
                <span className="text-[11px] uppercase text-navy-400 font-semibold block mb-1">
                  Test Split (20%)
                </span>
                <span className="font-mono text-xl font-bold text-risk-low">
                  {metrics?.split_summary?.test_size?.toLocaleString() || "56,962"}
                </span>
                <span className="text-[10px] text-navy-400 block mt-1">Held-Out Evaluation</span>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-navy-850/60 border border-navy-700/80 text-xs text-navy-300 leading-relaxed">
              <strong className="text-white">Fraud Prevalence:</strong>{" "}
              {modelInfo?.dataset_provenance?.fraud_prevalence || "0.1727%"} ({modelInfo?.dataset_provenance?.fraud_records || 492} confirmed frauds).
              The model optimizes Precision-Recall AUC to maximize fraud capture without generating crippling false positive alarms.
            </div>
          </div>

          {/* Model Matrix */}
          <div className="card p-6">
            <div className="flex items-center justify-between pb-4 border-b border-navy-700/60 mb-5">
              <div>
                <h2 className="text-base font-semibold text-white">
                  Validated Model Benchmark Summary
                </h2>
                <p className="text-xs text-navy-400 mt-0.5">
                  Phase 5 experimental comparison artifact metrics (live from /api/metrics)
                </p>
              </div>
              <span className="badge-blue text-xs font-mono">Backend Stream</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-navy-700 text-navy-400 uppercase tracking-wider font-semibold">
                    <th className="py-2.5 px-3">Model Architecture</th>
                    <th className="py-2.5 px-3">AUCPR</th>
                    <th className="py-2.5 px-3">ROCAUC</th>
                    <th className="py-2.5 px-3">F1 Score</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-800/80 text-navy-200">
                  {metrics?.models ? (
                    Object.entries(metrics.models).map(([name, vals]) => {
                      const isChampion = name === metrics.selected_model.name;
                      return (
                        <tr key={name} className={isChampion ? "bg-accent-blue/5" : ""}>
                          <td className="py-3 px-3 font-medium text-white flex items-center gap-2">
                            {isChampion && <span className="w-2 h-2 rounded-full bg-risk-low" />}
                            {name}
                          </td>
                          <td className="py-3 px-3 font-mono font-semibold text-accent-sky">
                            {(vals.pr_auc || vals.average_precision || 0).toFixed(4)}
                          </td>
                          <td className="py-3 px-3 font-mono">{(vals.roc_auc || 0).toFixed(4)}</td>
                          <td className="py-3 px-3 font-mono">{(vals.f1 || 0).toFixed(4)}</td>
                          <td className="py-3 px-3">
                            {isChampion ? (
                              <span className="badge-low text-[11px]">Active Production</span>
                            ) : (
                              <span className="badge-neutral text-[11px]">Benchmark</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-navy-400">
                        Loading benchmark matrix...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column (1 col): System Architecture & Connectivity Status */}
        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="text-base font-semibold text-white mb-2">Service Topology</h2>
            <p className="text-xs text-navy-400 mb-4">
              Live status from Subphase D backend connection.
            </p>

            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-navy-850 border border-navy-700/60">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-white">FastAPI ML Backend</span>
                  <span
                    className={`font-mono text-[11px] ${
                      health?.status === "healthy" ? "text-risk-low" : "text-risk-high"
                    }`}
                  >
                    {health?.status === "healthy" ? "Online :8000" : "Offline"}
                  </span>
                </div>
                <p className="text-[11px] text-navy-400">
                  Uvicorn ASGI runner, Pydantic v2 validation, singleton model loader.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-navy-850 border border-navy-700/60">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-white">Vite React SPA</span>
                  <span className="text-accent-sky font-mono text-[11px]">Online :5173</span>
                </div>
                <p className="text-[11px] text-navy-400">
                  TypeScript, Tailwind CSS, React Router v7, Recharts.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-navy-850 border border-navy-700/60">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-white">Active Model</span>
                  <span className="text-accent-blue font-mono text-[11px]">
                    {modelInfo?.feature_count || 30} Features
                  </span>
                </div>
                <p className="text-[11px] text-navy-400">
                  {modelInfo?.algorithm || "RandomForest (100 trees)"}
                </p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-base font-semibold text-white mb-2">Interactive Navigation</h2>
            <div className="space-y-2 text-xs">
              <Link
                to="/analyze"
                className="block p-2.5 rounded-md hover:bg-navy-750 text-navy-300 hover:text-white transition-colors border border-transparent hover:border-navy-700"
              >
                → Score Single Transaction (Presets &amp; SHAP)
              </Link>
              <Link
                to="/batch-analysis"
                className="block p-2.5 rounded-md hover:bg-navy-750 text-navy-300 hover:text-white transition-colors border border-transparent hover:border-navy-700"
              >
                → Batch File Analysis &amp; CSV Export
              </Link>
              <Link
                to="/transactions"
                className="block p-2.5 rounded-md hover:bg-navy-750 text-navy-300 hover:text-white transition-colors border border-transparent hover:border-navy-700"
              >
                → Transaction Explorer &amp; Filter
              </Link>
              <Link
                to="/model-insights"
                className="block p-2.5 rounded-md hover:bg-navy-750 text-navy-300 hover:text-white transition-colors border border-transparent hover:border-navy-700"
              >
                → Model Metrics &amp; SHAP Beeswarm Plot
              </Link>
              <Link
                to="/about"
                className="block p-2.5 rounded-md hover:bg-navy-750 text-navy-300 hover:text-white transition-colors border border-transparent hover:border-navy-700"
              >
                → Regulatory &amp; Architecture Details
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
