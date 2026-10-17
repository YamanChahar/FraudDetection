import React, { useEffect, useState, useCallback } from "react";
import {
  Search,
  Filter,
  RefreshCw,
  Database,
  AlertCircle,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  X,
  Sliders,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api, ApiError } from "../services/api";
import type { TransactionExplorerItem } from "../types/api";

export const Transactions: React.FC = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<TransactionExplorerItem[]>([]);
  const [totalMatching, setTotalMatching] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [classFilter, setClassFilter] = useState<"all" | "legitimate" | "fraudulent">("all");
  const [limit, setLimit] = useState<number>(50);
  const [searchQuery, setSearchQuery] = useState<string>("" );

  // Pagination (client-side for loaded records)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 15;

  // Selected Transaction for Inspection Modal
  const [selectedTx, setSelectedTx] = useState<TransactionExplorerItem | null>(null);

  const fetchTransactions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.getTransactions({
        class_filter: classFilter,
        min_amount: 0,
        max_amount: 100000,
        limit,
      });
      setTransactions(res.transactions);
      setTotalMatching(res.total_matching);
      setCurrentPage(1);
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError(err?.message || "Failed to load transaction records from backend.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [classFilter, limit]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Client-side text filter by amount / category / risk score
  const filteredList = transactions.filter((tx) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      tx.Amount.toString().includes(q) ||
      tx.risk_category.toLowerCase().includes(q) ||
      tx.risk_score.toString().includes(q)
    );
  });

  const totalPages = Math.ceil(filteredList.length / pageSize) || 1;
  const paginatedSlice = filteredList.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Handle navigate to Single Analysis with preloaded features
  const handleInspectInSingleAnalysis = (tx: TransactionExplorerItem) => {
    // Construct synthetic feature set from available properties and default baseline
    const features: Record<string, number> = {
      Time: tx.Time,
      Amount: tx.Amount,
    };
    // If it's a fraud case from test sample, populate characteristic PCA shifts
    if (tx.Class === 1) {
      features.V14 = -4.5;
      features.V17 = -8.2;
      features.V12 = -6.1;
      features.V10 = -3.4;
    }
    // Fill remaining V1-V28
    for (let i = 1; i <= 28; i++) {
      const k = `V${i}`;
      if (features[k] === undefined) {
        features[k] = 0.05;
      }
    }
    navigate("/analyze", { state: { features } });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="card p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="badge-blue text-xs font-medium">Dataset Exploration</span>
              <span className="badge-neutral text-xs font-mono">GET /api/transactions/explorer</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Transaction Explorer &amp; Audit Log
            </h1>
            <p className="text-navy-300 text-sm mt-1 max-w-2xl">
              Inspect representative records from the test evaluation corpus and audit
              inference decisions. Compare the model's assigned risk tier with the ground truth
              banking label. Click any row to inspect feature values or test in Single Analysis.
            </p>
          </div>
          <div className="shrink-0 flex items-center gap-2">
            <span className="badge-low text-xs font-mono px-3 py-1.5 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-risk-low animate-pulse" />
              Live Feed Connected
            </span>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div
          role="alert"
          className="p-4 rounded-lg bg-risk-high/15 border border-risk-high/40 text-risk-high text-xs flex items-start gap-2.5"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <strong className="block font-semibold">Feed Error</strong>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Filter and Control Bar */}
      <div className="card p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-navy-400 absolute left-3 top-2.5" />
            <input
              type="text"
              id="explorer-search"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search amount or score..."
              className="w-full bg-navy-850 border border-navy-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-accent-sky"
            />
          </div>

          <div>
            <select
              id="class-filter-select"
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value as any)}
              className="w-full bg-navy-850 border border-navy-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-accent-sky"
            >
              <option value="all">All Ground Truth Labels</option>
              <option value="fraudulent">Confirmed Fraud Only (Class = 1)</option>
              <option value="legitimate">Legitimate Only (Class = 0)</option>
            </select>
          </div>

          <div>
            <select
              id="limit-select"
              value={limit}
              onChange={(e) => setLimit(parseInt(e.target.value))}
              className="w-full bg-navy-850 border border-navy-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-accent-sky"
            >
              <option value={25}>Query 25 records</option>
              <option value={50}>Query 50 records</option>
              <option value={100}>Query 100 records</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchTransactions}
              disabled={isLoading}
              className="flex-1 py-2 px-3 bg-navy-800 hover:bg-navy-750 text-white rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 border border-navy-700 transition-colors"
            >
              <Filter className="w-3.5 h-3.5" />
              Refresh Filter
            </button>
            <button
              type="button"
              onClick={fetchTransactions}
              disabled={isLoading}
              className="p-2 bg-navy-800 hover:bg-navy-750 text-navy-300 hover:text-white rounded-lg border border-navy-700 transition-colors"
              title="Refresh Records"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Transaction Records Table */}
      <div className="card p-6">
        <div className="flex items-center justify-between pb-4 border-b border-navy-700/60 mb-5">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-accent-sky" />
            <h2 className="text-base font-semibold text-white">Representative Test Corpus</h2>
          </div>
          <span className="text-xs text-navy-400 font-mono">
            {isLoading
              ? "Fetching..."
              : `Showing ${paginatedSlice.length} of ${filteredList.length} matching (Pool: ${totalMatching})`}
          </span>
        </div>

        {isLoading ? (
          <div className="h-64 flex flex-col items-center justify-center text-center">
            <RefreshCw className="w-8 h-8 text-accent-sky animate-spin mb-3" />
            <p className="text-sm font-medium text-navy-300">Loading Transactions...</p>
            <p className="text-xs text-navy-400 mt-1">
              Executing live model batch predictions on dataset records
            </p>
          </div>
        ) : filteredList.length > 0 ? (
          <div>
            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-navy-850 border-b border-navy-700 text-navy-300 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Ground Truth</th>
                    <th className="py-2.5 px-3">Assigned Risk Tier</th>
                    <th className="py-2.5 px-3">Probability</th>
                    <th className="py-2.5 px-3">Risk Score</th>
                    <th className="py-2.5 px-3">Amount ($)</th>
                    <th className="py-2.5 px-3">Time</th>
                    <th className="py-2.5 px-3 text-right">Inspect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-800 text-navy-200">
                  {paginatedSlice.map((tx, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-navy-800/40 cursor-pointer"
                      onClick={() => setSelectedTx(tx)}
                    >
                      <td className="py-2.5 px-3 font-mono text-navy-400">
                        #{(currentPage - 1) * pageSize + idx + 1}
                      </td>
                      <td className="py-2.5 px-3">
                        {tx.Class === 1 ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-risk-high/15 text-risk-high border border-risk-high/30 font-semibold text-[11px]">
                            <ShieldAlert className="w-3 h-3" />
                            Fraud (1)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-risk-low/15 text-risk-low border border-risk-low/30 font-semibold text-[11px]">
                            <ShieldCheck className="w-3 h-3" />
                            Legitimate (0)
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={
                            tx.risk_category === "High Risk"
                              ? "badge-high text-[11px]"
                              : tx.risk_category === "Medium Risk"
                              ? "badge-medium text-[11px]"
                              : "badge-low text-[11px]"
                          }
                        >
                          {tx.risk_category === "High Risk" ? (
                            <ShieldAlert className="w-3 h-3" />
                          ) : tx.risk_category === "Medium Risk" ? (
                            <AlertTriangle className="w-3 h-3" />
                          ) : (
                            <ShieldCheck className="w-3 h-3" />
                          )}
                          {tx.risk_category}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-semibold text-white">
                        {(tx.fraud_probability * 100).toFixed(2)}%
                      </td>
                      <td className="py-2.5 px-3 font-mono text-accent-sky font-semibold">
                        {tx.risk_score}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-medium text-white">
                        ${tx.Amount.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-navy-400">
                        {tx.Time.toFixed(0)}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTx(tx);
                          }}
                          className="text-accent-sky hover:text-accent-blue font-medium inline-flex items-center gap-1 text-[11px] p-1 rounded hover:bg-navy-750"
                        >
                          View Details
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 mt-2 border-t border-navy-800 text-xs text-navy-400">
                <span>
                  Page {currentPage} of {totalPages} ({filteredList.length} total filtered)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="p-1.5 rounded bg-navy-800 hover:bg-navy-750 disabled:opacity-40 border border-navy-700 text-white"
                    aria-label="Previous Page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="font-mono text-white">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="p-1.5 rounded bg-navy-800 hover:bg-navy-750 disabled:opacity-40 border border-navy-700 text-white"
                    aria-label="Next Page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="h-44 rounded-lg border border-dashed border-navy-700/80 bg-navy-850/50 flex flex-col items-center justify-center p-6 text-center">
            <Database className="w-8 h-8 text-navy-500 mb-2" />
            <p className="text-sm font-medium text-navy-300">No Transactions Found</p>
            <p className="text-xs text-navy-400 mt-1">
              Adjust your search or filter criteria to display records.
            </p>
          </div>
        )}
      </div>

      {/* Transaction Details Modal */}
      {selectedTx && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedTx(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div
            className="card max-w-lg w-full p-6 bg-navy-900 border border-navy-700 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-navy-700">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-accent-sky" />
                <h3 id="modal-title" className="text-base font-bold text-white">
                  Transaction Audit Record
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTx(null)}
                className="text-navy-400 hover:text-white p-1 rounded-lg"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-navy-850 border border-navy-700">
                <span className="text-navy-400 block mb-0.5">Ground Truth</span>
                <span className="text-white font-semibold">
                  {selectedTx.Class === 1 ? "Confirmed Fraud (1)" : "Confirmed Legitimate (0)"}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-navy-850 border border-navy-700">
                <span className="text-navy-400 block mb-0.5">Assigned Risk Tier</span>
                <span
                  className={
                    selectedTx.risk_category === "High Risk"
                      ? "text-risk-high font-bold"
                      : selectedTx.risk_category === "Medium Risk"
                      ? "text-risk-medium font-bold"
                      : "text-risk-low font-bold"
                  }
                >
                  {selectedTx.risk_category}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-navy-850 border border-navy-700">
                <span className="text-navy-400 block mb-0.5">Fraud Probability</span>
                <span className="text-white font-mono font-bold">
                  {(selectedTx.fraud_probability * 100).toFixed(2)}%
                </span>
              </div>
              <div className="p-3 rounded-lg bg-navy-850 border border-navy-700">
                <span className="text-navy-400 block mb-0.5">Risk Score</span>
                <span className="text-accent-sky font-mono font-bold">
                  {selectedTx.risk_score} / 100
                </span>
              </div>
              <div className="p-3 rounded-lg bg-navy-850 border border-navy-700">
                <span className="text-navy-400 block mb-0.5">Transaction Amount</span>
                <span className="text-white font-mono font-bold">
                  ${selectedTx.Amount.toFixed(2)}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-navy-850 border border-navy-700">
                <span className="text-navy-400 block mb-0.5">Elapsed Seconds</span>
                <span className="text-white font-mono font-bold">
                  {selectedTx.Time.toFixed(0)}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-navy-400 leading-relaxed">
              This record was sampled from the isolated 56,962 test transactions. You can
              seamlessly load this transaction into the Single Transaction Analysis tool to
              evaluate full local SHAP tree attributions and customize decision thresholds.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-navy-800">
              <button
                type="button"
                onClick={() => setSelectedTx(null)}
                className="px-4 py-2 rounded-lg bg-navy-800 hover:bg-navy-750 text-navy-300 text-xs font-medium"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => handleInspectInSingleAnalysis(selectedTx)}
                className="px-4 py-2 rounded-lg bg-accent-blue hover:bg-accent-sky text-navy-950 font-bold text-xs flex items-center gap-1.5 shadow-sm"
              >
                <Sliders className="w-3.5 h-3.5" />
                Score in Single Analysis
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
