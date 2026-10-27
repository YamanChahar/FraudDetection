import { RefreshCw, CheckCircle2, AlertCircle, Layers, Server, Cpu, Database } from 'lucide-react';
import { useBackendHealth } from '../hooks/useBackendHealth';

export default function LandingPage() {
  const { health, loading, error, refetch } = useBackendHealth();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Intro Banner */}
      <div className="trace-card" style={{ padding: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <span className="badge-low" style={{ marginBottom: '12px', display: 'inline-block' }}>
              Phase 1 Foundation Active
            </span>
            <h2 style={{ fontSize: '24px', fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--text-primary)', marginBottom: '8px' }}>
              Transaction Risk &amp; Fraud Analysis Platform
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', maxWidth: '720px' }}>
              TRACE establishes a high-assurance, multi-tier system engineered for real-time transaction scoring, 
              probabilistic risk categorization, and audit-compliant case investigation.
            </p>
          </div>

          <button onClick={refetch} className="btn-secondary" disabled={loading} style={{ alignSelf: 'flex-start' }}>
            <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            Check System Health
          </button>
        </div>
      </div>

      {/* Services Health Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
        {/* Frontend Tier */}
        <div className="trace-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Layers size={18} color="var(--accent-terracotta)" />
              <h3 style={{ fontSize: '15px', fontWeight: 600 }}>Frontend Client</h3>
            </div>
            <span className="badge-low">OPERATIONAL</span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            React.js + Vite application running on port 5173.
          </p>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Stack: React 19 &bull; Vite &bull; React Router &bull; Axios
          </div>
        </div>

        {/* Backend Tier */}
        <div className="trace-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Server size={18} color="var(--accent-terracotta)" />
              <h3 style={{ fontSize: '15px', fontWeight: 600 }}>Node.js API Gateway</h3>
            </div>
            {loading ? (
              <span className="badge-neutral">CHECKING...</span>
            ) : health ? (
              <span className="badge-low">CONNECTED</span>
            ) : (
              <span className="badge-high">OFFLINE</span>
            )}
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Express gateway orchestrating authentication, validation, and storage.
          </p>
          {health ? (
            <div style={{ fontSize: '12px', color: 'var(--status-low-fg)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CheckCircle2 size={14} />
              <span>Status: {health.status} ({health.service || 'trace-api'})</span>
            </div>
          ) : error ? (
            <div style={{ fontSize: '12px', color: 'var(--status-high-fg)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <AlertCircle size={14} />
              <span>{error.message || 'Cannot reach port 4000'}</span>
            </div>
          ) : (
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Checking port 4000...
            </div>
          )}
        </div>

        {/* Machine Learning Tier */}
        <div className="trace-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Cpu size={18} color="var(--accent-terracotta)" />
              <h3 style={{ fontSize: '15px', fontWeight: 600 }}>Python ML Service</h3>
            </div>
            <span className="badge-neutral">STANDALONE</span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            FastAPI microservice hosting Scikit-learn, XGBoost &amp; SHAP.
          </p>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Status: Port 8000 &bull; Model Not Initialized (Phase 1)
          </div>
        </div>

        {/* Database Tier */}
        <div className="trace-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Database size={18} color="var(--accent-terracotta)" />
              <h3 style={{ fontSize: '15px', fontWeight: 600 }}>PostgreSQL / Prisma</h3>
            </div>
            <span className="badge-neutral">CONFIGURED</span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Relational storage managed through Prisma ORM datasource.
          </p>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Schema deployment scheduled for Phase 2.
          </div>
        </div>
      </div>

      {/* Strict Phase 1 Notice */}
      <div className="trace-card" style={{ padding: '24px', backgroundColor: 'var(--surface-subtle)' }}>
        <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
          Phase 1 Boundary Notice
        </h4>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          This is an infrastructure and tooling foundation phase. In accordance with strict development boundaries,
          fraud prediction algorithms, live transaction scoring, and analytics dashboards are deliberately deferred
          until subsequent implementation phases. No dummy metrics or synthetic statistics are generated.
        </p>
      </div>
    </div>
  );
}
