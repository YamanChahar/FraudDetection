import React from "react";
import {
  LineChart,
  Award,
  Zap,
  Layers,
  HelpCircle,
  BarChart3,
} from "lucide-react";

export const ModelInsights: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="card p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="badge-blue text-xs font-medium">Evaluation &amp; Governance</span>
              <span className="badge-neutral text-xs font-mono">GET /api/v1/model/*</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Model Performance &amp; SHAP Insights
            </h1>
            <p className="text-navy-300 text-sm mt-1 max-w-2xl">
              Examine model selection metrics, Precision-Recall curves across decision
              thresholds, and global SHAP feature importance explaining tree decisions.
            </p>
          </div>
          <div className="shrink-0 flex items-center gap-2">
            <span className="badge-medium text-xs font-mono px-3 py-1.5">
              Subphase D Integration Point
            </span>
          </div>
        </div>
      </div>

      {/* Model Benchmark Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-5 border-l-4 border-l-accent-sky">
          <div className="flex items-center justify-between text-navy-400 mb-2">
            <span className="text-xs uppercase font-medium tracking-wider">Champion Architecture</span>
            <Award className="w-4 h-4 text-accent-sky" />
          </div>
          <div className="text-xl font-bold text-white">Random Forest</div>
          <p className="text-xs text-navy-400 mt-1">
            Ensemble of 100 trees with balanced subsample weights
          </p>
        </div>

        <div className="card p-5 border-l-4 border-l-risk-low">
          <div className="flex items-center justify-between text-navy-400 mb-2">
            <span className="text-xs uppercase font-medium tracking-wider">Primary Selection Metric</span>
            <Zap className="w-4 h-4 text-risk-low" />
          </div>
          <div className="text-xl font-bold font-mono text-white">0.8541 AUCPR</div>
          <p className="text-xs text-navy-400 mt-1">
            Area under the Precision-Recall curve on unseen test split
          </p>
        </div>

        <div className="card p-5 border-l-4 border-l-accent-blue">
          <div className="flex items-center justify-between text-navy-400 mb-2">
            <span className="text-xs uppercase font-medium tracking-wider">Explainability Engine</span>
            <Layers className="w-4 h-4 text-accent-blue" />
          </div>
          <div className="text-xl font-bold text-white">SHAP TreeExplainer</div>
          <p className="text-xs text-navy-400 mt-1">
            Game-theoretic feature attributions with precomputed background summary
          </p>
        </div>
      </div>

      {/* Visual Analytics Placeholders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Precision-Recall Curve Shell */}
        <div className="card p-6">
          <div className="flex items-center justify-between pb-4 border-b border-navy-700/60 mb-5">
            <div className="flex items-center gap-2">
              <LineChart className="w-5 h-5 text-accent-sky" />
              <h2 className="text-base font-semibold text-white">
                Precision-Recall &amp; ROC Curves
              </h2>
            </div>
            <span className="text-xs text-navy-400 font-mono">Curve Telemetry</span>
          </div>

          <div className="h-64 rounded-lg border border-dashed border-navy-700/80 bg-navy-850/50 flex flex-col items-center justify-center p-6 text-center">
            <LineChart className="w-8 h-8 text-navy-600 mb-2" />
            <p className="text-sm font-medium text-navy-300">Curve Visualizer Container</p>
            <p className="text-xs text-navy-500 mt-1 max-w-sm">
              In Subphase D, this container renders interactive PR and ROC curves comparing
              Random Forest, XGBoost, and Logistic Regression with threshold scrubbers.
            </p>
          </div>
        </div>

        {/* Global SHAP Feature Importance Shell */}
        <div className="card p-6">
          <div className="flex items-center justify-between pb-4 border-b border-navy-700/60 mb-5">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-accent-sky" />
              <h2 className="text-base font-semibold text-white">
                Global SHAP Feature Importance
              </h2>
            </div>
            <span className="text-xs text-navy-400 font-mono">Mean |SHAP|</span>
          </div>

          <div className="h-64 rounded-lg border border-dashed border-navy-700/80 bg-navy-850/50 flex flex-col items-center justify-center p-6 text-center">
            <HelpCircle className="w-8 h-8 text-navy-600 mb-2" />
            <p className="text-sm font-medium text-navy-300">Global Attribution Chart Container</p>
            <p className="text-xs text-navy-500 mt-1 max-w-sm">
              In Subphase D, this container binds to{" "}
              <code className="text-accent-blue font-mono">GET /api/v1/explanations/global</code>{" "}
              to render horizontal bars of the top fraud predictors (V17, V14, V12, V10, V4).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
