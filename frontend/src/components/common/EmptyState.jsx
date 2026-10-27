import React from 'react';
import { Inbox } from 'lucide-react';

export function EmptyState({
  icon: Icon = Inbox,
  title = 'No records available',
  description = 'There are currently no items matching your criteria in this analytical view.',
  action,
}) {
  return (
    <div
      style={{
        padding: '48px 24px',
        textAlign: 'center',
        backgroundColor: 'var(--surface-card)',
        border: '1px solid var(--border-stone)',
        borderRadius: '6px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          backgroundColor: 'var(--surface-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-muted)',
          marginBottom: '14px',
        }}
      >
        <Icon size={24} />
      </div>
      <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
        {title}
      </h3>
      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '420px', marginBottom: action ? '20px' : 0 }}>
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
}

export function Skeleton({ height = '20px', width = '100%', borderRadius = '4px', style = {} }) {
  return (
    <div
      style={{
        height,
        width,
        borderRadius,
        backgroundColor: 'var(--surface-subtle)',
        animation: 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        ...style,
      }}
    />
  );
}
