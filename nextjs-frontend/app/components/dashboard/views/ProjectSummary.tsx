
"use client";

import { useEffect, useState } from "react";
import { useDashboardStore } from "@/app/store/useDashboardStore";
import { Card } from "@/app/components/ui/card";
import { TrendLineChart } from "../charts/TrendLineChart";

export function ProjectSummary() {
  const { metric, projectAnalysisData, analysisLoading, analysisError } = useDashboardStore();
  
  if (analysisLoading) return <div className="text-white">Loading comparison...</div>;
  if (analysisError) return <div className="text-red-500">Error: {analysisError}</div>;
  if (!projectAnalysisData) return <div className="text-slate-400">Select a project and click &quot;Run analysis&quot;.</div>;

  const data = projectAnalysisData;

  const totalMetric = metric === 'forecast_costs_at_completion' 
      ? data.total_forecast_costs_at_completion 
      : data.total_ytd_actual;

  const diffColor = totalMetric.difference > 0 ? "text-red-500" : "text-green-500";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card className="p-6">
          <h3 className="text-sm font-medium text-slate-400">Project Difference</h3>
          <p className={`mt-2 text-3xl font-bold ${diffColor}`}>
            {totalMetric.difference.toLocaleString()}
          </p>
        </Card>
        <Card className="p-6">
          <h3 className="text-sm font-medium text-slate-400">Total ({totalMetric.period1})</h3>
          <p className="mt-2 text-3xl font-bold text-white">
            {totalMetric.file1.toLocaleString()}
          </p>
        </Card>
        <Card className="p-6">
          <h3 className="text-sm font-medium text-slate-400">Total ({totalMetric.period2})</h3>
          <p className="mt-2 text-3xl font-bold text-white">
            {totalMetric.file2.toLocaleString()}
          </p>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="mb-4 text-lg font-medium text-white">Cost Trend</h3>
        <div className="h-[300px] w-full">
            <TrendLineChart 
                p1Label={totalMetric.period1}
                p1Value={totalMetric.file1}
                p2Label={totalMetric.period2}
                p2Value={totalMetric.file2}
            />
        </div>
      </Card>
    </div>
  );
}
