"use client";

import { useDashboardStore } from "@/app/store/useDashboardStore";
import { AlertCircle, RefreshCw, FlaskConical, Database } from "lucide-react";
import { useState } from "react";

export function DataSourceBanner() {
  const { dataSource, dataSourceUrl } = useDashboardStore();
  const [isRetrying, setIsRetrying] = useState(false);

  // Don't show banner for production data
  if (!dataSource || dataSource === 'production') return null;

  const handleRetry = () => {
    setIsRetrying(true);
    // Reloading the page is the simplest way to retry all failed fetches
    window.location.reload();
  };

  // Configuration for different data sources
  const config = {
    mock: {
      bgColor: "bg-amber-900/40",
      borderColor: "border-amber-700/50",
      textColor: "text-amber-100",
      iconColor: "text-amber-400",
      icon: AlertCircle,
      message: "Frontend mock data active",
      description: `No data was received from ${dataSourceUrl || "Backend URL"}. Displaying local mock data.`,
      showRetry: true
    },
    test: {
      bgColor: "bg-blue-900/40",
      borderColor: "border-blue-700/50",
      textColor: "text-blue-100",
      iconColor: "text-blue-400",
      icon: FlaskConical,
      message: "Backend test mode active",
      description: `The backend is running in TEST_MODE. Displaying test data from ${dataSourceUrl || "Backend URL"}.`,
      showRetry: false
    }
  };

  const currentConfig = config[dataSource as 'mock' | 'test'];
  const Icon = currentConfig.icon;

  return (
    <div className={`${currentConfig.bgColor} border-b ${currentConfig.borderColor} px-4 py-3 ${currentConfig.textColor} relative`}>
      <div className="flex items-center justify-between container mx-auto max-w-7xl">
        <div className="flex items-center gap-3">
            <Icon className={`h-5 w-5 ${currentConfig.iconColor}`} />
            <div>
                <p className="text-sm font-semibold">{currentConfig.message}</p>
                <p className="text-xs opacity-90">{currentConfig.description}</p>
            </div>
        </div>
        {currentConfig.showRetry && (
            <button
                onClick={handleRetry}
                disabled={isRetrying}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold bg-amber-800 hover:bg-amber-700 text-white rounded transition-colors disabled:opacity-50"
            >
                <RefreshCw className={`h-3 w-3 ${isRetrying ? 'animate-spin' : ''}`} />
                {isRetrying ? 'Retrying...' : 'Try Fetching Actual Data'}
            </button>
        )}
      </div>
    </div>
  );
}
