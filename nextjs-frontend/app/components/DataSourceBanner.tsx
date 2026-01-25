"use client";

import { useDashboardStore } from "@/app/store/useDashboardStore";
import { AlertCircle, RefreshCw, FlaskConical, Database } from "lucide-react";
import { useState } from "react";

export function DataSourceBanner() {
  const { dataSource, dataSourceUrl } = useDashboardStore();

  // Don't show banner for production data or no data
  if (!dataSource || dataSource === 'production') return null;

  // Configuration for test data source
  // We removed mock support as per requirements
  const isTest = dataSource === 'test';
  
  if (!isTest) return null;

  return (
    <div className="bg-blue-900/40 border-b border-blue-700/50 px-4 py-3 text-blue-100 relative">
      <div className="flex items-center justify-between container mx-auto max-w-7xl">
        <div className="flex items-center gap-3">
            <FlaskConical className="h-5 w-5 text-blue-400" />
            <div>
                <p className="text-sm font-semibold">Backend test mode active</p>
                <p className="text-xs opacity-90">The backend is running in TEST_MODE. Displaying test data from {dataSourceUrl || "Backend URL"}.</p>
            </div>
        </div>
      </div>
    </div>
  );
}
