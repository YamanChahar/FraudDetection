import React from "react";
import {
  BookOpen,
  Shield,
  Layers,
  Cpu,
  AlertTriangle,
  FileCode,
} from "lucide-react";

export const About: React.FC = () => {
  return (
    <div className="space-y-6 max-w-5xl">
      {/* Top Banner */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="badge-blue text-xs font-medium">Architecture &amp; Governance</span>
          <span className="badge-neutral text-xs font-mono">Documentation</span>
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          System Overview &amp; Technical Methodology
        </h1>
        <p className="text-navy-300 text-sm mt-1">
          Engineering principles, dataset characteristics, and risk tier governance
          governing the Fraud Detection &amp; Risk Assessment System.
        </p>
      </div>

      {/* Grid of Sections */}
      <div className="space-y-6">
        {/* Section 1: Problem Formulation & Dataset */}
        <div className="card p-6">
          <div className="flex items-center gap-2.5 pb-3 border-b border-navy-700/60 mb-4">
            <BookOpen className="w-5 h-5 text-accent-sky" />
            <h2 className="text-base font-semibold text-white">Dataset Provenance &amp; Preprocessing</h2>
          </div>
          <div className="space-y-3 text-xs text-navy-300 leading-relaxed">
            <p>
              The system operates on the canonical <strong>ULB Credit Card Fraud dataset</strong>,
              consisting of 284,807 transactions made by European cardholders over two days in September 2013.
              The dataset exhibits extreme positive class imbalance with only 492 confirmed fraudulent events
              (0.172% fraud incidence rate).
            </p>
            <p>
              Due to bank confidentiality, features <strong>V1 through V28</strong> are the result of a
              Principal Component Analysis (PCA) transformation. The only untransformed features are{" "}
              <strong>Time</strong> (seconds elapsed since the first transaction in the dataset) and{" "}
              <strong>Amount</strong> (transaction monetary value).
            </p>
            <div className="p-3.5 rounded-lg bg-navy-850 border border-navy-700/60 text-navy-300">
              <strong className="text-white block mb-1">Leakage-Safe Preprocessing Pipeline:</strong>
              A scikit-learn pipeline applies <code className="text-accent-blue font-mono">RobustScaler</code> to{" "}
              <code className="text-navy-200 font-mono">Time</code> and <code className="text-navy-200 font-mono">Amount</code>,
              fitted strictly on the training split (80%) before evaluation on the unseen test split (20%).
              All 30 canonical features are maintained in exact deterministic order.
            </div>
          </div>
        </div>

        {/* Section 2: 3-Tier Risk Framework */}
        <div className="card p-6">
          <div className="flex items-center gap-2.5 pb-3 border-b border-navy-700/60 mb-4">
            <Shield className="w-5 h-5 text-accent-sky" />
            <h2 className="text-base font-semibold text-white">Three-Tier Operational Risk Policy</h2>
          </div>
          <p className="text-xs text-navy-300 mb-4">
            Rather than relying on a simplistic 0.5 binary cutoff (which yields unacceptable false negatives
            under extreme imbalance), our system employs a calibrated 3-tier risk engine:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-navy-850 border border-risk-low/30">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-risk-low"></span>
                <span className="text-xs font-bold text-risk-low uppercase">Low Risk</span>
              </div>
              <div className="font-mono text-sm font-semibold text-white mb-1.5">P &lt; 0.30</div>
              <p className="text-xs text-navy-300">
                Automated friction-free approval. Minimal transaction friction for legitimate cardholders.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-navy-850 border border-risk-medium/30">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-risk-medium"></span>
                <span className="text-xs font-bold text-risk-medium uppercase">Medium Risk</span>
              </div>
              <div className="font-mono text-sm font-semibold text-white mb-1.5">0.30 ≤ P &lt; 0.70</div>
              <p className="text-xs text-navy-300">
                Flagged for stepped verification (SMS/app OTP, biometric challenge) or analyst triage.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-navy-850 border border-risk-high/30">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-risk-high"></span>
                <span className="text-xs font-bold text-risk-high uppercase">High Risk</span>
              </div>
              <div className="font-mono text-sm font-semibold text-white mb-1.5">P ≥ 0.70</div>
              <p className="text-xs text-navy-300">
                Immediate automated decline and card suspension. Protects against catastrophic drain.
              </p>
            </div>
          </div>
        </div>

        {/* Section 3: Technology Architecture */}
        <div className="card p-6">
          <div className="flex items-center gap-2.5 pb-3 border-b border-navy-700/60 mb-4">
            <Cpu className="w-5 h-5 text-accent-sky" />
            <h2 className="text-base font-semibold text-white">Full-Stack Decoupled Architecture</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-lg bg-navy-850 border border-navy-700/60">
              <div className="flex items-center gap-2 font-semibold text-white mb-2">
                <FileCode className="w-4 h-4 text-accent-blue" />
                Backend Service (FastAPI)
              </div>
              <ul className="space-y-1.5 text-navy-300">
                <li>• High-performance ASGI service powered by Uvicorn</li>
                <li>• Strict Pydantic v2 input schemas with shape validation</li>
                <li>• Singleton model loader for sub-millisecond inference</li>
                <li>• Precomputed SHAP background summaries for rapid attribution</li>
                <li>• Comprehensive test coverage (75 passing unit/integration tests)</li>
              </ul>
            </div>

            <div className="p-4 rounded-lg bg-navy-850 border border-navy-700/60">
              <div className="flex items-center gap-2 font-semibold text-white mb-2">
                <Layers className="w-4 h-4 text-accent-sky" />
                Frontend SPA (Vite + React)
              </div>
              <ul className="space-y-1.5 text-navy-300">
                <li>• Modern TypeScript with React 19 and Vite HMR</li>
                <li>• Tailwind CSS fintech dark visual design system</li>
                <li>• Declarative React Router v7 layout and navigation</li>
                <li>• Accessible semantic controls and responsive mobile drawer</li>
                <li>• Ready for direct API client binding in Subphase D</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Section 4: Regulatory & Compliance Governance Notice */}
        <div className="card p-6 border-l-4 border-l-risk-medium bg-navy-850/60">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-risk-medium shrink-0 mt-0.5" />
            <div className="space-y-2 text-xs text-navy-300">
              <h3 className="font-semibold text-white text-sm">
                Regulatory Compliance &amp; Model Governance Notice
              </h3>
              <p>
                This application and its underlying machine learning models are designed as an
                engineering research and risk analytics demonstration. The system adheres to model risk
                management principles (SR 11-7 / OCC 2011-12) by separating training from testing,
                validating pipeline invariance, and providing explainable feature attributions via SHAP.
              </p>
              <p>
                In a production banking environment, models must additionally undergo periodic concept
                drift monitoring, fair lending compliance audits (ECOA / Reg B), and adversary stress testing.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
