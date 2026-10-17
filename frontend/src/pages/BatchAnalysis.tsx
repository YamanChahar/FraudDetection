import React, { useState, useRef } from "react";
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  AlertCircle,
  FileCheck,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  ArrowDownToLine,
  BarChart3,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { api, ApiError } from "../services/api";
import type { BatchPredictionResponse } from "../types/api";

const RISK_COLORS = {
  "Low Risk": "#10B981",
  "Medium Risk": "#F59E0B",
  "High Risk": "#EF4444",
};

export const BatchAnalysis: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [batchResult, setBatchResult] = useState<BatchPredictionResponse | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const [lowThreshold, setLowThreshold] = useState<number>(0.30);
  const [highThreshold, setHighThreshold] = useState<number>(0.70);

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const rowsPerPage = 10;

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (!selected.name.endsWith(".csv")) {
        setError("Only CSV (.csv) files are supported.");
        return;
      }
      if (selected.size > 5 * 1024 * 1024) {
        setError("File size exceeds 5MB limit.");
        return;
      }
      setFile(selected);
      setError(null);
      setCurrentPage(1);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selected = e.dataTransfer.files[0];
      if (!selected.name.endsWith(".csv")) {
        setError("Only CSV (.csv) files are supported.");
        return;
      }
      if (selected.size > 5 * 1024 * 1024) {
        setError("File size exceeds 5MB limit.");
        return;
      }
      setFile(selected);
      setError(null);
      setCurrentPage(1);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleUploadAndScore = async () => {
    if (!file || isUploading) return;
    setIsUploading(true);
    setError(null);

    try {
      const res = await api.predictBatch(file, {
        low_threshold: lowThreshold,
        high_threshold: highThreshold,
      });
      setBatchResult(res);
      setCurrentPage(1);
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError(err?.message || "Batch scoring failed.");
      }
    } finally {
      setIsUploading(false);
    }
  };

  // Export scored rows to CSV
  const handleExportCsv = () => {
    if (!batchResult || !batchResult.results.length) return;
    const items = batchResult.results;
    const headers = Object.keys(items[0]);
    const csvRows = [
      headers.join(","),
      ...items.map((row) =>
        headers
          .map((h) => {
            const val = row[h];
            return typeof val === "string" ? `"${val.replace(/"/g, '""')}"` : val;
          })
          .join(",")
      ),
    ];
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `scored_${file?.name || "batch_results.csv"}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredResults =
    batchResult?.results.filter((item) => {
      if (filterCategory === "all") return true;
      return item.risk_category === filterCategory;
    }) || [];

  // Paginated slice
  const totalPages = Math.ceil(filteredResults.length / rowsPerPage) || 1;
  const paginatedSlice = filteredResults.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  // Recharts data for risk summary
  const summaryChartData = batchResult
    ? [
        { name: "Low Risk", count: batchResult.summary.low_risk_count },
        { name: "Medium Risk", count: batchResult.summary.medium_risk_count },
        { name: "High Risk", count: batchResult.summary.high_risk_count },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="card p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="badge-blue text-xs font-medium">Batch Processing</span>
              <span className="badge-neutral text-xs font-mono">POST /api/predict/batch</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Batch CSV Transaction Scoring
            </h1>
            <p className="text-navy-300 text-sm mt-1 max-w-2xl">
              Upload multi-row transaction CSV files for high-throughput vector scoring.
              The FastAPI backend evaluates all canonical features, partitions transactions
              into operational risk categories, and generates full audit summaries.
            </p>
          </div>
          <div className="shrink-0 flex items-center gap-2">
            <a
              href={api.getSampleBatchUrl()}
              download="sample_batch_transactions.csv"
              className="px-3.5 py-2 bg-navy-800 hover:bg-navy-750 text-accent-sky border border-navy-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <ArrowDownToLine className="w-4 h-4" />
              Download Verified Sample CSV
            </a>
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
            <strong className="block font-semibold">Upload Error</strong>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* File Upload Zone */}
      <div className="card p-8">
        <div className="flex items-center justify-between pb-4 border-b border-navy-700/60 mb-6">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-accent-sky" />
            <h2 className="text-base font-semibold text-white">Upload Transaction Batch (CSV)</h2>
          </div>
          <span className="text-xs text-navy-400 font-mono">Max 5MB • Required: Time, Amount, V1–V28</span>
        </div>

        <input
          type="file"
          id="batch-file-input"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".csv"
          className="hidden"
        />

        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
          }}
          className="border-2 border-dashed border-navy-700 hover:border-accent-sky rounded-xl p-8 flex flex-col items-center justify-center text-center bg-navy-850/40 hover:bg-navy-850/70 transition-colors cursor-pointer focus:outline-none focus:border-accent-sky"
        >
          <div className="w-12 h-12 rounded-full bg-navy-800 flex items-center justify-center mb-3 text-accent-sky">
            <UploadCloud className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-white">
            {file ? file.name : "Drag and drop CSV transaction file here"}
          </p>
          <p className="text-xs text-navy-400 mt-1 max-w-sm">
            {file
              ? `${(file.size / 1024).toFixed(1)} KB • Click to choose a different file`
              : "Or click to browse from your filesystem. Supports canonical 30-feature datasets."}
          </p>
        </div>

        {/* Upload Action and Policy Configuration */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-navy-700/60">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 text-xs text-navy-300">
            <div className="flex items-center gap-2">
              <label htmlFor="batch-t1" className="cursor-pointer">
                T₁ (Low): <span className="font-mono text-white font-semibold">{lowThreshold.toFixed(2)}</span>
              </label>
              <input
                id="batch-t1"
                type="range"
                min="0.05"
                max="0.45"
                step="0.05"
                value={lowThreshold}
                onChange={(e) => setLowThreshold(parseFloat(e.target.value))}
                className="w-24 accent-accent-sky"
              />
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor="batch-t2" className="cursor-pointer">
                T₂ (High): <span className="font-mono text-white font-semibold">{highThreshold.toFixed(2)}</span>
              </label>
              <input
                id="batch-t2"
                type="range"
                min="0.55"
                max="0.95"
                step="0.05"
                value={highThreshold}
                onChange={(e) => setHighThreshold(parseFloat(e.target.value))}
                className="w-24 accent-risk-high"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={!file || isUploading}
              onClick={handleUploadAndScore}
              className="px-5 py-2.5 bg-accent-blue hover:bg-accent-sky text-navy-950 font-bold rounded-lg text-xs transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Scoring Batch via Backend...
                </>
              ) : (
                <>
                  <FileCheck className="w-4 h-4" />
                  Score Uploaded Batch
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards & Chart (If results exist) */}
      {batchResult && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* KPI Cards (7 cols) */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="card p-5">
              <span className="text-xs uppercase font-medium text-navy-400 tracking-wider">
                Total Evaluated
              </span>
              <div className="text-2xl font-bold font-mono text-white mt-1">
                {batchResult.summary.total}
              </div>
              <div className="text-xs text-navy-400 mt-1">Transactions in batch</div>
            </div>

            <div className="card p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-medium text-risk-low tracking-wider">
                  Low Risk
                </span>
                <ShieldCheck className="w-4 h-4 text-risk-low" />
              </div>
              <div className="text-2xl font-bold font-mono text-risk-low mt-1">
                {batchResult.summary.low_risk_count}
              </div>
              <div className="text-xs text-navy-400 mt-1">
                {batchResult.summary.low_risk_pct}% of batch
              </div>
            </div>

            <div className="card p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-medium text-risk-medium tracking-wider">
                  Medium Risk
                </span>
                <AlertTriangle className="w-4 h-4 text-risk-medium" />
              </div>
              <div className="text-2xl font-bold font-mono text-risk-medium mt-1">
                {batchResult.summary.medium_risk_count}
              </div>
              <div className="text-xs text-navy-400 mt-1">
                {batchResult.summary.medium_risk_pct}% of batch
              </div>
            </div>

            <div className="card p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-medium text-risk-high tracking-wider">
                  High Risk
                </span>
                <ShieldAlert className="w-4 h-4 text-risk-high" />
              </div>
              <div className="text-2xl font-bold font-mono text-risk-high mt-1">
                {batchResult.summary.high_risk_count}
              </div>
              <div className="text-xs text-navy-400 mt-1">
                {batchResult.summary.high_risk_pct}% of batch
              </div>
            </div>
          </div>

          {/* Mini Recharts Bar Chart (5 cols) */}
          <div className="lg:col-span-5 card p-5 flex flex-col justify-between">
            <div className="flex items-center justify-between pb-2 border-b border-navy-700 mb-2">
              <span className="text-xs font-semibold text-white flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-accent-sky" />
                Risk Tier Distribution
              </span>
              <span className="text-[11px] text-navy-400 font-mono">Batch Volume</span>
            </div>
            <div className="h-36 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summaryChartData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#94A3B8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#111827",
                      borderColor: "#334155",
                      borderRadius: "0.375rem",
                      fontSize: "0.75rem",
                      color: "#fff",
                    }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {summaryChartData.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={RISK_COLORS[entry.name as keyof typeof RISK_COLORS] || "#38BDF8"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Scored Results Table */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-navy-700/60 mb-5 gap-3">
          <div className="flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-accent-sky" />
            <h2 className="text-base font-semibold text-white">Batch Evaluation Output</h2>
          </div>

          {batchResult && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-navy-850 p-1 rounded-lg border border-navy-700">
                <button
                  type="button"
                  onClick={() => {
                    setFilterCategory("all");
                    setCurrentPage(1);
                  }}
                  className={`px-2.5 py-1 text-xs rounded font-medium ${
                    filterCategory === "all"
                      ? "bg-navy-700 text-white"
                      : "text-navy-400 hover:text-white"
                  }`}
                >
                  All ({batchResult.summary.total})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFilterCategory("High Risk");
                    setCurrentPage(1);
                  }}
                  className={`px-2.5 py-1 text-xs rounded font-medium ${
                    filterCategory === "High Risk"
                      ? "bg-risk-high/20 text-risk-high"
                      : "text-navy-400 hover:text-white"
                  }`}
                >
                  High ({batchResult.summary.high_risk_count})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFilterCategory("Medium Risk");
                    setCurrentPage(1);
                  }}
                  className={`px-2.5 py-1 text-xs rounded font-medium ${
                    filterCategory === "Medium Risk"
                      ? "bg-risk-medium/20 text-risk-medium"
                      : "text-navy-400 hover:text-white"
                  }`}
                >
                  Medium ({batchResult.summary.medium_risk_count})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFilterCategory("Low Risk");
                    setCurrentPage(1);
                  }}
                  className={`px-2.5 py-1 text-xs rounded font-medium ${
                    filterCategory === "Low Risk"
                      ? "bg-risk-low/20 text-risk-low"
                      : "text-navy-400 hover:text-white"
                  }`}
                >
                  Low ({batchResult.summary.low_risk_count})
                </button>
              </div>

              <button
                type="button"
                onClick={handleExportCsv}
                className="px-3 py-1.5 bg-navy-750 hover:bg-navy-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-navy-600 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Export Scored CSV
              </button>
            </div>
          )}
        </div>

        {batchResult ? (
          <div>
            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-navy-850 border-b border-navy-700 text-navy-300 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Risk Category</th>
                    <th className="py-2.5 px-3">Probability</th>
                    <th className="py-2.5 px-3">Risk Score</th>
                    <th className="py-2.5 px-3">Amount ($)</th>
                    <th className="py-2.5 px-3">Time</th>
                    <th className="py-2.5 px-3">Operational Recommendation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-800 text-navy-200">
                  {paginatedSlice.map((row, idx) => (
                    <tr key={idx} className="hover:bg-navy-800/40">
                      <td className="py-2.5 px-3 font-mono text-navy-400">
                        #{(currentPage - 1) * rowsPerPage + idx + 1}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={
                            row.risk_category === "High Risk"
                              ? "badge-high text-[11px]"
                              : row.risk_category === "Medium Risk"
                              ? "badge-medium text-[11px]"
                              : "badge-low text-[11px]"
                          }
                        >
                          {row.risk_category === "High Risk" ? (
                            <ShieldAlert className="w-3 h-3" />
                          ) : row.risk_category === "Medium Risk" ? (
                            <AlertTriangle className="w-3 h-3" />
                          ) : (
                            <ShieldCheck className="w-3 h-3" />
                          )}
                          {row.risk_category}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-semibold text-white">
                        {(row.fraud_probability * 100).toFixed(2)}%
                      </td>
                      <td className="py-2.5 px-3 font-mono text-accent-sky font-semibold">
                        {row.risk_score}
                      </td>
                      <td className="py-2.5 px-3 font-mono">
                        ${Number(row.Amount || 0).toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-navy-400">
                        {row.Time}
                      </td>
                      <td className="py-2.5 px-3 text-navy-300">
                        {row.operational_recommendation}
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
                  Showing {(currentPage - 1) * rowsPerPage + 1} to{" "}
                  {Math.min(currentPage * rowsPerPage, filteredResults.length)} of{" "}
                  {filteredResults.length} records
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="p-1.5 rounded bg-navy-800 hover:bg-navy-750 disabled:opacity-40 border border-navy-700"
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
                    className="p-1.5 rounded bg-navy-800 hover:bg-navy-750 disabled:opacity-40 border border-navy-700"
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
            <AlertCircle className="w-8 h-8 text-navy-500 mb-2" />
            <p className="text-sm font-medium text-navy-300">No Batch File Loaded</p>
            <p className="text-xs text-navy-400 mt-1 max-w-sm">
              Upload a CSV file above or download the verified sample CSV to test high-throughput
              scoring across multiple records.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
