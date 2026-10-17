import React from "react";
import {
  Sliders,
  ShieldAlert,
  Cpu,
  BarChart2,
  AlertCircle,
  HelpCircle,
} from "lucide-react";

export const SingleAnalysis: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="card p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="badge-blue text-xs font-medium">Scoring Engine</span>
              <span className="badge-neutral text-xs font-mono">POST /api/v1/predict/single</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Single Transaction Risk Scoring
            </h1>
            <p className="text-navy-300 text-sm mt-1 max-w-2xl">
              Inspect an individual transaction by inputting or loading canonical features
              (Time, Amount, V1–V28). The backend Random Forest model scores fraud probability,
              applies calibrated thresholds, and generates local SHAP waterfall attribution.
            </p>
          </div>
          <div className="shrink-0 flex items-center gap-2">
            <span className="badge-medium text-xs font-mono px-3 py-1.5">
              Subphase D Integration Point
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Input Parameters Form Container */}
        <div className="lg:col-span-7 space-y-6">
          <div className="card p-6">
            <div className="flex items-center justify-between pb-4 border-b border-navy-700/60 mb-5">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-accent-sky" />
                <h2 className="text-base font-semibold text-white">
                  Transaction Features (30 Variables)
                </h2>
              </div>
              <span className="text-xs text-navy-400">
                Preset Loader &amp; Manual Entry
              </span>
            </div>

            {/* Placeholder Form Layout */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-navy-300 mb-1.5">
                    Transaction Amount ($)
                  </label>
                  <input
                    type="number"
                    disabled
                    placeholder="e.g. 149.99"
                    className="w-full bg-navy-850 border border-navy-700 rounded-lg px-3.5 py-2 text-sm text-navy-400 cursor-not-allowed"
                  />
                  <p className="text-[11px] text-navy-500 mt-1">
                    Normalized via RobustScaler in backend pipeline
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-navy-300 mb-1.5">
                    Elapsed Seconds (Time)
                  </label>
                  <input
                    type="number"
                    disabled
                    placeholder="e.g. 406.0"
                    className="w-full bg-navy-850 border border-navy-700 rounded-lg px-3.5 py-2 text-sm text-navy-400 cursor-not-allowed"
                  />
                  <p className="text-[11px] text-navy-500 mt-1">
                    Seconds elapsed since dataset epoch
                  </p>
                </div>
              </div>

              {/* PCA Features Grid Preview */}
              <div className="pt-2">
                <label className="block text-xs font-medium text-navy-300 mb-2 flex items-center justify-between">
                  <span>PCA Features (V1 – V28)</span>
                  <span className="text-[11px] text-navy-500">28 Principal Components</span>
                </label>
                <div className="p-4 rounded-lg bg-navy-850/80 border border-navy-700/60 text-center">
                  <Cpu className="w-8 h-8 text-navy-500 mx-auto mb-2" />
                  <p className="text-xs font-medium text-navy-300">
                    Feature Input &amp; Preset Selector Shell
                  </p>
                  <p className="text-[11px] text-navy-500 mt-1 max-w-sm mx-auto">
                    In Subphase D, this module allows one-click loading of verified test cases
                    (Legitimate sample, Clear fraud sample, Borderline suspect) and full manual entry.
                  </p>
                </div>
              </div>

              <div className="pt-3 flex items-center gap-3">
                <button
                  type="button"
                  disabled
                  className="px-5 py-2.5 bg-navy-700 text-navy-400 rounded-lg text-sm font-semibold cursor-not-allowed flex items-center gap-2"
                >
                  <ShieldAlert className="w-4 h-4" />
                  Execute Risk Analysis
                </button>
                <span className="text-xs text-navy-400 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 text-accent-sky" />
                  Form active in Subphase D
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Decision & SHAP Attribution Output Shell */}
        <div className="lg:col-span-5 space-y-6">
          <div className="card p-6">
            <div className="flex items-center justify-between pb-4 border-b border-navy-700/60 mb-5">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-accent-sky" />
                <h2 className="text-base font-semibold text-white">Risk Assessment Verdict</h2>
              </div>
              <span className="badge-neutral text-xs font-mono">Result Container</span>
            </div>

            <div className="h-44 rounded-lg border border-dashed border-navy-700/80 bg-navy-850/50 flex flex-col items-center justify-center p-6 text-center">
              <ShieldAlert className="w-8 h-8 text-navy-600 mb-2" />
              <p className="text-sm font-medium text-navy-300">Awaiting Transaction Input</p>
              <p className="text-xs text-navy-500 mt-1 max-w-xs">
                Score results, 3-tier risk badge (Low, Medium, High), recommended action,
                and confidence interval will appear here after API submission.
              </p>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between pb-4 border-b border-navy-700/60 mb-5">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-accent-sky" />
                <h2 className="text-base font-semibold text-white">SHAP Decision Attribution</h2>
              </div>
              <span className="text-xs px-2 py-0.5 bg-navy-900 border border-navy-700 rounded text-navy-400 font-mono">
                TreeExplainer
              </span>
            </div>

            <div className="h-44 rounded-lg border border-dashed border-navy-700/80 bg-navy-850/50 flex flex-col items-center justify-center p-6 text-center">
              <p className="text-sm font-medium text-navy-300">Feature Attribution Container</p>
              <p className="text-xs text-navy-500 mt-1 max-w-xs">
                In Subphase D, local SHAP waterfall values will render here to explain
                the top drivers pushing the score toward fraud or legitimate.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
