import React from 'react';
import { LogOut, User as UserIcon, Activity } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getRoleBadgeStyle = (role) => {
    switch ((role || '').toLowerCase()) {
      case 'admin':
        return { backgroundColor: 'rgba(168, 56, 36, 0.12)', color: 'var(--status-high-fg)', border: '1px solid rgba(168, 56, 36, 0.3)' };
      case 'lead':
        return { backgroundColor: 'rgba(143, 93, 24, 0.12)', color: 'var(--status-med-fg)', border: '1px solid rgba(143, 93, 24, 0.3)' };
      case 'investigator':
        return { backgroundColor: 'rgba(46, 90, 54, 0.12)', color: 'var(--status-low-fg)', border: '1px solid rgba(46, 90, 54, 0.3)' };
      default:
        return { backgroundColor: 'var(--surface-subtle)', color: 'var(--text-secondary)', border: '1px solid var(--border-stone)' };
    }
  };

  const getPageTitle = (path) => {
    if (path === '/' || path === '/dashboard') return 'Risk Intelligence Overview';
    if (path.startsWith('/testing-lab')) return 'Fraud Testing Lab';
    if (path.startsWith('/transactions')) return 'Transaction Explorer';
    if (path.startsWith('/alerts')) return 'Fraud Alert Management';
    if (path.startsWith('/models')) return 'Model Performance & Monitoring';
    if (path.startsWith('/batch-testing')) return 'Dataset Batch Testing';
    if (path.startsWith('/settings')) return 'Settings & Governance';
    return 'Analytics Console';
  };

  return (
    <header
      style={{
        backgroundColor: 'var(--surface-card)',
        borderBottom: '1px solid var(--border-stone)',
        padding: '14px 36px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 40,
      }}
    >
      {/* Current Page Context */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Activity size={18} color="var(--accent-terracotta)" />
        <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
          {getPageTitle(location.pathname)}
        </h2>
      </div>

      {/* User Session & Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {isAuthenticated && user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                backgroundColor: 'var(--surface-subtle)',
                borderRadius: '6px',
                border: '1px solid var(--border-stone)',
              }}
            >
              <UserIcon size={14} color="var(--text-secondary)" />
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                {user.name || user.email}
              </span>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  padding: '2px 6px',
                  borderRadius: '3px',
                  letterSpacing: '0.04em',
                  ...getRoleBadgeStyle(user.role),
                }}
              >
                {user.role}
              </span>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 12px',
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                backgroundColor: 'transparent',
                border: '1px solid var(--border-stone)',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#A83824';
                e.currentTarget.style.borderColor = 'rgba(168, 56, 36, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-secondary)';
                e.currentTarget.style.borderColor = 'var(--border-stone)';
              }}
            >
              <LogOut size={14} />
              Sign Out
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Link
              to="/login"
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                padding: '7px 14px',
                borderRadius: '6px',
                textDecoration: 'none',
              }}
            >
              Sign In
            </Link>
            <Link
              to="/register"
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: '#FCFAF6',
                backgroundColor: 'var(--accent-terracotta)',
                padding: '7px 14px',
                borderRadius: '6px',
                textDecoration: 'none',
              }}
            >
              Register
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
