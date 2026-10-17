import React from "react";
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  AlertCircle,
  FileCheck,
  Filter,
} from "lucide-react";

export const BatchAnalysis: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="card p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="badge-blue text-xs font-medium">Batch Processing</span>
              <span className="badge-neutral text-xs font-mono">POST /api/v1/predict/batch</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Batch CSV Transaction Scoring
            </h1>
            <p className="text-navy-300 text-sm mt-1 max-w-2xl">
              Upload multi-transaction CSV files for vector scoring. The backend batches
              inference through the trained pipeline, assigns risk tiers, and generates
              downloadable audit records with decision summaries.
            </p>
          </div>
          <div className="shrink-0 flex items-center gap-2">
            <span className="badge-medium text-xs font-mono px-3 py-1.5">
              Subphase D Integration Point
            </span>
          </div>
        </div>
      </div>

      {/* File Upload Zone Shell */}
      <div className="card p-8">
        <div className="flex items-center justify-between pb-4 border-b border-navy-700/60 mb-6">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-accent-sky" />
            <h2 className="text-base font-semibold text-white">Upload Transaction Batch (CSV)</h2>
          </div>
          <span className="text-xs text-navy-400">Required: Time, Amount, V1–V28 columns</span>
        </div>

        <div className="border-2 border-dashed border-navy-700 rounded-xl p-10 flex flex-col items-center justify-center text-center bg-navy-850/40 hover:bg-navy-850/70 transition-colors">
          <div className="w-14 h-14 rounded-full bg-navy-800 flex items-center justify-center mb-4 text-accent-sky">
            <UploadCloud className="w-7 h-7" />
          </div>
          <p className="text-sm font-semibold text-white">Drag and drop CSV transaction file here</p>
          <p className="text-xs text-navy-400 mt-1 max-w-sm">
            Or browse from your filesystem. Supports canonical 30-feature datasets or sample extracts.
          </p>
          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              disabled
              className="px-4 py-2 bg-navy-700 text-navy-400 rounded-lg text-xs font-semibold cursor-not-allowed border border-navy-600"
            >
              Select File
            </button>
            <span className="text-[11px] text-navy-500 font-mono">Max 100,000 rows / batch</span>
          </div>
        </div>
      </div>

      {/* Results Container Shell */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-navy-700/60 mb-5 gap-3">
          <div className="flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-accent-sky" />
            <h2 className="text-base font-semibold text-white">Batch Evaluation Output</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled
              className="px-3 py-1.5 bg-navy-800 text-navy-400 rounded text-xs font-medium cursor-not-allowed flex items-center gap-1.5 border border-navy-700"
            >
              <Filter className="w-3.5 h-3.5" />
              Filter Results
            </button>
            <button
              disabled
              className="px-3 py-1.5 bg-navy-800 text-navy-400 rounded text-xs font-medium cursor-not-allowed flex items-center gap-1.5 border border-navy-700"
            >
              <Download className="w-3.5 h-3.5" />
              Export Scored CSV
            </button>
          </div>
        </div>

        <div className="h-48 rounded-lg border border-dashed border-navy-700/80 bg-navy-850/50 flex flex-col items-center justify-center p-6 text-center">
          <AlertCircle className="w-8 h-8 text-navy-600 mb-2" />
          <p className="text-sm font-medium text-navy-300">No Batch File Loaded</p>
          <p className="text-xs text-navy-500 mt-1 max-w-sm">
            In Subphase D, uploading a batch will stream progress, display class volume tallies,
            and present an interactive table with per-record risk probabilities.
          </p>
        </div>
      </div>
    </div>
  );
};
