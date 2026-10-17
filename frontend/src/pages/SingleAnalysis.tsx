import React, { useState } from "react";
import {
  Sliders,
  ShieldAlert,
  BarChart2,
  AlertCircle,
  HelpCircle,
  RefreshCw,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { api, ApiError } from "../services/api";
import { TRANSACTION_PRESETS } from "../data/presets";
import type {
  SinglePredictionResponse,
  LocalExplanationResponse,
} from "../types/api";

const PCA_FEATURE_NAMES = Array.from({ length: 28 }, (_, i) => `V${i + 1}`);

export const SingleAnalysis: React.FC = () => {
  // Initial state loaded with preset 0 (Legitimate sample)
  const [selectedPresetId, setSelectedPresetId] = useState<string>("legit-sample-1");
  const [features, setFeatures] = useState<Record<string, number>>(
    TRANSACTION_PRESETS[0].features
  );

  // Policy threshold overrides (defaults: 0.30 and 0.70)
  const [lowThreshold, setLowThreshold] = useState<number>(0.30);
  const [highThreshold, setHighThreshold] = useState<number>(0.70);
  const [showAdvancedPca, setShowAdvancedPca] = useState<boolean>(false);

  // Submission & Response states
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<SinglePredictionResponse | null>(null);
  const [explanation, setExplanation] = useState<LocalExplanationResponse | null>(null);

  // Handle Preset Switching
  const handlePresetSelect = (presetId: string) => {
    setSelectedPresetId(presetId);
    const preset = TRANSACTION_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setFeatures({ ...preset.features });
      setError(null);
      setPrediction(null);
      setExplanation(null);
    }
  };

  // Handle field change
  const handleFeatureChange = (featureName: string, value: string) => {
    const num = parseFloat(value);
    setFeatures((prev) => ({
      ...prev,
      [featureName]: isNaN(num) ? 0 : num,
    }));
  };

  // Submit scoring to backend
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // 1. Call single prediction endpoint
      const predRes = await api.predictSingle(features, {
        low_threshold: lowThreshold,
        high_threshold: highThreshold,
      });
      setPrediction(predRes);

      // 2. Call local SHAP explanation endpoint
      try {
        const expRes = await api.explainLocal(features, 5);
        setExplanation(expRes);
      } catch (expErr: any) {
        console.warn("Local SHAP explanation warning:", expErr);
        // Explanation failure should not block core prediction display
      }
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError(err?.message || "Failed to score transaction. Backend service unreachable.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Determine badge styling by risk category
  const getRiskBadge = (category: string) => {
    switch (category) {
      case "High Risk":
        return <span className="badge-high text-xs">{category}</span>;
      case "Medium Risk":
        return <span className="badge-medium text-xs">{category}</span>;
      default:
        return <span className="badge-low text-xs">{category}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="card p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="badge-blue text-xs font-medium">Scoring Engine</span>
              <span className="badge-neutral text-xs font-mono">POST /api/predict</span>
              <span className="badge-neutral text-xs font-mono">POST /api/explanations/local</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Single Transaction Risk Scoring
            </h1>
            <p className="text-navy-300 text-sm mt-1 max-w-2xl">
              Inspect an individual transaction by choosing verified ULB presets or entering
              canonical features. The Random Forest model outputs probability, applies
              calibrated policy thresholds, and computes SHAP decision drivers.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            <span className="badge-low text-xs font-mono px-3 py-1.5 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-risk-low animate-pulse" />
              Live Endpoint Connected
            </span>
          </div>
        </div>
      </div>

      {/* Preset Selector Bar */}
      <div className="card p-4">
        <div className="text-xs font-semibold text-navy-400 uppercase tracking-wider mb-2.5">
          Select Verified Evaluation Preset
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {TRANSACTION_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handlePresetSelect(preset.id)}
              className={`p-3 rounded-lg text-left transition-all border ${
                selectedPresetId === preset.id
                  ? "bg-accent-blue/15 border-accent-blue text-white shadow-sm"
                  : "bg-navy-850 hover:bg-navy-800 border-navy-700 text-navy-300"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-white">{preset.label}</span>
                <span
                  className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                    preset.expectedClass === "Fraudulent"
                      ? "bg-risk-high/20 text-risk-high"
                      : preset.expectedClass === "Borderline"
                      ? "bg-risk-medium/20 text-risk-medium"
                      : "bg-risk-low/20 text-risk-low"
                  }`}
                >
                  {preset.expectedClass}
                </span>
              </div>
              <p className="text-[11px] text-navy-400 leading-tight">{preset.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-lg bg-risk-high/15 border border-risk-high/40 text-risk-high text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <strong className="block font-semibold">Inference Error</strong>
            <span>{error}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (7 cols): Input Parameters Form */}
          <div className="lg:col-span-7 space-y-6">
            <div className="card p-6">
              <div className="flex items-center justify-between pb-4 border-b border-navy-700/60 mb-5">
                <div className="flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-accent-sky" />
                  <h2 className="text-base font-semibold text-white">
                    Transaction Variables (30 Features)
                  </h2>
                </div>
                <span className="text-xs text-navy-400">Canonical Feature Set</span>
              </div>

              {/* Core Features: Amount and Time */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-navy-300 mb-1.5">
                      Transaction Amount ($)
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={features.Amount ?? 0}
                      onChange={(e) => handleFeatureChange("Amount", e.target.value)}
                      className="w-full bg-navy-850 border border-navy-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-accent-sky font-mono"
                    />
                    <p className="text-[11px] text-navy-400 mt-1">
                      Monetary transaction value in USD
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-navy-300 mb-1.5">
                      Elapsed Time (Seconds)
                    </label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={features.Time ?? 0}
                      onChange={(e) => handleFeatureChange("Time", e.target.value)}
                      className="w-full bg-navy-850 border border-navy-700 rounded-lg px-3.5 py-2 text-sm text-white focus:outline-none focus:border-accent-sky font-mono"
                    />
                    <p className="text-[11px] text-navy-400 mt-1">
                      Seconds elapsed since dataset epoch
                    </p>
                  </div>
                </div>

                {/* Primary Fraud Driver PCA Features (V14, V17, V12, V10) */}
                <div className="pt-2">
                  <div className="text-xs font-semibold text-white mb-2 flex items-center justify-between">
                    <span>Key Discriminative Features (Top SHAP Drivers)</span>
                    <span className="text-[11px] text-accent-sky font-normal">
                      Most influential components
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {["V14", "V17", "V12", "V10"].map((fname) => (
                      <div key={fname} className="p-2.5 rounded-lg bg-navy-850 border border-navy-700">
                        <label className="block text-[11px] font-mono text-navy-300 mb-1">
                          {fname}
                        </label>
                        <input
                          type="number"
                          step="any"
                          value={features[fname] ?? 0}
                          onChange={(e) => handleFeatureChange(fname, e.target.value)}
                          className="w-full bg-navy-900 border border-navy-700 rounded px-2 py-1 text-xs text-white font-mono focus:border-accent-sky focus:outline-none"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Collapsible Remaining PCA Features */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAdvancedPca(!showAdvancedPca)}
                    className="text-xs text-accent-sky hover:text-accent-blue font-medium flex items-center gap-1.5"
                  >
                    <span>{showAdvancedPca ? "Hide" : "Show All"} 24 Additional PCA Features (V1–V28)</span>
                  </button>

                  {showAdvancedPca && (
                    <div className="mt-3 p-4 rounded-lg bg-navy-850/60 border border-navy-700 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5 max-h-64 overflow-y-auto">
                      {PCA_FEATURE_NAMES.filter(
                        (f) => !["V14", "V17", "V12", "V10"].includes(f)
                      ).map((fname) => (
                        <div key={fname}>
                          <label className="block text-[10px] font-mono text-navy-400 mb-0.5">
                            {fname}
                          </label>
                          <input
                            type="number"
                            step="any"
                            value={features[fname] ?? 0}
                            onChange={(e) => handleFeatureChange(fname, e.target.value)}
                            className="w-full bg-navy-900 border border-navy-700 rounded px-1.5 py-1 text-[11px] text-white font-mono focus:border-accent-sky focus:outline-none"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Policy Threshold Adjustment Controls */}
                <div className="pt-3 border-t border-navy-700/60">
                  <div className="text-xs font-semibold text-white mb-2 flex items-center justify-between">
                    <span>Operational Policy Thresholds</span>
                    <span className="text-[11px] text-navy-400">Configurable boundary limits</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] text-navy-300 mb-1">
                        Low Risk Cutoff (T₁ &lt;):{" "}
                        <span className="font-mono text-white">{lowThreshold}</span>
                      </label>
                      <input
                        type="range"
                        min="0.05"
                        max="0.45"
                        step="0.05"
                        value={lowThreshold}
                        onChange={(e) => setLowThreshold(parseFloat(e.target.value))}
                        className="w-full accent-accent-sky"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-navy-300 mb-1">
                        High Risk Cutoff (T₂ ≥):{" "}
                        <span className="font-mono text-white">{highThreshold}</span>
                      </label>
                      <input
                        type="range"
                        min="0.55"
                        max="0.95"
                        step="0.05"
                        value={highThreshold}
                        onChange={(e) => setHighThreshold(parseFloat(e.target.value))}
                        className="w-full accent-risk-high"
                      />
                    </div>
                  </div>
                </div>

                {/* Submit Action Button */}
                <div className="pt-3">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto px-6 py-2.5 bg-accent-blue hover:bg-accent-sky text-navy-950 font-bold rounded-lg text-sm transition-colors flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Scoring via FastAPI...
                      </>
                    ) : (
                      <>
                        <ShieldAlert className="w-4 h-4" />
                        Execute Fraud Assessment
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column (5 cols): Prediction Verdict and SHAP Output */}
          <div className="lg:col-span-5 space-y-6">
            {/* Risk Verdict Card */}
            <div className="card p-6">
              <div className="flex items-center justify-between pb-4 border-b border-navy-700/60 mb-5">
                <div className="flex items-center gap-2">
                  <BarChart2 className="w-5 h-5 text-accent-sky" />
                  <h2 className="text-base font-semibold text-white">Risk Assessment Verdict</h2>
                </div>
                {prediction && getRiskBadge(prediction.risk_category)}
              </div>

              {prediction ? (
                <div className="space-y-4">
                  {/* Big Probability & Score Meter */}
                  <div className="p-4 rounded-xl bg-navy-850 border border-navy-700/80">
                    <div className="flex items-baseline justify-between mb-2">
                      <span className="text-xs uppercase font-medium text-navy-400">
                        Fraud Probability
                      </span>
                      <span className="text-xs font-mono text-navy-400">
                        Score: <strong className="text-white text-sm">{prediction.risk_score}</strong>/100
                      </span>
                    </div>

                    <div className="text-3xl font-bold font-mono text-white mb-2">
                      {(prediction.fraud_probability * 100).toFixed(2)}%
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-navy-900 rounded-full h-2.5 overflow-hidden">
                      <div
                        className={`h-2.5 rounded-full transition-all duration-500 ${
                          prediction.risk_category === "High Risk"
                            ? "bg-risk-high"
                            : prediction.risk_category === "Medium Risk"
                            ? "bg-risk-medium"
                            : "bg-risk-low"
                        }`}
                        style={{ width: `${Math.min(100, Math.max(5, prediction.fraud_probability * 100))}%` }}
                      />
                    </div>
                  </div>

                  {/* Recommendation & Policy Decision */}
                  <div className="p-3.5 rounded-lg bg-navy-850 border border-navy-700">
                    <span className="text-[11px] uppercase font-bold text-navy-400 block mb-1">
                      Operational Action
                    </span>
                    <p className="text-xs font-medium text-white">
                      {prediction.operational_recommendation}
                    </p>
                  </div>

                  {/* Model Metadata footer */}
                  <div className="pt-2 text-[11px] text-navy-400 flex items-center justify-between font-mono">
                    <span>Engine: {prediction.model_name}</span>
                    <span>T₁={prediction.threshold_configuration.low_threshold} / T₂={prediction.threshold_configuration.high_threshold}</span>
                  </div>
                </div>
              ) : (
                <div className="h-44 rounded-lg border border-dashed border-navy-700/80 bg-navy-850/50 flex flex-col items-center justify-center p-6 text-center">
                  <ShieldAlert className="w-8 h-8 text-navy-500 mb-2" />
                  <p className="text-sm font-medium text-navy-300">Ready for Transaction Scoring</p>
                  <p className="text-xs text-navy-400 mt-1 max-w-xs">
                    Choose a preset above or modify features and click "Execute Fraud Assessment"
                    to trigger the live Random Forest pipeline.
                  </p>
                </div>
              )}
            </div>

            {/* Local SHAP Decision Attribution Card */}
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

              {explanation ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-navy-300 pb-2 border-b border-navy-700">
                    <span>Baseline Expectation:</span>
                    <span className="font-mono text-white">{(explanation.base_value * 100).toFixed(2)}%</span>
                  </div>

                  {/* Risk Increasing Drivers */}
                  {explanation.top_risk_increasing.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-risk-high mb-2">
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>Top Risk-Increasing Drivers</span>
                      </div>
                      <div className="space-y-1.5">
                        {explanation.top_risk_increasing.map((driver) => (
                          <div
                            key={driver.feature}
                            className="flex items-center justify-between p-2 rounded bg-navy-850 border border-navy-700 text-xs"
                          >
                            <span className="font-mono font-medium text-white">{driver.feature}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] text-navy-400 font-mono">val={driver.raw_value.toFixed(2)}</span>
                              <span className="font-mono text-risk-high font-semibold">
                                +{(driver.shap_value * 100).toFixed(2)}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Risk Decreasing Drivers */}
                  {explanation.top_risk_decreasing.length > 0 && (
                    <div className="pt-2">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-risk-low mb-2">
                        <TrendingDown className="w-3.5 h-3.5" />
                        <span>Top Risk-Mitigating Drivers</span>
                      </div>
                      <div className="space-y-1.5">
                        {explanation.top_risk_decreasing.map((driver) => (
                          <div
                            key={driver.feature}
                            className="flex items-center justify-between p-2 rounded bg-navy-850 border border-navy-700 text-xs"
                          >
                            <span className="font-mono font-medium text-white">{driver.feature}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] text-navy-400 font-mono">val={driver.raw_value.toFixed(2)}</span>
                              <span className="font-mono text-risk-low font-semibold">
                                {(driver.shap_value * 100).toFixed(2)}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-44 rounded-lg border border-dashed border-navy-700/80 bg-navy-850/50 flex flex-col items-center justify-center p-6 text-center">
                  <p className="text-sm font-medium text-navy-300">Feature Attribution Container</p>
                  <p className="text-xs text-navy-400 mt-1 max-w-xs">
                    Local SHAP attributions will render here after scoring to display the exact
                    features pushing the decision toward or away from fraud.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
