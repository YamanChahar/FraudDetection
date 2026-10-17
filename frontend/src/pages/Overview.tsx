import React from "react";
import {
  Activity,
  ShieldCheck,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
} from "lucide-react";
import { Link } from "react-router-dom";

export const Overview: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Top Banner / Status Overview */}
      <div className="card p-6 bg-gradient-to-r from-navy-800 to-navy-850 border border-navy-700/80">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="badge-blue text-xs font-medium">Subphase C Shell Active</span>
              <span className="badge-low text-xs font-medium">Model: RF Champion</span>
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

      {/* KPI Stat Cards (Structural Layout with Subphase D Connector Indicators) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between text-navy-400 mb-2">
            <span className="text-xs uppercase font-medium tracking-wider">Model AUCPR</span>
            <Activity className="w-4 h-4 text-accent-sky" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">0.8541</div>
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
          <div className="text-2xl font-bold font-mono text-risk-low">P &lt; 0.30</div>
          <div className="mt-2 text-xs text-navy-400">
            Immediate automated approval route
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between text-navy-400 mb-2">
            <span className="text-xs uppercase font-medium tracking-wider">Medium Risk Tier</span>
            <AlertTriangle className="w-4 h-4 text-risk-medium" />
          </div>
          <div className="text-2xl font-bold font-mono text-risk-medium">0.30 ≤ P &lt; 0.70</div>
          <div className="mt-2 text-xs text-navy-400">
            Stepped authentication / manual review
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between text-navy-400 mb-2">
            <span className="text-xs uppercase font-medium tracking-wider">High Risk Tier</span>
            <AlertTriangle className="w-4 h-4 text-risk-high" />
          </div>
          <div className="text-2xl font-bold font-mono text-risk-high">P ≥ 0.70</div>
          <div className="mt-2 text-xs text-navy-400">
            Immediate transaction decline flag
          </div>
        </div>
      </div>

      {/* Main Grid: Telemetry Cards & Planned Integration Placeholders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols): System Overview & Quick Inspection */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <div className="flex items-center justify-between pb-4 border-b border-navy-700/60 mb-5">
              <div>
                <h2 className="text-base font-semibold text-white">
                  Operational Risk Distribution Pipeline
                </h2>
                <p className="text-xs text-navy-400 mt-0.5">
                  Live scoring aggregate visualization powered by backend FastAPI endpoints
                </p>
              </div>
              <span className="text-xs px-2.5 py-1 bg-navy-900 border border-navy-700 rounded text-navy-300 font-mono">
                Connects in Subphase D
              </span>
            </div>

            {/* Visual Placeholder for Distribution Chart */}
            <div className="h-64 rounded-lg border border-dashed border-navy-700/80 bg-navy-850/50 flex flex-col items-center justify-center p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-navy-800 flex items-center justify-center mb-3 text-accent-sky">
                <TrendingUp className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-navy-200">
                Risk Distribution Telemetry Container
              </p>
              <p className="text-xs text-navy-400 mt-1 max-w-md">
                In Subphase D, this component binds to{" "}
                <code className="text-accent-blue font-mono">GET /api/v1/model/summary</code> and batch
                telemetry to stream class volume metrics and decision histograms.
              </p>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between pb-4 border-b border-navy-700/60 mb-5">
              <div>
                <h2 className="text-base font-semibold text-white">
                  Validated Model Benchmark Summary
                </h2>
                <p className="text-xs text-navy-400 mt-0.5">
                  Phase 5 experimental comparison artifact metrics (preserved from verified run)
                </p>
              </div>
              <span className="badge-blue text-xs font-mono">Artifact Verified</span>
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
                  <tr className="bg-accent-blue/5">
                    <td className="py-3 px-3 font-medium text-white flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-risk-low"></span>
                      Random Forest (Champion)
                    </td>
                    <td className="py-3 px-3 font-mono font-semibold text-accent-sky">0.8541</td>
                    <td className="py-3 px-3 font-mono">0.9632</td>
                    <td className="py-3 px-3 font-mono">0.8497</td>
                    <td className="py-3 px-3">
                      <span className="badge-low text-[11px]">Active Production</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-medium text-navy-300">XGBoost (Classifier)</td>
                    <td className="py-3 px-3 font-mono">0.8415</td>
                    <td className="py-3 px-3 font-mono">0.9780</td>
                    <td className="py-3 px-3 font-mono">0.8384</td>
                    <td className="py-3 px-3">
                      <span className="badge-neutral text-[11px]">Benchmark</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-medium text-navy-300">Logistic Regression (Baseline)</td>
                    <td className="py-3 px-3 font-mono">0.7490</td>
                    <td className="py-3 px-3 font-mono">0.9734</td>
                    <td className="py-3 px-3 font-mono">0.7292</td>
                    <td className="py-3 px-3">
                      <span className="badge-neutral text-[11px]">Baseline</span>
                    </td>
                  </tr>
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
              Micro-architecture decoupling verified in Subphase B &amp; C.
            </p>

            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-navy-850 border border-navy-700/60">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-white">FastAPI ML Backend</span>
                  <span className="text-risk-low font-mono text-[11px]">Port 8000</span>
                </div>
                <p className="text-[11px] text-navy-400">
                  Uvicorn ASGI runner, Pydantic v2 validation, singleton model loader.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-navy-850 border border-navy-700/60">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-white">Vite React SPA</span>
                  <span className="text-accent-sky font-mono text-[11px]">Port 5173</span>
                </div>
                <p className="text-[11px] text-navy-400">
                  TypeScript, Tailwind CSS, React Router v7, Recharts.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-navy-850 border border-navy-700/60">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-white">Decision Artifacts</span>
                  <span className="text-accent-blue font-mono text-[11px]">30 Features</span>
                </div>
                <p className="text-[11px] text-navy-400">
                  RobustScaler + TreeExplainer SHAP + 3-tier risk engine.
                </p>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-base font-semibold text-white mb-2">Quick Navigation</h2>
            <div className="space-y-2 text-xs">
              <Link
                to="/analyze"
                className="block p-2.5 rounded-md hover:bg-navy-750 text-navy-300 hover:text-white transition-colors border border-transparent hover:border-navy-700"
              >
                → Score Single Transaction
              </Link>
              <Link
                to="/batch-analysis"
                className="block p-2.5 rounded-md hover:bg-navy-750 text-navy-300 hover:text-white transition-colors border border-transparent hover:border-navy-700"
              >
                → Batch File Analysis &amp; Export
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
                → Model Metrics &amp; SHAP Summary
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
