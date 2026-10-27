import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';

export default function AppLayout() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', backgroundColor: 'var(--bg-primary)' }}>
      {/* Fixed/Sticky Dark Charcoal Sidebar */}
      <Sidebar />

      {/* Main Workspace Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100vh', overflowY: 'auto' }}>
        <Header />
        <main
          style={{
            flex: 1,
            padding: '28px 36px',
            maxWidth: '1440px',
            width: '100%',
            margin: '0 auto',
          }}
        >
          <Outlet />
        </main>
        <footer
          style={{
            backgroundColor: 'var(--surface-card)',
            borderTop: '1px solid var(--border-stone)',
            padding: '14px 36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '11px',
            color: 'var(--text-muted)',
          }}
        >
          <span>TRACE &bull; Transaction Risk &amp; Fraud Analysis Platform</span>
          <span className="tabular-nums">Model Inference Engine &bull; MongoDB Cluster Active</span>
        </footer>
      </div>
    </div>
  );
}
