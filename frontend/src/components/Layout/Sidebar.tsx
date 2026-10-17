import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Search,
  FileSpreadsheet,
  Database,
  BarChart3,
  Info,
  ShieldCheck,
  Cpu,
  Layers,
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
}

const navItems = [
  {
    name: "Overview Dashboard",
    path: "/",
    icon: LayoutDashboard,
    badge: "Live",
  },
  {
    name: "Single Transaction",
    path: "/analyze",
    icon: Search,
  },
  {
    name: "Batch Analysis",
    path: "/batch-analysis",
    icon: FileSpreadsheet,
    badge: "CSV",
  },
  {
    name: "Transaction Explorer",
    path: "/transactions",
    icon: Database,
  },
  {
    name: "Model Insights & SHAP",
    path: "/model-insights",
    icon: BarChart3,
  },
  {
    name: "Governance & About",
    path: "/about",
    icon: Info,
  },
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-navy-950 border-r border-navy-700 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-6 flex items-center gap-3 border-b border-navy-700">
          <div className="w-10 h-10 rounded-lg bg-accent-blue/15 border border-accent-blue/30 flex items-center justify-center text-accent-sky">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-white tracking-tight">
                FraudLens
              </span>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-accent-blue/20 text-accent-sky border border-accent-blue/30">
                PRO
              </span>
            </div>
            <p className="text-xs text-navy-400">Fintech Risk Platform</p>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 py-6 px-4 overflow-y-auto space-y-1">
          <div className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-navy-400">
            Monitoring & Operations
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                end={item.path === "/"}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-accent-blue/15 text-accent-sky border border-accent-blue/30 shadow-sm"
                      : "text-navy-300 hover:text-white hover:bg-navy-800"
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-navy-800 text-navy-300 border border-navy-700">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* System Architecture Badge */}
        <div className="p-4 mx-4 mb-4 rounded-lg bg-navy-900 border border-navy-700 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-navy-300">
            <Cpu className="w-3.5 h-3.5 text-accent-sky" />
            <span>Champion Model</span>
          </div>
          <div className="text-xs text-white font-medium flex items-center justify-between">
            <span>Random Forest</span>
            <span className="text-[11px] text-risk-low font-mono">PR 0.846</span>
          </div>
          <div className="flex items-center gap-2 pt-1 border-t border-navy-800 text-[11px] text-navy-400">
            <Layers className="w-3 h-3 text-navy-400" />
            <span>FastAPI + RobustScaler</span>
          </div>
        </div>
      </aside>
    </>
  );
};
