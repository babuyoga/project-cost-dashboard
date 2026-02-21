"use client";

import { useDashboardStore } from "@/app/store/useDashboardStore";
import { AlertCircle, RefreshCw } from "lucide-react";
import { useState } from "react";

export function MockDataBanner() {
  const { dataSource, dataSourceUrl } = useDashboardStore();
  const [isRetrying, setIsRetrying] = useState(false);

  if (dataSource !== 'mock') return null;

  const handleRetry = () => {
    setIsRetrying(true);
    // Reloading the page is the simplest way to retry all failed fetches
    window.location.reload();
  };

  return (
    <div className="bg-amber-900/40 border-b border-amber-700/50 px-4 py-3 text-amber-100 relative">
      <div className="flex items-center justify-between container mx-auto max-w-7xl">
        <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-amber-400" />
            <p className="text-sm font-medium">
                This is currently using mock data. No data was received from <span className="font-mono text-amber-300">{dataSourceUrl || "Backend URL"}</span>.
            </p>
        </div>
        <button
            onClick={handleRetry}
            disabled={isRetrying}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold bg-amber-800 hover:bg-amber-700 text-white rounded transition-colors disabled:opacity-50"
        >
            <RefreshCw className={`h-3 w-3 ${isRetrying ? 'animate-spin' : ''}`} />
            {isRetrying ? 'Retrying...' : 'Try Fetching Actual Data'}
        </button>
      </div>
    </div>
  );
}
