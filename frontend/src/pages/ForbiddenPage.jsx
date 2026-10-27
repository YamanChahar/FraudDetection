import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ForbiddenPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div style={{
      minHeight: '70vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{
        backgroundColor: 'var(--surface-card)',
        border: '1px solid var(--border-stone)',
        borderRadius: '8px',
        padding: '48px 40px',
        maxWidth: '520px',
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 4px 16px rgba(37, 37, 31, 0.05)',
      }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: 'rgba(168, 56, 36, 0.1)',
          border: '1px solid rgba(168, 56, 36, 0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px auto',
        }}>
          <ShieldAlert size={28} color="var(--risk-rust, #A83824)" />
        </div>

        <span style={{
          fontSize: '11px',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'var(--risk-rust, #A83824)',
          backgroundColor: 'rgba(168, 56, 36, 0.08)',
          padding: '4px 10px',
          borderRadius: '4px',
          display: 'inline-block',
          marginBottom: '12px',
        }}>
          403 — Access Denied
        </span>

        <h1 style={{
          fontSize: '22px',
          fontWeight: 700,
          color: 'var(--text-primary)',
          letterSpacing: '-0.02em',
          marginBottom: '10px',
        }}>
          Insufficient Role Permissions
        </h1>

        <p style={{
          fontSize: '14px',
          color: 'var(--text-secondary)',
          lineHeight: '1.6',
          marginBottom: '24px',
        }}>
          Your authenticated account {user ? <strong>({user.email} &bull; {user.role})</strong> : ''} does
          not hold the required authorization level for this section of the TRACE risk intelligence platform.
        </p>

        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '12px',
        }}>
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{
              padding: '10px 18px',
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--text-primary)',
              backgroundColor: 'var(--surface-subtle)',
              border: '1px solid var(--border-stone)',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <ArrowLeft size={16} />
            Go Back
          </button>

          <Link
            to="/"
            style={{
              padding: '10px 20px',
              fontSize: '13px',
              fontWeight: 600,
              color: '#FCFAF6',
              backgroundColor: 'var(--accent-terracotta)',
              border: '1px solid var(--accent-terracotta)',
              borderRadius: '6px',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
