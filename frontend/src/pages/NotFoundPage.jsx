import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="trace-card" style={{ padding: '48px', textAlign: 'center' }}>
      <h2 style={{ fontSize: '32px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
        404
      </h2>
      <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
        The requested resource was not found.
      </p>
      <Link to="/" className="btn-primary">
        Return to Overview
      </Link>
    </div>
  );
}
