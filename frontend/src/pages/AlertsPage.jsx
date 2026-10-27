import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  AlertTriangle,
  Search,
  Filter,
  RefreshCw,
  UserCheck,
  CheckCircle2,
  XCircle,
  FileText,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import DataTable from '../components/common/DataTable';
import RiskBadge from '../components/common/RiskBadge';
import StatusBadge from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { useAuth } from '../context/AuthContext';
import {
  fetchAlerts,
  fetchAlertById,
  updateAlertStatus,
  assignAlert,
  recordInvestigationFinding,
} from '../services/alertApi';

export default function AlertsPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialStatus = searchParams.get('status') || '';

  const [alerts, setAlerts] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, totalRecords: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [severityFilter, setSeverityFilter] = useState('');

  // Investigation Modal State
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [investigateModalOpen, setInvestigateModalOpen] = useState(false);
  const [findings, setFindings] = useState('');
  const [decision, setDecision] = useState('CONFIRMED_FRAUD');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalSuccess, setModalSuccess] = useState(null);

  const canInvestigate = ['INVESTIGATOR', 'LEAD', 'ADMIN'].includes((user?.role || '').toUpperCase());

  const loadAlerts = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, limit: 15 };
      if (statusFilter) params.status = statusFilter;
      if (severityFilter) params.severity = severityFilter;

      const res = await fetchAlerts(params);
      if (res.success && res.data) {
        setAlerts(res.data);
        if (res.meta?.pagination) {
          setPagination(res.meta.pagination);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load fraud alerts');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, severityFilter]);

  useEffect(() => {
    loadAlerts(1);
  }, [loadAlerts]);

  const handleOpenInvestigate = async (alert) => {
    setSelectedAlert(alert);
    setFindings('');
    setDecision('CONFIRMED_FRAUD');
    setModalSuccess(null);
    setInvestigateModalOpen(true);
  };

  const handleSelfAssign = async (alertId) => {
    if (!user) return;
    try {
      await assignAlert(alertId, user.id);
      loadAlerts(pagination.page);
    } catch (err) {
      alert(err.message || 'Failed to assign alert');
    }
  };

  const handleQuickStatus = async (alertId, status) => {
    try {
      await updateAlertStatus(alertId, status);
      loadAlerts(pagination.page);
    } catch (err) {
      alert(err.message || 'Failed to update alert status');
    }
  };

  const handleSubmitInvestigation = async (e) => {
    e.preventDefault();
    if (!selectedAlert) return;
    setIsSubmitting(true);
    setModalSuccess(null);

    try {
      const payload = {
        findings,
        decision,
        isFraud: decision === 'CONFIRMED_FRAUD',
        resolution: `Investigation concluded by ${user?.name || user?.email} with finding: ${decision}`,
      };

      await recordInvestigationFinding(selectedAlert.id, payload);
      setModalSuccess('Investigation finding successfully recorded and audited.');
      setTimeout(() => {
        setInvestigateModalOpen(false);
        loadAlerts(pagination.page);
      }, 1200);
    } catch (err) {
      setError(err.message || 'Failed to record findings');
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = [
    {
      label: 'Alert Reference',
      key: 'description',
      render: (val, row) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '13px' }}>
            {val || 'Automated Anomaly Alert'}
          </div>
          <div className="tabular-nums" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Tx: {row.transaction?.externalTransactionId} &bull; ${row.transaction?.amount?.toFixed(2)}
          </div>
        </div>
      ),
    },
    {
      label: 'Severity',
      key: 'severity',
      render: (val, row) => (
        <RiskBadge level={val || 'HIGH'} score={row.prediction?.riskScore} size="sm" />
      ),
    },
    {
      label: 'Status',
      key: 'status',
      render: (val) => <StatusBadge status={val} size="sm" />,
    },
    {
      label: 'Assignee',
      key: 'assignedTo',
      render: (val, row) => (
        <div>
          {val ? (
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
              {val.name || val.email}
            </span>
          ) : canInvestigate ? (
            <button
              type="button"
              className="btn-outline"
              style={{ padding: '2px 8px', fontSize: '11px' }}
              onClick={(e) => {
                e.stopPropagation();
                handleSelfAssign(row.id);
              }}
            >
              Assign to Me
            </button>
          ) : (
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Unassigned</span>
          )}
        </div>
      ),
    },
    {
      label: 'Generated',
      key: 'createdAt',
      render: (val) => (
        <span className="tabular-nums" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
          {new Date(val).toLocaleDateString()}
        </span>
      ),
    },
    {
      label: 'Action',
      key: 'actions',
      align: 'right',
      render: (_, row) => (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
          {canInvestigate && row.status !== 'RESOLVED' && row.status !== 'DISMISSED' && (
            <button
              type="button"
              className="btn-primary"
              style={{ padding: '4px 10px', fontSize: '11px' }}
              onClick={() => handleOpenInvestigate(row)}
            >
              <FileText size={12} />
              Investigate
            </button>
          )}

          {canInvestigate && row.status === 'OPEN' && (
            <button
              type="button"
              className="btn-outline"
              style={{ padding: '4px 8px', fontSize: '11px' }}
              onClick={() => handleQuickStatus(row.id, 'DISMISSED')}
              title="Dismiss false alert"
            >
              <XCircle size={12} />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Title */}
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: '4px' }}>
          Fraud Alert &amp; Investigation Management
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          Review automated risk threshold triggers, assign investigation queues, and record audited human findings.
        </p>
      </div>

      {/* Filter Toolbar */}
      <div
        className="trace-card"
        style={{
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setSearchParams(e.target.value ? { status: e.target.value } : {});
            }}
            className="trace-select"
            style={{ width: '180px', fontSize: '13px' }}
          >
            <option value="">All Alert Statuses</option>
            <option value="OPEN">Open</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="UNDER_INVESTIGATION">In Review</option>
            <option value="ESCALATED">Escalated</option>
            <option value="RESOLVED">Resolved</option>
            <option value="DISMISSED">Dismissed</option>
          </select>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="trace-select"
            style={{ width: '160px', fontSize: '13px' }}
          >
            <option value="">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>

        <button
          type="button"
          className="btn-outline"
          onClick={() => loadAlerts(1)}
          disabled={loading}
          style={{ fontSize: '12px' }}
        >
          <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          Reload
        </button>
      </div>

      {error && (
        <div style={{ padding: '12px', backgroundColor: '#FBEBE8', border: '1px solid #F3BEB5', borderRadius: '4px', color: '#A83824', fontSize: '13px' }}>
          {error}
        </div>
      )}

      {/* Alerts Table */}
      <DataTable
        columns={columns}
        data={alerts}
        loading={loading}
        emptyMessage="No fraud alerts currently registered in this queue"
        pagination={{
          currentPage: pagination.page,
          totalPages: pagination.totalPages,
          totalItems: pagination.totalRecords,
          pageSize: pagination.limit,
          onPageChange: (newPage) => loadAlerts(newPage),
        }}
      />

      {/* Investigation Finding Modal */}
      <Modal
        isOpen={investigateModalOpen}
        onClose={() => setInvestigateModalOpen(false)}
        title="Record Investigation Finding"
        maxWidth="580px"
      >
        {selectedAlert && (
          <form onSubmit={handleSubmitInvestigation} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ padding: '12px 14px', backgroundColor: 'var(--surface-subtle)', borderRadius: '6px', fontSize: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span><strong>Transaction:</strong> {selectedAlert.transaction?.externalTransactionId}</span>
                <span className="tabular-nums"><strong>Amount:</strong> ${selectedAlert.transaction?.amount?.toFixed(2)}</span>
              </div>
              <div><strong>Machine Learning Score:</strong> {selectedAlert.prediction?.riskScore}/100 ({selectedAlert.severity})</div>
            </div>

            {modalSuccess && (
              <div style={{ padding: '10px 14px', backgroundColor: '#EEF5F0', border: '1px solid #C6DEC9', borderRadius: '4px', color: 'var(--status-low-fg)', fontSize: '13px' }}>
                {modalSuccess}
              </div>
            )}

            <div>
              <label className="trace-label">Human Investigation Decision</label>
              <select
                value={decision}
                onChange={(e) => setDecision(e.target.value)}
                className="trace-select"
                required
              >
                <option value="CONFIRMED_FRAUD">CONFIRMED FRAUD (Legitimate breach identified)</option>
                <option value="FALSE_POSITIVE">FALSE POSITIVE (Verified genuine customer transaction)</option>
                <option value="SUSPICIOUS_MONITOR">SUSPICIOUS (Place account on elevated monitoring)</option>
                <option value="INCONCLUSIVE">INCONCLUSIVE (Insufficient evidence to verify)</option>
              </select>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                * A human decision is recorded separately from model statistical risk estimates.
              </span>
            </div>

            <div>
              <label className="trace-label">Investigation Evidence &amp; Findings Notes</label>
              <textarea
                required
                rows={4}
                value={findings}
                onChange={(e) => setFindings(e.target.value)}
                className="trace-textarea"
                placeholder="Detail customer contact verification, IP geolocation anomalies, device fingerprint mismatches, or merchant chargeback reports..."
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
              <button
                type="button"
                className="btn-outline"
                onClick={() => setInvestigateModalOpen(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Recording...' : 'Commit Finding to Audit Log'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
