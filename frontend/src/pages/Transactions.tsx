import React from "react";
import {
  Search,
  Filter,
  RefreshCw,
  Database,
} from "lucide-react";

export const Transactions: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="card p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="badge-blue text-xs font-medium">Data Exploration</span>
              <span className="badge-neutral text-xs font-mono">GET /api/v1/transactions</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Transaction Explorer &amp; Audit Log
            </h1>
            <p className="text-navy-300 text-sm mt-1 max-w-2xl">
              Inspect representative records from the test evaluation corpus and audit
              inference decisions. Filter by ground truth label, predicted risk tier,
              or transaction amount range.
            </p>
          </div>
          <div className="shrink-0 flex items-center gap-2">
            <span className="badge-medium text-xs font-mono px-3 py-1.5">
              Subphase D Integration Point
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Control Bar Shell */}
      <div className="card p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-navy-400 absolute left-3 top-2.5" />
            <input
              type="text"
              disabled
              placeholder="Search by ID or amount..."
              className="w-full bg-navy-850 border border-navy-700 rounded-lg pl-9 pr-3 py-2 text-xs text-navy-400 cursor-not-allowed"
            />
          </div>

          <div>
            <select
              disabled
              className="w-full bg-navy-850 border border-navy-700 rounded-lg px-3 py-2 text-xs text-navy-400 cursor-not-allowed"
            >
              <option>All Risk Tiers (All)</option>
              <option>Low Risk Only (&lt; 0.30)</option>
              <option>Medium Risk Only (0.30 – 0.70)</option>
              <option>High Risk Only (≥ 0.70)</option>
            </select>
          </div>

          <div>
            <select
              disabled
              className="w-full bg-navy-850 border border-navy-700 rounded-lg px-3 py-2 text-xs text-navy-400 cursor-not-allowed"
            >
              <option>All Labels (Legit &amp; Fraud)</option>
              <option>Confirmed Fraud (Class 1)</option>
              <option>Confirmed Legitimate (Class 0)</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled
              className="flex-1 py-2 px-3 bg-navy-800 border border-navy-700 text-navy-400 rounded-lg text-xs font-medium cursor-not-allowed flex items-center justify-center gap-1.5"
            >
              <Filter className="w-3.5 h-3.5" />
              Apply
            </button>
            <button
              disabled
              className="p-2 bg-navy-800 border border-navy-700 text-navy-400 rounded-lg cursor-not-allowed"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Transaction Table Container Shell */}
      <div className="card p-6">
        <div className="flex items-center justify-between pb-4 border-b border-navy-700/60 mb-5">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-accent-sky" />
            <h2 className="text-base font-semibold text-white">Records Table</h2>
          </div>
          <span className="text-xs text-navy-400 font-mono">
            Paginated (50 records / page)
          </span>
        </div>

        <div className="h-64 rounded-lg border border-dashed border-navy-700/80 bg-navy-850/50 flex flex-col items-center justify-center p-6 text-center">
          <Database className="w-8 h-8 text-navy-600 mb-2" />
          <p className="text-sm font-medium text-navy-300">Transaction Feed Inactive</p>
          <p className="text-xs text-navy-500 mt-1 max-w-md">
            In Subphase D, this table connects to the backend transaction endpoints to stream
            paginated records, allow clicking into single-transaction scoring, and inspection
            of feature values.
          </p>
        </div>
      </div>
    </div>
  );
};
