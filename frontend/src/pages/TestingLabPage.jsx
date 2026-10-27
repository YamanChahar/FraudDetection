import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FlaskConical,
  ShieldAlert,
  ShieldCheck,
  Zap,
  RotateCcw,
  Sliders,
  Info,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import RiskBadge from '../components/common/RiskBadge';
import { submitTransactionAnalysis } from '../services/transactionApi';
import { getRecommendation } from '../utils/riskScoring';

const PRESETS = [
  {
    label: 'Typical Retail Purchase (Low Risk)',
    description: 'Everyday grocery transaction with normal PCA parameters',
    data: {
      amount: 42.50,
      currency: 'USD',
      channel: 'POS',
      merchantName: 'Metro Supermarket',
      merchantCategory: 'Groceries',
      customerEmail: 'alex.morgan@email.com',
      V1: 0.85,
      V2: -0.12,
      V3: 0.45,
      V4: -0.32,
      V14: 0.15,
      V12: 0.22,
      V10: 0.08,
      V17: 0.05,
    },
  },
  {
    label: 'Online Electronics Order (Medium Risk)',
    description: 'Moderate transaction value with mild feature deviations',
    data: {
      amount: 489.00,
      currency: 'USD',
      channel: 'ONLINE',
      merchantName: 'Global Cyber Gadgets',
      merchantCategory: 'Electronics',
      customerEmail: 'j.smith992@webmail.org',
      V1: -1.2,
      V2: 0.95,
      V3: -0.65,
      V4: 1.45,
      V14: -2.1,
      V12: -1.8,
      V10: -1.2,
      V17: -1.5,
    },
  },
  {
    label: 'High-Velocity Card-Not-Present Anomaly (Critical Risk)',
    description: 'High-value transaction displaying extreme V14, V12, and V10 divergence',
    data: {
      amount: 2850.00,
      currency: 'USD',
      channel: 'ONLINE',
      merchantName: 'Apex Luxury Timepieces',
      merchantCategory: 'Jewelry & Watches',
      customerEmail: 'fast_buyer_x@tempmail.io',
      V1: -4.39,
      V2: 1.35,
      V3: -2.59,
      V4: 4.80,
      V14: -8.77,
      V12: -6.91,
      V10: -5.80,
      V17: -7.50,
    },
  },
];

export default function TestingLabPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    externalTransactionId: `TX-${Date.now().toString().slice(-6)}`,
    amount: 125.00,
    currency: 'USD',
    channel: 'ONLINE',
    merchantName: 'Nordic Outfitters',
    merchantCategory: 'Apparel',
    customerEmail: 'customer@trace.io',
    // Key model PCA features
    V1: 0.0,
    V2: 0.0,
    V3: 0.0,
    V4: 0.0,
    V10: 0.0,
    V12: 0.0,
    V14: 0.0,
    V17: 0.0,
  });

  const [showAdvancedPca, setShowAdvancedPca] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? '' : parseFloat(value)) : value,
    }));
  };

  const handleApplyPreset = (preset) => {
    setForm((prev) => ({
      ...prev,
      ...preset.data,
      externalTransactionId: `TX-${Date.now().toString().slice(-6)}`,
    }));
    setResult(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        externalTransactionId: form.externalTransactionId,
        amount: Number(form.amount),
        currency: form.currency,
        channel: form.channel,
        merchant: {
          name: form.merchantName,
          category: form.merchantCategory,
        },
        customer: {
          email: form.customerEmail,
        },
        // Benchmark features passed directly or in metadata
        Time: Date.now() % 172800,
        V1: Number(form.V1 || 0),
        V2: Number(form.V2 || 0),
        V3: Number(form.V3 || 0),
        V4: Number(form.V4 || 0),
        V10: Number(form.V10 || 0),
        V12: Number(form.V12 || 0),
        V14: Number(form.V14 || 0),
        V17: Number(form.V17 || 0),
      };

      const res = await submitTransactionAnalysis(payload);
      if (res.success && res.data) {
        setResult(res.data);
      } else {
        throw new Error(res.error?.message || 'Transaction processing failed');
      }
    } catch (err) {
      setError(err.message || 'Transaction risk evaluation failed');
    } finally {
      setLoading(false);
    }
  };

  const prediction = result?.prediction;
  const alert = result?.alert;
  const shap = prediction?.explanationData;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Title & Introduction */}
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: '4px' }}>
          Fraud Testing Lab
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          Submit real-time transaction inputs for machine learning inference, statistical risk scoring, and SHAP feature attribution.
        </p>
      </div>

      {/* Preset Profiles */}
      <div className="trace-card" style={{ padding: '18px 24px' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.06em', marginBottom: '12px' }}>
          Quick Benchmark Scenarios
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
          {PRESETS.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleApplyPreset(p)}
              style={{
                textAlign: 'left',
                padding: '12px 14px',
                backgroundColor: 'var(--surface-subtle)',
                border: '1px solid var(--border-stone)',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 120ms ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent-terracotta)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-stone)';
              }}
            >
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '3px' }}>
                {p.label}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {p.description}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Two Column Workspace: Form on Left, Risk Output on Right */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: '24px' }}>
        {/* Form Container */}
        <div className="trace-card" style={{ padding: '26px' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-stone)', paddingBottom: '12px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Transaction Parameters
              </h2>
              <span className="tabular-nums" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                ID: {form.externalTransactionId}
              </span>
            </div>

            {error && (
              <div style={{ padding: '12px', backgroundColor: '#FBEBE8', border: '1px solid #F3BEB5', borderRadius: '4px', color: '#A83824', fontSize: '13px' }}>
                {error}
              </div>
            )}

            {/* Core Fields */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '14px' }}>
              <div>
                <label className="trace-label">Transaction Amount</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  name="amount"
                  required
                  value={form.amount}
                  onChange={handleInputChange}
                  className="trace-input tabular-nums"
                  placeholder="e.g. 150.00"
                />
              </div>

              <div>
                <label className="trace-label">Currency</label>
                <select name="currency" value={form.currency} onChange={handleInputChange} className="trace-select">
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label className="trace-label">Payment Channel</label>
                <select name="channel" value={form.channel} onChange={handleInputChange} className="trace-select">
                  <option value="ONLINE">Online / E-Commerce</option>
                  <option value="POS">In-Store Point of Sale</option>
                  <option value="MOBILE">Mobile In-App</option>
                  <option value="ATM">ATM Terminal</option>
                </select>
              </div>

              <div>
                <label className="trace-label">Customer Email</label>
                <input
                  type="email"
                  name="customerEmail"
                  value={form.customerEmail}
                  onChange={handleInputChange}
                  className="trace-input"
                  placeholder="user@domain.com"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label className="trace-label">Merchant Name</label>
                <input
                  type="text"
                  name="merchantName"
                  value={form.merchantName}
                  onChange={handleInputChange}
                  className="trace-input"
                  placeholder="e.g. Acme Corp"
                />
              </div>

              <div>
                <label className="trace-label">Merchant Category</label>
                <input
                  type="text"
                  name="merchantCategory"
                  value={form.merchantCategory}
                  onChange={handleInputChange}
                  className="trace-input"
                  placeholder="e.g. Electronics, Retail"
                />
              </div>
            </div>

            {/* Advanced PCA Vectors Accordion */}
            <div style={{ borderTop: '1px solid var(--border-stone)', paddingTop: '14px' }}>
              <button
                type="button"
                onClick={() => setShowAdvancedPca(!showAdvancedPca)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: 0,
                }}
              >
                <Sliders size={14} />
                {showAdvancedPca ? 'Hide Benchmark Latent Features (V1–V28)' : 'Show Benchmark Latent Features (V1–V28)'}
              </button>

              {showAdvancedPca && (
                <div style={{ marginTop: '14px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                  {['V1', 'V2', 'V3', 'V4', 'V10', 'V12', 'V14', 'V17'].map((feat) => (
                    <div key={feat}>
                      <label style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)' }}>{feat}</label>
                      <input
                        type="number"
                        step="0.01"
                        name={feat}
                        value={form[feat]}
                        onChange={handleInputChange}
                        className="trace-input tabular-nums"
                        style={{ padding: '6px 8px', fontSize: '12px' }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Action */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{
                width: '100%',
                justifyContent: 'center',
                padding: '12px',
                marginTop: '8px',
                fontSize: '14px',
              }}
            >
              {loading ? (
                <>Evaluating ML Risk Model...</>
              ) : (
                <>
                  <Zap size={16} />
                  Analyze Transaction Risk
                </>
              )}
            </button>
          </form>
        </div>

        {/* Prediction Results Container */}
        <div className="trace-card" style={{ padding: '26px' }}>
          <div style={{ borderBottom: '1px solid var(--border-stone)', paddingBottom: '12px', marginBottom: '18px' }}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Real-Time Inference Output
            </h2>
          </div>

          {!result ? (
            <div style={{ padding: '60px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <FlaskConical size={36} color="var(--border-stone)" style={{ margin: '0 auto 12px auto' }} />
              <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-secondary)' }}>
                No active prediction
              </p>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', maxWidth: '320px', margin: '4px auto 0 auto' }}>
                Fill in transaction details or select a quick benchmark scenario, then click Analyze.
              </p>
            </div>
          ) : (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Score Banner */}
              <div
                style={{
                  padding: '20px',
                  backgroundColor: 'var(--surface-subtle)',
                  borderRadius: '6px',
                  border: '1px solid var(--border-stone)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.06em' }}>
                    Normalized Risk Score
                  </span>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginTop: '2px' }}>
                    <span className="tabular-nums" style={{ fontSize: '38px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
                      {prediction.riskScore}
                    </span>
                    <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 600 }}>
                      / 100
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                  <RiskBadge level={prediction.riskLevel} score={prediction.riskScore} />
                  <span className="tabular-nums" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    Prob: {(prediction.fraudProbability * 100).toFixed(2)}%
                  </span>
                </div>
              </div>

              {/* Recommendation Box */}
              {(() => {
                const rec = getRecommendation(prediction.riskScore);
                return (
                  <div
                    style={{
                      padding: '14px 16px',
                      backgroundColor: 'var(--surface-card)',
                      border: `1px solid ${rec.color}40`,
                      borderRadius: '6px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: rec.color, fontWeight: 700, fontSize: '13px', marginBottom: '4px' }}>
                      <ShieldCheck size={16} />
                      {rec.title}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {rec.desc}
                    </div>
                  </div>
                );
              })()}

              {/* True SHAP Attribution Section */}
              {shap && (
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.04em' }}>
                      SHAP Feature Attribution
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Inference: {prediction.latencyMs}ms
                    </span>
                  </div>

                  {shap.explanation_summary && (
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '14px', padding: '10px 12px', backgroundColor: 'var(--surface-subtle)', borderRadius: '4px' }}>
                      {shap.explanation_summary}
                    </p>
                  )}

                  {/* Feature Contribution Bars */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {shap.top_contributing_features?.slice(0, 5).map((feat, idx) => {
                      const isRisk = feat.direction === 'INCREASES_RISK';
                      return (
                        <div
                          key={idx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '6px 10px',
                            backgroundColor: 'var(--surface-subtle)',
                            borderRadius: '4px',
                            fontSize: '12px',
                          }}
                        >
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            {feat.feature} ({feat.raw_value.toFixed(2)})
                          </span>
                          <span
                            className="tabular-nums"
                            style={{
                              fontWeight: 700,
                              color: isRisk ? 'var(--status-high-fg)' : 'var(--status-low-fg)',
                            }}
                          >
                            {isRisk ? '+' : ''}{feat.shap_value.toFixed(3)} {isRisk ? '▲' : '▼'}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '10px', fontStyle: 'italic' }}>
                    {shap.disclaimer}
                  </p>
                </div>
              )}

              {/* Alert Notification if Generated */}
              {alert && (
                <div
                  style={{
                    padding: '12px 14px',
                    backgroundColor: '#FBEBE8',
                    border: '1px solid #F3BEB5',
                    borderRadius: '5px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#A83824', fontSize: '12px', fontWeight: 600 }}>
                    <ShieldAlert size={16} />
                    <span>Fraud Alert Automatically Created ({alert.severity})</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('/alerts')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#A83824',
                      cursor: 'pointer',
                      fontSize: '11px',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    View Alert <ArrowRight size={12} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
