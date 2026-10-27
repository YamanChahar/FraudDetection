import React, { useState, useEffect, useCallback } from 'react';
import {
  FileSpreadsheet,
  Upload,
  Play,
  CheckCircle2,
  AlertTriangle,
  Download,
  RefreshCw,
  Clock,
  Layers,
  FileCheck,
} from 'lucide-react';
import DataTable from '../components/common/DataTable';
import RiskBadge from '../components/common/RiskBadge';
import { createBatchJob, fetchBatchJobs, fetchBatchJobById } from '../services/batchApi';

// Sample 10 transactions fallback for one-click demo testing
const SAMPLE_CSV_ROWS = [
  { Time: 10.0, Amount: 7.80, V1: 1.44, V2: -1.17, V3: 0.91, V4: -1.37, V14: -0.09, V12: -0.67, V10: 1.62, Class: 0 },
  { Time: 10.0, Amount: 9.99, V1: 0.38, V2: 0.61, V3: -0.87, V4: -0.09, V14: 0.36, V12: -0.32, V10: 0.30, Class: 0 },
  { Time: 10.0, Amount: 121.50, V1: 1.24, V2: -1.22, V3: 0.38, V4: -1.23, V14: -0.31, V12: -0.24, V10: 1.32, Class: 0 },
  { Time: 11.0, Amount: 27.50, V1: 1.06, V2: 0.28, V3: 0.82, V4: 2.71, V14: -0.17, V12: 0.32, V10: 0.46, Class: 0 },
  { Time: 12.0, Amount: 58.80, V1: -2.79, V2: -0.32, V3: 1.64, V4: 1.76, V14: -0.73, V12: 0.79, V10: 1.15, Class: 0 },
  { Time: 12.0, Amount: 15.99, V1: -0.75, V2: 0.34, V3: 2.05, V4: -1.46, V14: -1.06, V12: -0.77, V10: 0.74, Class: 0 },
  { Time: 12.0, Amount: 12.99, V1: 1.10, V2: -0.04, V3: 1.26, V4: 1.28, V14: -0.46, V12: 0.93, V10: -0.26, Class: 0 },
  { Time: 13.0, Amount: 0.89, V1: -0.43, V2: 0.91, V3: 0.92, V4: -0.72, V14: -0.29, V12: 0.27, V10: -0.73, Class: 0 },
  { Time: 4462.0, Amount: 239.93, V1: -2.30, V2: 1.75, V3: -0.35, V4: 2.33, V14: -1.47, V12: -6.56, V10: -1.52, Class: 1 },
  { Time: 6986.0, Amount: 59.00, V1: -4.39, V2: 1.35, V3: -2.59, V4: 2.67, V14: -6.77, V12: -10.91, V10: -4.80, Class: 1 },
];

export default function BatchTestingPage() {
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Upload & File State
  const [fileName, setFileName] = useState('');
  const [parsedRows, setParsedRows] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadJobs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchBatchJobs();
      if (res.success && res.data) {
        setJobs(res.data);
        if (res.data.length > 0 && !selectedJob) {
          setSelectedJob(res.data[0]);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch batch jobs');
    } finally {
      setLoading(false);
    }
  }, [selectedJob]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setError('Please upload a valid CSV file');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setError(`File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds the 50MB limit. Please upload a smaller CSV file.`);
      return;
    }

    setFileName(file.name);
    setError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const lines = text.split('\n').filter((l) => l.trim().length > 0);
        if (lines.length < 2) {
          setError('CSV file is empty or missing headers');
          return;
        }

        const headers = lines[0].split(',').map((h) => h.trim());
        const rows = [];
        const maxRecords = 25000;
        const totalRows = lines.length - 1;

        for (let i = 1; i <= Math.min(totalRows, maxRecords); i++) {
          const vals = lines[i].split(',').map((v) => v.trim());
          if (vals.length === headers.length) {
            const rowObj = {};
            headers.forEach((h, idx) => {
              const num = parseFloat(vals[idx]);
              rowObj[h] = isNaN(num) ? vals[idx] : num;
            });
            rows.push(rowObj);
          }
        }

        if (totalRows > maxRecords) {
          setError(`Dataset contains ${totalRows.toLocaleString()} rows. System capped import to the first ${maxRecords.toLocaleString()} rows.`);
        }

        setParsedRows(rows);
      } catch (err) {
        setError(`Failed to parse CSV: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  const handleLoadSampleDataset = () => {
    setFileName('sample_batch_transactions.csv (Benchmark Corpus)');
    setParsedRows(SAMPLE_CSV_ROWS);
  };

  const handleStartBatchJob = async () => {
    if (parsedRows.length === 0) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await createBatchJob({
        datasetName: fileName || 'Uploaded_Transactions.csv',
        records: parsedRows,
      });

      if (res.success && res.data) {
        const newJob = res.data;
        setSelectedJob(newJob);
        // Poll for completion after 2 seconds
        setTimeout(async () => {
          try {
            const updated = await fetchBatchJobById(newJob.id || newJob._id);
            if (updated.success && updated.data) {
              setSelectedJob(updated.data);
              loadJobs();
            }
          } catch {}
        }, 2500);
      }
    } catch (err) {
      setError(err.message || 'Batch job execution failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadCsv = () => {
    if (!selectedJob || !selectedJob.results?.predictionsSummary) return;

    const summary = selectedJob.results.predictionsSummary;
    const headers = ['Record_Index', 'Risk_Score', 'Risk_Level', 'Fraud_Probability', 'Flagged_Label'];
    const lines = [headers.join(',')];

    summary.forEach((p) => {
      lines.push([
        p.record_index,
        p.risk_score,
        p.risk_level,
        p.fraud_probability,
        p.prediction_label,
      ].join(','));
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `evaluated_${selectedJob.datasetName || 'batch_results'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Title */}
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: '4px' }}>
          Dataset Testing &amp; Batch Analysis
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          Upload transaction CSV files for high-throughput batch scoring, automated anomaly detection, and validation metrics.
        </p>
      </div>

      {error && (
        <div style={{ padding: '12px', backgroundColor: '#FBEBE8', border: '1px solid #F3BEB5', borderRadius: '4px', color: '#A83824', fontSize: '13px' }}>
          {error}
        </div>
      )}

      {/* Upload & Job Execution Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '24px' }}>
        {/* Upload Container */}
        <div className="trace-card" style={{ padding: '24px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>
            Upload Transaction Dataset
          </h2>

          <div
            style={{
              border: '2px dashed var(--border-stone)',
              borderRadius: '6px',
              padding: '32px 20px',
              textAlign: 'center',
              backgroundColor: 'var(--surface-subtle)',
              cursor: 'pointer',
              marginBottom: '16px',
            }}
            onClick={() => document.getElementById('csv-upload-input').click()}
          >
            <Upload size={32} color="var(--accent-terracotta)" style={{ margin: '0 auto 10px auto' }} />
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
              {fileName ? fileName : 'Click to select or drag CSV dataset here'}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Standard Credit Card Benchmark features supported (Time, Amount, V1–V28)
            </div>
            <input
              id="csv-upload-input"
              type="file"
              accept=".csv"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
            <button
              type="button"
              className="btn-outline"
              style={{ fontSize: '12px' }}
              onClick={handleLoadSampleDataset}
            >
              <FileCheck size={14} />
              Load Benchmark Corpus
            </button>

            <button
              type="button"
              className="btn-primary"
              disabled={parsedRows.length === 0 || isSubmitting}
              onClick={handleStartBatchJob}
              style={{ fontSize: '13px' }}
            >
              <Play size={14} />
              {isSubmitting ? 'Submitting Batch Job...' : `Run Batch Analysis (${parsedRows.length} Rows)`}
            </button>
          </div>
        </div>

        {/* Selected Job Results Container */}
        <div className="trace-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid var(--border-stone)', paddingBottom: '12px' }}>
            <div>
              <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                {selectedJob ? selectedJob.datasetName : 'No Batch Job Selected'}
              </h2>
              {selectedJob && (
                <span className="tabular-nums" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Started: {new Date(selectedJob.createdAt).toLocaleTimeString()} &bull; ID: {selectedJob.id?.slice(-8)}
                </span>
              )}
            </div>

            {selectedJob && selectedJob.status === 'COMPLETED' && (
              <button
                type="button"
                className="btn-outline"
                style={{ fontSize: '11px', padding: '4px 10px' }}
                onClick={handleDownloadCsv}
              >
                <Download size={12} />
                Export Scored CSV
              </button>
            )}
          </div>

          {!selectedJob ? (
            <div style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
              Select an existing batch job from the history below, or upload a dataset to begin.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Status Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Status:</span>
                  <span
                    className={
                      selectedJob.status === 'COMPLETED'
                        ? 'badge-low'
                        : selectedJob.status === 'FAILED'
                        ? 'badge-high'
                        : 'badge-med'
                    }
                  >
                    {selectedJob.status}
                  </span>
                </div>
                <span className="tabular-nums" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Processed: <strong>{selectedJob.processedRecords}</strong> / {selectedJob.totalRecords} records
                </span>
              </div>

              {/* Progress Bar */}
              <div style={{ height: '8px', backgroundColor: 'var(--surface-subtle)', borderRadius: '4px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${selectedJob.totalRecords > 0 ? (selectedJob.processedRecords / selectedJob.totalRecords) * 100 : 0}%`,
                    backgroundColor: 'var(--accent-terracotta)',
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>

              {/* Results Breakdown */}
              {selectedJob.results?.riskDistribution && (
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                    Batch Risk Category Distribution
                  </span>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginTop: '8px' }}>
                    <div style={{ padding: '10px', backgroundColor: 'var(--surface-subtle)', borderRadius: '4px', textAlign: 'center' }}>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--status-low-fg)' }}>LOW</span>
                      <div className="tabular-nums" style={{ fontSize: '18px', fontWeight: 800 }}>
                        {selectedJob.results.riskDistribution.LOW || 0}
                      </div>
                    </div>
                    <div style={{ padding: '10px', backgroundColor: 'var(--surface-subtle)', borderRadius: '4px', textAlign: 'center' }}>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--status-med-fg)' }}>MED</span>
                      <div className="tabular-nums" style={{ fontSize: '18px', fontWeight: 800 }}>
                        {selectedJob.results.riskDistribution.MEDIUM || 0}
                      </div>
                    </div>
                    <div style={{ padding: '10px', backgroundColor: 'var(--surface-subtle)', borderRadius: '4px', textAlign: 'center' }}>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--status-high-fg)' }}>HIGH</span>
                      <div className="tabular-nums" style={{ fontSize: '18px', fontWeight: 800 }}>
                        {selectedJob.results.riskDistribution.HIGH || 0}
                      </div>
                    </div>
                    <div style={{ padding: '10px', backgroundColor: 'var(--surface-subtle)', borderRadius: '4px', textAlign: 'center' }}>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: '#74170E' }}>CRIT</span>
                      <div className="tabular-nums" style={{ fontSize: '18px', fontWeight: 800 }}>
                        {selectedJob.results.riskDistribution.CRITICAL || 0}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Ground-truth evaluation if labels existed */}
              {selectedJob.results?.evaluation && (
                <div style={{ padding: '12px 14px', backgroundColor: 'var(--surface-subtle)', borderRadius: '4px', border: '1px solid var(--border-stone)', fontSize: '12px' }}>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                    Ground-Truth Benchmark Evaluation
                  </div>
                  <div style={{ display: 'flex', gap: '16px', color: 'var(--text-secondary)' }}>
                    <span>Precision: <strong>{(selectedJob.results.evaluation.precision * 100).toFixed(1)}%</strong></span>
                    <span>Recall: <strong>{(selectedJob.results.evaluation.recall * 100).toFixed(1)}%</strong></span>
                    <span>F1-Score: <strong>{selectedJob.results.evaluation.f1_score.toFixed(3)}</strong></span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Historical Batch Jobs Table */}
      <div className="trace-card" style={{ padding: '24px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>
          Batch Testing Job History
        </h2>

        <div className="trace-table-container">
          <table className="trace-table">
            <thead>
              <tr>
                <th>Dataset Name</th>
                <th>Status</th>
                <th>Records Processed</th>
                <th>Flagged High/Crit</th>
                <th>Duration</th>
                <th>Execution Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {jobs.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    No dataset testing jobs recorded yet.
                  </td>
                </tr>
              ) : (
                jobs.map((j) => (
                  <tr
                    key={j.id}
                    onClick={() => setSelectedJob(j)}
                    style={{ cursor: 'pointer', backgroundColor: selectedJob?.id === j.id ? 'var(--surface-subtle)' : 'transparent' }}
                  >
                    <td style={{ fontWeight: 600 }}>{j.datasetName}</td>
                    <td>
                      <span className={j.status === 'COMPLETED' ? 'badge-low' : j.status === 'FAILED' ? 'badge-high' : 'badge-med'}>
                        {j.status}
                      </span>
                    </td>
                    <td className="tabular-nums">{j.processedRecords} / {j.totalRecords}</td>
                    <td className="tabular-nums" style={{ fontWeight: 700, color: j.fraudCount > 0 ? 'var(--status-high-fg)' : 'inherit' }}>
                      {j.fraudCount || 0}
                    </td>
                    <td className="tabular-nums">{j.results?.durationMs ? `${j.results.durationMs}ms` : '—'}</td>
                    <td className="tabular-nums">{new Date(j.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button
                        type="button"
                        className="btn-outline"
                        style={{ padding: '3px 8px', fontSize: '11px' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedJob(j);
                        }}
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
