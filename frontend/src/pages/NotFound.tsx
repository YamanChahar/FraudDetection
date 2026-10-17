import React from "react";
import { Link } from "react-router-dom";
import { AlertCircle, ArrowLeft } from "lucide-react";

export const NotFound: React.FC = () => {
  return (
    <div className="card p-12 text-center max-w-lg mx-auto mt-12">
      <div className="w-14 h-14 rounded-full bg-navy-800 text-risk-high flex items-center justify-center mx-auto mb-4 border border-navy-700">
        <AlertCircle className="w-7 h-7" />
      </div>
      <h1 className="text-xl font-bold text-white mb-2">Page Not Found</h1>
      <p className="text-xs text-navy-400 mb-6">
        The requested path does not exist on the FraudLens platform.
      </p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 px-4 py-2 bg-navy-750 hover:bg-navy-700 text-white font-medium text-xs rounded-lg border border-navy-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Return to Executive Overview
      </Link>
    </div>
  );
};
