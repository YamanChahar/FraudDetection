import React, { useState, useEffect, useCallback } from 'react';
import {
  Settings,
  User as UserIcon,
  Shield,
  Sliders,
  Users,
  FileText,
  CheckCircle2,
  Lock,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import DataTable from '../components/common/DataTable';
import { fetchAdminUsers, updateUserRole, fetchAuditLogs } from '../services/adminApi';

export default function SettingsPage() {
  const { user } = useAuth();
  const isAdmin = (user?.role || '').toUpperCase() === 'ADMIN';
  const isLeadOrAdmin = ['LEAD', 'ADMIN'].includes((user?.role || '').toUpperCase());

  const [usersList, setUsersList] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [actionSuccess, setActionSuccess] = useState(null);
  const [actionError, setActionError] = useState(null);

  const loadAdminData = useCallback(async () => {
    if (isAdmin) {
      setLoadingUsers(true);
      try {
        const res = await fetchAdminUsers();
        if (res.success && res.data) setUsersList(res.data);
      } catch (err) {
        console.warn('Unable to load users:', err.message);
      } finally {
        setLoadingUsers(false);
      }
    }

    if (isLeadOrAdmin) {
      setLoadingLogs(true);
      try {
        const res = await fetchAuditLogs(25);
        if (res.success && res.data) setAuditLogs(res.data);
      } catch (err) {
        console.warn('Unable to load audit logs:', err.message);
      } finally {
        setLoadingLogs(false);
      }
    }
  }, [isAdmin, isLeadOrAdmin]);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  const handleRoleChange = async (targetUserId, newRole) => {
    setActionSuccess(null);
    setActionError(null);
    try {
      await updateUserRole(targetUserId, newRole);
      setActionSuccess(`User role updated to ${newRole}`);
      loadAdminData();
    } catch (err) {
      setActionError(err.message || 'Failed to update user role');
    }
  };

  const userColumns = [
    {
      label: 'User Name / Email',
      key: 'name',
      render: (val, row) => (
        <div>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{val || 'Risk Analyst'}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{row.email}</div>
        </div>
      ),
    },
    {
      label: 'Current Role',
      key: 'role',
      render: (val) => (
        <span
          style={{
            fontSize: '11px',
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: '4px',
            backgroundColor: val === 'ADMIN' ? 'rgba(168, 56, 36, 0.12)' : 'var(--surface-subtle)',
            color: val === 'ADMIN' ? 'var(--status-high-fg)' : 'var(--text-secondary)',
          }}
        >
          {val}
        </span>
      ),
    },
    {
      label: 'Change Role',
      key: 'actions',
      align: 'right',
      render: (_, row) => (
        <select
          value={row.role}
          onChange={(e) => handleRoleChange(row.id, e.target.value)}
          className="trace-select"
          style={{ width: '130px', padding: '4px 8px', fontSize: '11px' }}
          disabled={row.email === user?.email}
        >
          <option value="ANALYST">ANALYST</option>
          <option value="INVESTIGATOR">INVESTIGATOR</option>
          <option value="LEAD">LEAD</option>
          <option value="ADMIN">ADMIN</option>
        </select>
      ),
    },
  ];

  const auditColumns = [
    {
      label: 'Action',
      key: 'action',
      render: (val) => (
        <span style={{ fontWeight: 600, fontSize: '12px', color: 'var(--text-primary)' }}>
          {val}
        </span>
      ),
    },
    {
      label: 'Actor',
      key: 'actor',
      render: (val) => (
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
          {val ? `${val.name} (${val.role})` : 'System Daemon'}
        </span>
      ),
    },
    {
      label: 'Entity',
      key: 'entityType',
      render: (val, row) => (
        <span className="tabular-nums" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          {val} &bull; {row.entityId ? row.entityId.slice(-6) : '—'}
        </span>
      ),
    },
    {
      label: 'Timestamp',
      key: 'createdAt',
      align: 'right',
      render: (val) => (
        <span className="tabular-nums" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          {new Date(val).toLocaleString()}
        </span>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Title */}
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: '4px' }}>
          Settings &amp; Platform Governance
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          User profiles, risk threshold configurations, security policies, and immutable system audit trail.
        </p>
      </div>

      {actionSuccess && (
        <div style={{ padding: '12px', backgroundColor: '#EEF5F0', border: '1px solid #C6DEC9', borderRadius: '4px', color: 'var(--status-low-fg)', fontSize: '13px' }}>
          {actionSuccess}
        </div>
      )}

      {actionError && (
        <div style={{ padding: '12px', backgroundColor: '#FBEBE8', border: '1px solid #F3BEB5', borderRadius: '4px', color: '#A83824', fontSize: '13px' }}>
          {actionError}
        </div>
      )}

      {/* Profile & Security Policy Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
        {/* User Profile Card */}
        <div className="trace-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px', borderBottom: '1px solid var(--border-stone)', paddingBottom: '14px' }}>
            <div style={{ padding: '10px', backgroundColor: 'var(--surface-subtle)', borderRadius: '50%', color: 'var(--accent-terracotta)' }}>
              <UserIcon size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                {user?.name || user?.email || 'Risk Analyst'}
              </h2>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{user?.email}</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', backgroundColor: 'var(--surface-subtle)', borderRadius: '4px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Assigned Role:</span>
              <strong style={{ color: 'var(--accent-terracotta)' }}>{user?.role}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', backgroundColor: 'var(--surface-subtle)', borderRadius: '4px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Account Status:</span>
              <span className="badge-low">ACTIVE &bull; VERIFIED</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', backgroundColor: 'var(--surface-subtle)', borderRadius: '4px' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Token Lifespan:</span>
              <span className="tabular-nums" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>15 Minutes (Rotating)</span>
            </div>
          </div>
        </div>

        {/* Established Risk Policy Card */}
        <div className="trace-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px', borderBottom: '1px solid var(--border-stone)', paddingBottom: '14px' }}>
            <Sliders size={18} color="var(--accent-terracotta)" />
            <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Centralized Risk Engine Policy
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', backgroundColor: 'var(--status-low-bg)', border: '1px solid var(--status-low-border)', borderRadius: '4px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--status-low-fg)' }}>LOW RISK</span>
              <span className="tabular-nums" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--status-low-fg)' }}>0 – 30 pts (Auto-Approve)</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', backgroundColor: 'var(--status-med-bg)', border: '1px solid var(--status-med-border)', borderRadius: '4px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--status-med-fg)' }}>MEDIUM RISK</span>
              <span className="tabular-nums" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--status-med-fg)' }}>31 – 70 pts (Step-Up Auth)</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', backgroundColor: 'var(--status-high-bg)', border: '1px solid var(--status-high-border)', borderRadius: '4px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--status-high-fg)' }}>HIGH RISK</span>
              <span className="tabular-nums" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--status-high-fg)' }}>71 – 89 pts (Analyst Hold)</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', backgroundColor: '#F8D7DA', border: '1px solid #F5C6CB', borderRadius: '4px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#721C24' }}>CRITICAL RISK</span>
              <span className="tabular-nums" style={{ fontSize: '12px', fontWeight: 600, color: '#721C24' }}>90 – 100 pts (Immediate Block)</span>
            </div>
          </div>
        </div>
      </div>

      {/* User Management Section (Admin Only) */}
      {isAdmin && (
        <div className="trace-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={18} color="var(--accent-terracotta)" />
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Platform User &amp; Role Administration
              </h2>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Admin Authorized</span>
          </div>

          <DataTable
            columns={userColumns}
            data={usersList}
            loading={loadingUsers}
            emptyMessage="No platform users found"
          />
        </div>
      )}

      {/* Immutable Audit Log Section (Lead & Admin Only) */}
      {isLeadOrAdmin && (
        <div className="trace-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={18} color="var(--accent-terracotta)" />
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                System Audit Trail (Append-Only)
              </h2>
            </div>
            <button
              type="button"
              className="btn-outline"
              style={{ fontSize: '11px', padding: '4px 10px' }}
              onClick={loadAdminData}
            >
              <RefreshCw size={12} />
              Refresh Logs
            </button>
          </div>

          <DataTable
            columns={auditColumns}
            data={auditLogs}
            loading={loadingLogs}
            emptyMessage="No audit trail events recorded"
          />
        </div>
      )}
    </div>
  );
}
