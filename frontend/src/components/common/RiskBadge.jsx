import React from 'react';
import { ShieldCheck, AlertTriangle, AlertOctagon, Flame } from 'lucide-react';

export default function RiskBadge({ level = 'LOW', score, showIcon = true, size = 'md' }) {
  const normLevel = (level || '').toUpperCase();

  let className = 'badge-low';
  let Icon = ShieldCheck;
  let label = 'Low Risk';

  switch (normLevel) {
    case 'MEDIUM':
    case 'MED':
      className = 'badge-med';
      Icon = AlertTriangle;
      label = 'Medium Risk';
      break;
    case 'HIGH':
      className = 'badge-high';
      Icon = AlertOctagon;
      label = 'High Risk';
      break;
    case 'CRITICAL':
      className = 'badge-critical';
      Icon = Flame;
      label = 'Critical Risk';
      break;
    case 'LOW':
    default:
      className = 'badge-low';
      Icon = ShieldCheck;
      label = 'Low Risk';
      break;
  }

  const iconSize = size === 'sm' ? 12 : 14;
  const padding = size === 'sm' ? '1px 6px' : '3px 10px';
  const fontSize = size === 'sm' ? '11px' : '12px';

  return (
    <span
      className={className}
      style={{
        padding,
        fontSize,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
      }}
    >
      {showIcon && <Icon size={iconSize} />}
      <span>{label}</span>
      {score !== undefined && score !== null && (
        <span className="tabular-nums" style={{ opacity: 0.85, fontWeight: 700 }}>
          ({Math.round(score)})
        </span>
      )}
    </span>
  );
}
