import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'ANALYST',
  });

  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    if (error) setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await register(formData);
      navigate('/', { replace: true });
    } catch (err) {
      if (err.details && Array.isArray(err.details) && err.details.length > 0) {
        setError(err.details.map((d) => d.message).join(' | '));
      } else {
        setError(err.message || 'Registration failed. Please check form inputs.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '80vh',
        padding: '24px',
      }}
    >
      <div
        className="trace-card"
        style={{
          width: '100%',
          maxWidth: '480px',
          padding: '36px',
          boxShadow: '0 4px 16px rgba(37, 37, 31, 0.06)',
        }}
      >
        <div style={{ marginBottom: '28px', textAlign: 'center' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '12px',
            }}
          >
            <span
              style={{
                background: 'var(--accent-terracotta)',
                color: 'white',
                fontWeight: 700,
                fontSize: '15px',
                padding: '4px 10px',
                borderRadius: '4px',
                letterSpacing: '0.05em',
              }}
            >
              TRACE
            </span>
            <span
              style={{
                fontSize: '12px',
                color: 'var(--text-muted)',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              Account Onboarding
            </span>
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
            Register Risk Operator Account
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            Establish cryptographic credentials and assigned institutional operational role.
          </p>
        </div>

        {error && (
          <div
            style={{
              background: 'var(--status-high-bg)',
              color: 'var(--status-high-fg)',
              border: '1px solid var(--status-high-border)',
              borderRadius: '4px',
              padding: '12px 14px',
              fontSize: '13px',
              marginBottom: '20px',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label
              htmlFor="name"
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: '6px',
              }}
            >
              Full Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. Jane Doe, Senior Analyst"
              style={{
                width: '100%',
                padding: '10px 14px',
                fontSize: '14px',
                border: '1px solid var(--border-stone)',
                borderRadius: '4px',
                backgroundColor: 'var(--surface-card)',
                color: 'var(--text-primary)',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label
              htmlFor="email"
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: '6px',
              }}
            >
              Institutional Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="jane.doe@institution.com"
              style={{
                width: '100%',
                padding: '10px 14px',
                fontSize: '14px',
                border: '1px solid var(--border-stone)',
                borderRadius: '4px',
                backgroundColor: 'var(--surface-card)',
                color: 'var(--text-primary)',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label
              htmlFor="role"
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: '6px',
              }}
            >
              Assigned Operational Role
            </label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '10px 14px',
                fontSize: '14px',
                border: '1px solid var(--border-stone)',
                borderRadius: '4px',
                backgroundColor: 'var(--surface-card)',
                color: 'var(--text-primary)',
                outline: 'none',
              }}
            >
              <option value="ANALYST">Analyst (Transaction Analysis & Alerts Queue)</option>
              <option value="INVESTIGATOR">Investigator (Disposition Management & Evidence)</option>
              <option value="LEAD">Risk Lead (Team Oversight & Policy Review)</option>
              <option value="ADMIN">Administrator (Security Settings & Audit)</option>
            </select>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label
              htmlFor="password"
              style={{
                display: 'block',
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: '6px',
              }}
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="new-password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Min 8 chars, 1 uppercase, 1 lowercase, 1 number"
              style={{
                width: '100%',
                padding: '10px 14px',
                fontSize: '14px',
                border: '1px solid var(--border-stone)',
                borderRadius: '4px',
                backgroundColor: 'var(--surface-card)',
                color: 'var(--text-primary)',
                outline: 'none',
              }}
            />
            <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Requires at least 8 characters with upper, lower, and digit characters.
            </span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="trace-btn"
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              opacity: isSubmitting ? 0.7 : 1,
            }}
          >
            {isSubmitting ? 'Registering Security Credentials...' : 'Create Registered Account'}
          </button>
        </form>

        <div
          style={{
            marginTop: '24px',
            textAlign: 'center',
            fontSize: '13px',
            color: 'var(--text-secondary)',
          }}
        >
          Already holding active credentials?{' '}
          <Link
            to="/login"
            style={{
              color: 'var(--accent-terracotta)',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Sign In Here
          </Link>
        </div>
      </div>
    </div>
  );
}
