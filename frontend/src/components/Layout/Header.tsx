import React, { useEffect, useState } from "react";
import { Menu, Sliders } from "lucide-react";
import { api } from "../../services/api";
import type { HealthResponse } from "../../types/api";

interface HeaderProps {
  onMenuClick: () => void;
  title: string;
  subtitle?: string;
}

export const Header: React.FC<HeaderProps> = ({
  onMenuClick,
  title,
  subtitle,
}) => {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const checkHealth = async () => {
      try {
        const res = await api.getHealth();
        if (isMounted) {
          setHealth(res);
          setLoading(false);
        }
      } catch {
        if (isMounted) {
          setHealth(null);
          setLoading(false);
        }
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const isHealthy = health?.status === "healthy" && health.model_loaded;

  return (
    <header className="h-16 bg-navy-900/90 backdrop-blur-md border-b border-navy-700 px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-4">
        {/* Mobile menu trigger */}
        <button
          onClick={onMenuClick}
          className="p-2 rounded-lg text-navy-400 hover:text-white hover:bg-navy-800 lg:hidden focus:outline-none"
          aria-label="Toggle Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-base font-bold text-white tracking-tight leading-none">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs text-navy-400 mt-1 hidden sm:block">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Top Controls / Operational Indicators */}
      <div className="flex items-center gap-3">
        {/* Active Policy Pill */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-navy-800 border border-navy-700 text-xs text-navy-300">
          <Sliders className="w-3.5 h-3.5 text-accent-sky" />
          <span>Policy:</span>
          <span className="text-white font-mono font-medium">T₁ &lt; 0.30</span>
          <span className="text-navy-500">•</span>
          <span className="text-white font-mono font-medium">T₂ ≥ 0.70</span>
        </div>

        {/* Live Service Status */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-navy-800 border border-navy-700 text-xs text-navy-300">
          {loading ? (
            <>
              <span className="w-2 h-2 rounded-full bg-risk-medium animate-pulse" />
              <span className="hidden sm:inline font-medium">Engine</span>
              <span className="text-risk-medium font-semibold text-[11px]">CONNECTING</span>
            </>
          ) : isHealthy ? (
            <>
              <span className="w-2 h-2 rounded-full bg-risk-low animate-pulse" />
              <span className="hidden sm:inline font-medium">FastAPI Engine</span>
              <span className="text-risk-low font-semibold text-[11px]">READY</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-risk-high" />
              <span className="hidden sm:inline font-medium">Engine</span>
              <span className="text-risk-high font-semibold text-[11px]">DISCONNECTED</span>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
