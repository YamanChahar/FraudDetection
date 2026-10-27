import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FlaskConical,
  Receipt,
  AlertTriangle,
  Cpu,
  FileSpreadsheet,
  Settings,
  Shield,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { APP_NAME } from '../utils/constants';

export default function Sidebar({ isOpen = true, onClose }) {
  const { user } = useAuth();
  const role = (user?.role || 'ANALYST').toUpperCase();

  const navItems = [
    {
      to: '/',
      label: 'Overview',
      icon: LayoutDashboard,
      roles: ['ANALYST', 'INVESTIGATOR', 'LEAD', 'ADMIN'],
    },
    {
      to: '/testing-lab',
      label: 'Fraud Testing Lab',
      icon: FlaskConical,
      roles: ['ANALYST', 'INVESTIGATOR', 'LEAD', 'ADMIN'],
    },
    {
      to: '/transactions',
      label: 'Transaction Explorer',
      icon: Receipt,
      roles: ['ANALYST', 'INVESTIGATOR', 'LEAD', 'ADMIN'],
    },
    {
      to: '/alerts',
      label: 'Fraud Alerts',
      icon: AlertTriangle,
      roles: ['ANALYST', 'INVESTIGATOR', 'LEAD', 'ADMIN'],
    },
    {
      to: '/models',
      label: 'Model Performance',
      icon: Cpu,
      roles: ['ANALYST', 'INVESTIGATOR', 'LEAD', 'ADMIN'],
    },
    {
      to: '/batch-testing',
      label: 'Dataset Testing',
      icon: FileSpreadsheet,
      roles: ['INVESTIGATOR', 'LEAD', 'ADMIN'],
    },
    {
      to: '/settings',
      label: 'Settings & Admin',
      icon: Settings,
      roles: ['ANALYST', 'INVESTIGATOR', 'LEAD', 'ADMIN'],
    },
  ];

  const authorizedNavItems = navItems.filter((item) => item.roles.includes(role));

  return (
    <aside
      style={{
        width: '260px',
        backgroundColor: 'var(--surface-sidebar, #25251F)',
        color: '#EFECE3',
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid rgba(221, 215, 205, 0.12)',
        height: '100vh',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      {/* Brand Header */}
      <div
        style={{
          padding: '20px 22px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <div
          style={{
            backgroundColor: 'rgba(182, 93, 58, 0.2)',
            border: '1px solid rgba(182, 93, 58, 0.4)',
            color: 'var(--accent-terracotta)',
            padding: '7px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Shield size={20} />
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '16px', fontWeight: 700, letterSpacing: '-0.02em', color: '#FCFAF6' }}>
              {APP_NAME}
            </span>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 700,
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                padding: '1px 5px',
                borderRadius: '3px',
                color: '#DDD7CD',
              }}
            >
              v1.0
            </span>
          </div>
          <span style={{ fontSize: '11px', color: '#8C897E', display: 'block' }}>
            Risk Intelligence Platform
          </span>
        </div>
      </div>

      {/* Navigation Sections */}
      <nav style={{ flex: 1, padding: '20px 14px', overflowY: 'auto' }}>
        <div
          style={{
            fontSize: '10px',
            fontWeight: 700,
            color: '#8C897E',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            padding: '0 10px 10px 10px',
          }}
        >
          Navigation
        </div>

        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {authorizedNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to === '/'}
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '9px 12px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: 500,
                    textDecoration: 'none',
                    transition: 'all 120ms ease',
                    color: isActive ? '#FCFAF6' : '#DDD7CD',
                    backgroundColor: isActive ? 'rgba(182, 93, 58, 0.22)' : 'transparent',
                    border: isActive
                      ? '1px solid rgba(182, 93, 58, 0.4)'
                      : '1px solid transparent',
                  })}
                  onMouseEnter={(e) => {
                    if (!e.currentTarget.classList.contains('active')) {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                      e.currentTarget.style.color = '#FCFAF6';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!e.currentTarget.classList.contains('active')) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#DDD7CD';
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Icon size={16} color="var(--accent-terracotta)" />
                    <span>{item.label}</span>
                  </div>
                  <ChevronRight size={13} style={{ opacity: 0.3 }} />
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Info / Role Footer */}
      {user && (
        <div
          style={{
            padding: '14px 18px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            backgroundColor: 'rgba(0, 0, 0, 0.18)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ overflow: 'hidden' }}>
            <div
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: '#FCFAF6',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                overflow: 'hidden',
              }}
            >
              {user.name || user.email}
            </div>
            <div
              style={{
                fontSize: '10px',
                fontWeight: 700,
                textTransform: 'uppercase',
                color: 'var(--accent-terracotta)',
                letterSpacing: '0.04em',
              }}
            >
              {user.role}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
