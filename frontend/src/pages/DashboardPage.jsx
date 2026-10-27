import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  Flame,
  ShieldCheck,
  Search,
  RefreshCw,
  ArrowUpRight,
  Clock,
  Layers,
} from 'lucide-react';
import MetricCard from '../components/common/MetricCard';
import RiskBadge from '../components/common/RiskBadge';
import StatusBadge from '../components/common/StatusBadge';
import { EmptyState, Skeleton } from '../components/common/EmptyState';
import { fetchDashboardOverview } from '../services/dashboardApi';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchDashboardOverview();
      if (res.success && res.data) {
        setData(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch dashboard metrics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const metrics = data?.metrics || {
    totalTransactions: 0,
    highRiskTransactions: 0,
    criticalRiskTransactions: 0,
    totalAlerts: 0,
    openAlerts: 0,
    pendingInvestigations: 0,
  };

  const riskDistribution = data?.riskDistribution || [];
  const recentSuspicious = data?.recentSuspicious || [];
  const recentAlerts = data?.recentAlerts || [];
  const volumeOverTime = data?.volumeOverTime || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Page Header / Action Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '24px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
              marginBottom: '4px',
            }}
          >
            Real-Time Fraud Risk Intelligence
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            System-wide transaction scoring overview, anomaly telemetry, and active investigation pipeline.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            className="btn-outline"
            onClick={loadData}
            disabled={loading}
          >
            <RefreshCw
              size={14}
              style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }}
            />
            Refresh Telemetry
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={() => navigate('/testing-lab')}
          >
            <Activity size={15} />
            Test Transaction
          </button>
        </div>
      </div>

      {/* Error Notice */}
      {error && (
        <div
          style={{
            padding: '14px 18px',
            backgroundColor: '#FBEBE8',
            border: '1px solid #F3BEB5',
            borderRadius: '6px',
            color: '#A83824',
            fontSize: '13px',
          }}
        >
          {error}
        </div>
      )}

      {/* 5 Primary Financial Risk KPIs */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
        }}
      >
        <MetricCard
          title="Total Transactions"
          value={loading ? <Skeleton width="80px" height="32px" /> : metrics.totalTransactions}
          subtext="Processed by risk engine"
          icon={Layers}
          onClick={() => navigate('/transactions')}
        />
        <MetricCard
          title="High Risk (71–89)"
          value={loading ? <Skeleton width="80px" height="32px" /> : metrics.highRiskTransactions}
          subtext="Require senior analyst review"
          icon={AlertTriangle}
          variant="highlight"
          onClick={() => navigate('/transactions?riskLevel=HIGH')}
        />
        <MetricCard
          title="Critical Risk (90+)"
          value={loading ? <Skeleton width="80px" height="32px" /> : metrics.criticalRiskTransactions}
          subtext="Immediate investigation flagged"
          icon={Flame}
          variant="alert"
          onClick={() => navigate('/transactions?riskLevel=CRITICAL')}
        />
        <MetricCard
          title="Open Fraud Alerts"
          value={loading ? <Skeleton width="80px" height="32px" /> : metrics.openAlerts}
          subtext={`${metrics.totalAlerts} total alerts generated`}
          icon={Clock}
          variant="alert"
          onClick={() => navigate('/alerts')}
        />
        <MetricCard
          title="Pending Inquiries"
          value={loading ? <Skeleton width="80px" height="32px" /> : metrics.pendingInvestigations}
          subtext="Cases under active review"
          icon={Search}
          onClick={() => navigate('/alerts?status=IN_REVIEW')}
        />
      </div>

      {/* Analytics Visualizations Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
          gap: '20px',
        }}
      >
        {/* Risk Category Distribution */}
        <div className="trace-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Risk Classification Distribution
            </h2>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Historical Predictions</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {riskDistribution.map((item) => {
              let barColor = 'var(--status-low-fg)';
              if (item.level === 'MEDIUM') barColor = 'var(--status-med-fg)';
              if (item.level === 'HIGH') barColor = 'var(--status-high-fg)';
              if (item.level === 'CRITICAL') barColor = '#74170E';

              return (
                <div key={item.level}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      <RiskBadge level={item.level} size="sm" showIcon={false} />
                    </span>
                    <span className="tabular-nums" style={{ color: 'var(--text-secondary)' }}>
                      <strong>{item.count}</strong> records ({item.percentage}%)
                    </span>
                  </div>
                  <div
                    style={{
                      height: '8px',
                      backgroundColor: 'var(--surface-subtle)',
                      borderRadius: '4px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${item.percentage}%`,
                        backgroundColor: barColor,
                        borderRadius: '4px',
                        transition: 'width 0.4s ease',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Transaction Volume Over Time */}
        <div className="trace-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Transaction Intake Volume
            </h2>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Last 14 Days</span>
          </div>

          {volumeOverTime.length === 0 ? (
            <div style={{ padding: '36px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
              No transactional ingestion history recorded in the current timeframe.
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '140px', paddingTop: '20px' }}>
              {volumeOverTime.map((v) => {
                const maxVol = Math.max(...volumeOverTime.map((item) => item.transactions), 1);
                const heightPct = Math.max((v.transactions / maxVol) * 100, 10);

                return (
                  <div
                    key={v.date}
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '6px',
                      height: '100%',
                      justifyContent: 'flex-end',
                    }}
                  >
                    <span className="tabular-nums" style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                      {v.transactions}
                    </span>
                    <div
                      style={{
                        width: '100%',
                        height: `${heightPct}%`,
                        backgroundColor: 'var(--accent-terracotta)',
                        borderRadius: '3px 3px 0 0',
                        opacity: 0.85,
                      }}
                    />
                    <span
                      style={{
                        fontSize: '9px',
                        color: 'var(--text-muted)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: '36px',
                      }}
                    >
                      {v.date.slice(5)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Two-Column Grid: Recent Suspicious Transactions & Recent Fraud Alerts */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
          gap: '20px',
        }}
      >
        {/* Recent High/Critical Transactions */}
        <div className="trace-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Recent Suspicious Transactions
            </h2>
            <button
              type="button"
              className="btn-outline"
              style={{ padding: '4px 10px', fontSize: '11px' }}
              onClick={() => navigate('/transactions?riskLevel=HIGH')}
            >
              View All <ArrowUpRight size={12} />
            </button>
          </div>

          {recentSuspicious.length === 0 ? (
            <EmptyState
              title="No suspicious transactions"
              description="No high or critical risk anomalies currently flagged by the ML pipeline."
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {recentSuspicious.map((tx) => (
                <div
                  key={tx.transactionId}
                  onClick={() => navigate(`/transactions`)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    backgroundColor: 'var(--surface-subtle)',
                    borderRadius: '5px',
                    border: '1px solid var(--border-stone)',
                    cursor: 'pointer',
                    transition: 'border-color 120ms ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--accent-terracotta)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-stone)';
                  }}
                >
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {tx.externalTransactionId}
                    </div>
                    <div className="tabular-nums" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      ${tx.amount.toFixed(2)} {tx.currency} &bull;{' '}
                      {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <RiskBadge level={tx.riskLevel} score={tx.riskScore} size="sm" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Fraud Alerts */}
        <div className="trace-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Recent Alert Inquiries
            </h2>
            <button
              type="button"
              className="btn-outline"
              style={{ padding: '4px 10px', fontSize: '11px' }}
              onClick={() => navigate('/alerts')}
            >
              View All <ArrowUpRight size={12} />
            </button>
          </div>

          {recentAlerts.length === 0 ? (
            <EmptyState
              title="No active fraud alerts"
              description="No investigation cases have been triggered by the configured risk policies."
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {recentAlerts.map((alert) => (
                <div
                  key={alert.id}
                  onClick={() => navigate('/alerts')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    backgroundColor: 'var(--surface-subtle)',
                    borderRadius: '5px',
                    border: '1px solid var(--border-stone)',
                    cursor: 'pointer',
                    transition: 'border-color 120ms ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--accent-terracotta)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-stone)';
                  }}
                >
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {alert.description}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                      Assigned: {alert.assignedTo || 'Unassigned'} &bull;{' '}
                      {new Date(alert.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <StatusBadge status={alert.status} size="sm" />
                    <RiskBadge level={alert.severity} size="sm" showIcon={false} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
