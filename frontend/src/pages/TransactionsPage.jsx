import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  Filter,
  RefreshCw,
  ExternalLink,
  Receipt,
  User,
  CreditCard,
  Zap,
} from 'lucide-react';
import DataTable from '../components/common/DataTable';
import RiskBadge from '../components/common/RiskBadge';
import { Drawer } from '../components/common/Modal';
import { fetchTransactions, fetchTransactionById } from '../services/transactionApi';

export default function TransactionsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialRisk = searchParams.get('riskLevel') || '';

  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, totalRecords: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters state
  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState(initialRisk);
  const [channelFilter, setChannelFilter] = useState('');

  // Selected Transaction for Drawer Inspection
  const [selectedTx, setSelectedTx] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerLoading, setDrawerLoading] = useState(false);

  const loadTransactions = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        limit: 15,
      };
      if (search.trim()) params.search = search.trim();
      if (channelFilter) params.channel = channelFilter;
      if (riskFilter) params.riskLevel = riskFilter;

      const res = await fetchTransactions(params);
      if (res.success && res.data) {
        let items = res.data;
        // Client-side fallback filter for risk level if populated
        if (riskFilter) {
          items = items.filter((item) => (item.riskLevel || '').toUpperCase() === riskFilter.toUpperCase());
        }
        setTransactions(items);
        if (res.meta?.pagination) {
          setPagination(res.meta.pagination);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load transaction records');
    } finally {
      setLoading(false);
    }
  }, [search, channelFilter, riskFilter]);

  useEffect(() => {
    loadTransactions(1);
  }, [loadTransactions]);

  const handleInspect = async (tx) => {
    setDrawerOpen(true);
    setDrawerLoading(true);
    try {
      const res = await fetchTransactionById(tx.id || tx._id);
      if (res.success && res.data) {
        setSelectedTx(res.data);
      } else {
        setSelectedTx(tx);
      }
    } catch {
      setSelectedTx(tx);
    } finally {
      setDrawerLoading(false);
    }
  };

  const columns = [
    {
      label: 'Transaction ID',
      key: 'externalTransactionId',
      render: (val, row) => (
        <div>
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
            {val || row.id?.slice(-8) || 'N/A'}
          </span>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            {row.channel || 'ONLINE'}
          </div>
        </div>
      ),
    },
    {
      label: 'Timestamp',
      key: 'transactionTimestamp',
      render: (val) => (
        <span className="tabular-nums" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
          {val ? new Date(val).toLocaleString() : '—'}
        </span>
      ),
    },
    {
      label: 'Customer / Merchant',
      key: 'customer',
      render: (val, row) => (
        <div>
          <div style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
            {row.merchant?.name || 'Standard Merchant'}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            {row.customer?.email || 'N/A'}
          </div>
        </div>
      ),
    },
    {
      label: 'Amount',
      key: 'amount',
      render: (val, row) => (
        <span className="tabular-nums" style={{ fontWeight: 700, fontSize: '13px' }}>
          ${typeof val === 'number' ? val.toFixed(2) : parseFloat(val || 0).toFixed(2)} {row.currency || 'USD'}
        </span>
      ),
    },
    {
      label: 'Fraud Risk',
      key: 'riskLevel',
      render: (val, row) => (
        <RiskBadge level={val || 'LOW'} score={row.riskScore} size="sm" />
      ),
    },
    {
      label: 'Action',
      key: 'actions',
      align: 'right',
      render: (_, row) => (
        <button
          type="button"
          className="btn-outline"
          style={{ padding: '4px 10px', fontSize: '11px' }}
          onClick={(e) => {
            e.stopPropagation();
            handleInspect(row);
          }}
        >
          Inspect <ExternalLink size={12} />
        </button>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Title */}
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: '4px' }}>
          Transaction Explorer
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          Search, filter, and audit processed financial transactions with deep machine learning explanations.
        </p>
      </div>

      {/* Filter / Search Bar */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '240px' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '360px' }}>
            <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '10px', top: '10px' }} />
            <input
              type="text"
              placeholder="Search by ID, email, or merchant..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="trace-input"
              style={{ paddingLeft: '32px', fontSize: '13px' }}
            />
          </div>

          <select
            value={riskFilter}
            onChange={(e) => {
              setRiskFilter(e.target.value);
              setSearchParams(e.target.value ? { riskLevel: e.target.value } : {});
            }}
            className="trace-select"
            style={{ width: '160px', fontSize: '13px' }}
          >
            <option value="">All Risk Levels</option>
            <option value="LOW">Low Risk</option>
            <option value="MEDIUM">Medium Risk</option>
            <option value="HIGH">High Risk</option>
            <option value="CRITICAL">Critical Risk</option>
          </select>

          <select
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value)}
            className="trace-select"
            style={{ width: '150px', fontSize: '13px' }}
          >
            <option value="">All Channels</option>
            <option value="ONLINE">Online</option>
            <option value="POS">In-Store POS</option>
            <option value="MOBILE">Mobile</option>
            <option value="ATM">ATM</option>
          </select>
        </div>

        <button
          type="button"
          className="btn-outline"
          onClick={() => loadTransactions(1)}
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

      {/* Transactions Data Table */}
      <DataTable
        columns={columns}
        data={transactions}
        loading={loading}
        emptyMessage="No transactions found matching specified criteria"
        onRowClick={handleInspect}
        pagination={{
          currentPage: pagination.page,
          totalPages: pagination.totalPages,
          totalItems: pagination.totalRecords,
          pageSize: pagination.limit,
          onPageChange: (newPage) => loadTransactions(newPage),
        }}
      />

      {/* Slide-out Inspection Drawer */}
      <Drawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={selectedTx ? `Transaction ${selectedTx.externalTransactionId || selectedTx.id}` : 'Transaction Details'}
        width="560px"
      >
        {drawerLoading || !selectedTx ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading audit details...
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
            {/* Summary Score Card */}
            <div
              style={{
                padding: '16px',
                backgroundColor: 'var(--surface-subtle)',
                border: '1px solid var(--border-stone)',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                  Evaluated Risk Score
                </span>
                <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1, marginTop: '2px' }}>
                  {selectedTx.riskScore ?? selectedTx.detailedPrediction?.riskScore ?? '—'}
                  <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)' }}> / 100</span>
                </div>
              </div>
              <RiskBadge
                level={selectedTx.riskLevel || selectedTx.detailedPrediction?.riskLevel || 'LOW'}
                score={selectedTx.riskScore}
              />
            </div>

            {/* Financial Parameters */}
            <div>
              <h3 style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                Financial Attributes
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '13px' }}>
                <div style={{ padding: '8px 12px', backgroundColor: 'var(--surface-subtle)', borderRadius: '4px' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block' }}>Amount</span>
                  <strong className="tabular-nums">${selectedTx.amount?.toFixed(2)} {selectedTx.currency}</strong>
                </div>
                <div style={{ padding: '8px 12px', backgroundColor: 'var(--surface-subtle)', borderRadius: '4px' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block' }}>Channel</span>
                  <strong>{selectedTx.channel || 'ONLINE'}</strong>
                </div>
                <div style={{ padding: '8px 12px', backgroundColor: 'var(--surface-subtle)', borderRadius: '4px' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block' }}>Merchant</span>
                  <strong>{selectedTx.merchant?.name || 'N/A'}</strong>
                </div>
                <div style={{ padding: '8px 12px', backgroundColor: 'var(--surface-subtle)', borderRadius: '4px' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: '11px', display: 'block' }}>Customer</span>
                  <strong>{selectedTx.customer?.email || 'N/A'}</strong>
                </div>
              </div>
            </div>

            {/* Detailed Prediction & SHAP Breakdown */}
            {selectedTx.detailedPrediction && (
              <div>
                <h3 style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                  Model Explainability (SHAP)
                </h3>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                  Model: {selectedTx.detailedPrediction.modelVersionId?.name || 'Champion Model'} &bull; Latency: {selectedTx.detailedPrediction.latencyMs || 10}ms
                </div>

                {selectedTx.detailedPrediction.explanationData?.explanation_summary && (
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', backgroundColor: 'var(--surface-subtle)', padding: '10px', borderRadius: '4px', lineHeight: 1.5, marginBottom: '12px' }}>
                    {selectedTx.detailedPrediction.explanationData.explanation_summary}
                  </p>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {selectedTx.detailedPrediction.explanationData?.top_contributing_features?.map((f, i) => {
                    const isRisk = f.direction === 'INCREASES_RISK';
                    return (
                      <div
                        key={i}
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
                        <span style={{ fontWeight: 600 }}>
                          {f.feature} ({f.raw_value.toFixed(2)})
                        </span>
                        <span
                          className="tabular-nums"
                          style={{
                            fontWeight: 700,
                            color: isRisk ? 'var(--status-high-fg)' : 'var(--status-low-fg)',
                          }}
                        >
                          {isRisk ? '+' : ''}{f.shap_value.toFixed(3)} {isRisk ? '▲' : '▼'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}
