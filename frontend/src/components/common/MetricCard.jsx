import React from 'react';

export default function MetricCard({
  title,
  value,
  subtext,
  delta,
  deltaType = 'neutral', // 'positive' | 'negative' | 'neutral'
  icon: Icon,
  variant = 'default', // 'default' | 'alert' | 'highlight'
  onClick,
}) {
  const getBorderColor = () => {
    if (variant === 'alert') return 'rgba(168, 56, 36, 0.4)';
    if (variant === 'highlight') return 'rgba(182, 93, 58, 0.4)';
    return 'var(--border-stone)';
  };

  const getDeltaColor = () => {
    if (deltaType === 'positive') return 'var(--status-low-fg)';
    if (deltaType === 'negative') return 'var(--status-high-fg)';
    return 'var(--text-muted)';
  };

  return (
    <div
      className="trace-card"
      onClick={onClick}
      style={{
        padding: '20px 22px',
        borderColor: getBorderColor(),
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 150ms ease',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.borderColor = 'var(--accent-terracotta)';
          e.currentTarget.style.transform = 'translateY(-1px)';
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.borderColor = getBorderColor();
          e.currentTarget.style.transform = 'translateY(0)';
        }
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <span
          style={{
            fontSize: '11px',
            fontWeight: 700,
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          {title}
        </span>
        {Icon && (
          <div
            style={{
              padding: '6px',
              borderRadius: '5px',
              backgroundColor: 'var(--surface-subtle)',
              color: variant === 'alert' ? 'var(--status-high-fg)' : 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon size={16} />
          </div>
        )}
      </div>

      <div>
        <div
          className="tabular-nums"
          style={{
            fontSize: '28px',
            fontWeight: 700,
            letterSpacing: '-0.03em',
            color: variant === 'alert' ? 'var(--status-high-fg)' : 'var(--text-primary)',
            lineHeight: 1.1,
            marginBottom: '6px',
          }}
        >
          {value !== undefined && value !== null ? value : '—'}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
          {delta && (
            <span
              className="tabular-nums"
              style={{
                color: getDeltaColor(),
                fontWeight: 600,
              }}
            >
              {delta}
            </span>
          )}
          {subtext && <span style={{ color: 'var(--text-muted)' }}>{subtext}</span>}
        </div>
      </div>
    </div>
  );
}
