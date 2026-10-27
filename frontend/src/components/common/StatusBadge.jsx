import React from 'react';
import { Clock, UserCheck, Search, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';

export default function StatusBadge({ status = 'OPEN', size = 'md' }) {
  const normStatus = (status || '').toUpperCase();

  let style = {
    bg: 'var(--status-neutral-bg)',
    fg: 'var(--status-neutral-fg)',
    border: 'var(--status-neutral-border)',
    Icon: Clock,
    label: 'Open',
  };

  switch (normStatus) {
    case 'OPEN':
      style = {
        bg: 'var(--status-neutral-bg)',
        fg: 'var(--status-neutral-fg)',
        border: 'var(--status-neutral-border)',
        Icon: Clock,
        label: 'Open',
      };
      break;
    case 'ASSIGNED':
      style = {
        bg: 'var(--status-med-bg)',
        fg: 'var(--status-med-fg)',
        border: 'var(--status-med-border)',
        Icon: UserCheck,
        label: 'Assigned',
      };
      break;
    case 'UNDER_INVESTIGATION':
      style = {
        bg: 'rgba(182, 93, 58, 0.1)',
        fg: 'var(--accent-terracotta)',
        border: 'rgba(182, 93, 58, 0.3)',
        Icon: Search,
        label: 'In Review',
      };
      break;
    case 'ESCALATED':
      style = {
        bg: 'var(--status-high-bg)',
        fg: 'var(--status-high-fg)',
        border: 'var(--status-high-border)',
        Icon: AlertCircle,
        label: 'Escalated',
      };
      break;
    case 'RESOLVED':
      style = {
        bg: 'var(--status-low-bg)',
        fg: 'var(--status-low-fg)',
        border: 'var(--status-low-border)',
        Icon: CheckCircle2,
        label: 'Resolved',
      };
      break;
    case 'DISMISSED':
      style = {
        bg: 'var(--surface-subtle)',
        fg: 'var(--text-muted)',
        border: 'var(--border-stone)',
        Icon: XCircle,
        label: 'Dismissed',
      };
      break;
    default:
      break;
  }

  const { bg, fg, border, Icon, label } = style;
  const iconSize = size === 'sm' ? 11 : 13;
  const padding = size === 'sm' ? '1px 6px' : '3px 8px';
  const fontSize = size === 'sm' ? '11px' : '12px';

  return (
    <span
      style={{
        backgroundColor: bg,
        color: fg,
        border: `1px solid ${border}`,
        fontSize,
        padding,
        borderRadius: '4px',
        fontWeight: 600,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        letterSpacing: '0.02em',
      }}
    >
      <Icon size={iconSize} />
      <span>{label}</span>
    </span>
  );
}
