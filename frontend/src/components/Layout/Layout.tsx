import React, { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { AlertCircle } from "lucide-react";

const routeMeta: Record<string, { title: string; subtitle: string }> = {
  "/": {
    title: "Executive Overview & Risk Posture",
    subtitle: "Real-time benchmark monitoring and operational distribution",
  },
  "/analyze": {
    title: "Single Transaction Risk Scoring",
    subtitle: "Evaluate 30 canonical features with SHAP decision attribution",
  },
  "/batch-analysis": {
    title: "Batch CSV Transaction Scoring",
    subtitle: "High-throughput file assessment, filtering, and export",
  },
  "/transactions": {
    title: "Transaction Explorer & Audit Log",
    subtitle: "Browse dataset transactions and audit live model verdicts",
  },
  "/model-insights": {
    title: "Model Performance & SHAP Explainability",
    subtitle: "Comparative benchmark metrics, PR curves, and global drivers",
  },
  "/about": {
    title: "System Architecture & Governance",
    subtitle: "Methodology, calibration characteristics, and regulatory boundaries",
  },
};

export const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const currentMeta = routeMeta[location.pathname] || {
    title: "FraudLens Risk Platform",
    subtitle: "Enterprise Machine Learning Fraud Detection",
  };

  return (
    <div className="min-h-screen bg-navy-900 text-white flex">
      {/* Sidebar Navigation */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Container (offset by sidebar width on desktop) */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72">
        <Header
          onMenuClick={() => setSidebarOpen(true)}
          title={currentMeta.title}
          subtitle={currentMeta.subtitle}
        />

        {/* Page Content Viewport */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          <Outlet />

          {/* Persistent Regulatory Governance Footer */}
          <footer className="mt-12 pt-6 border-t border-navy-800 text-xs text-navy-400 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-accent-sky shrink-0" />
              <span>
                <strong>Regulatory & Governance Notice:</strong> FraudLens is an
                engineering prototype for portfolio research. It does not execute live banking clearance.
              </span>
            </div>
            <div className="font-mono text-[11px] text-navy-500 shrink-0">
              Model: Random Forest • v1.0.0
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
};
