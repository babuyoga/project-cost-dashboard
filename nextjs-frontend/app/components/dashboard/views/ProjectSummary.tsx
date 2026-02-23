
"use client";

import { useState } from "react";
import { useDashboardStore } from "@/app/store/useDashboardStore";
import { fetchProjectSummary, downloadXlsx } from "@/app/lib/api";
import { Card } from "@/app/components/ui/card";
import { TrendLineChart } from "../charts/TrendLineChart";
import { ChevronDown } from "lucide-react";

/** Format a number in thousands to "X.XX million" display */
function toMillions(value: number): string {
  return `${(value / 1000).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} million`;
}

export function ProjectSummary() {
  const { 
    metric, projectAnalysisData, projectKey, analysisLoading, analysisError,
    fromPeriod, toPeriod, selectedProject 
  } = useDashboardStore();
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isDownloadingSummary, setIsDownloadingSummary] = useState(false);
  const [isDownloadingBreakdown, setIsDownloadingBreakdown] = useState(false);
  const [breakdownError, setBreakdownError] = useState<string | null>(null);

  if (analysisLoading) return <div className="text-white">Loading comparison...</div>;
  if (analysisError) return <div className="text-red-500">Error: {analysisError}</div>;
  
  // Show placeholder if no project data (which happens when selecting "Overall Summary" or no project)
  if (!projectAnalysisData) {
      return (
        <div className="flex h-[400px] items-center justify-center rounded-lg border border-slate-800 bg-slate-900">
            <p className="text-lg text-slate-400">Choose a project number in the sidebar and run analysis.</p>
        </div>
      );
  }

  const data = projectAnalysisData;

  const totalMetric = metric === 'forecast_costs_at_completion' 
      ? data.total_forecast_costs_at_completion 
      : data.total_ytd_actual;

  const metricLabel = metric === 'forecast_costs_at_completion' 
      ? 'forecast_costs_at_completion' 
      : 'ytd_actual';

  const diffValue = totalMetric.difference;
  const diffIsPositive = diffValue >= 0;

  // --- Download Summary Handler ---
  const handleDownloadSummary = async () => {
    if (!selectedProject || selectedProject === 'OVERALL') return;
    setIsDownloadingSummary(true);
    try {
      const summary = await fetchProjectSummary(
        selectedProject as number,
        fromPeriod,
        toPeriod,
        metric,
      );
      const blob = new Blob([summary], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `project_${selectedProject}_summary.txt`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download summary:", err);
    } finally {
      setIsDownloadingSummary(false);
    }
  };

  // --- Download Cost Breakdown Report Handler ---
  const handleDownloadBreakdown = async () => {
    if (!selectedProject || selectedProject === 'OVERALL') return;
    setIsDownloadingBreakdown(true);
    setBreakdownError(null);
    try {
      const blob = await downloadXlsx(
        fromPeriod,
        toPeriod,
        selectedProject as number,
        metric,
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `project_${selectedProject}_cost_breakdown.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download cost breakdown:", err);
      setBreakdownError("Download failed. Please try again.");
    } finally {
      setIsDownloadingBreakdown(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* --- Section: Selected Project --- */}
      <div>
        <h2 className="text-lg font-semibold text-white">Project Summary</h2>
        <p className="mt-1 text-sm text-slate-400">Selected Project</p>
        
        {/* Project Key Dropdown */}
        <div className="relative mt-2 inline-block w-full max-w-md">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex w-full items-center justify-between rounded border border-slate-700 bg-slate-900 px-4 py-2.5 text-left text-sm text-white hover:border-slate-600 transition-colors"
          >
            <span>{projectKey || selectedProject}</span>
            <ChevronDown 
              size={16} 
              className={`ml-2 text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} 
            />
          </button>
          
          {isDropdownOpen && (
            <div className="absolute z-10 mt-1 w-full rounded border border-slate-700 bg-slate-900 p-3 shadow-xl">
              <p className="text-sm text-slate-300 leading-relaxed">
                {projectKey} — {data.project_meta.description} ({data.project_meta.client})
              </p>
            </div>
          )}
        </div>

        {/* Full project description below dropdown */}
        {!isDropdownOpen && (
          <p className="mt-2 text-sm text-slate-400 leading-relaxed max-w-3xl">
            {projectKey} — {data.project_meta.description} ({data.project_meta.client})
          </p>
        )}
      </div>

      {/* --- Section: Project Difference --- */}
      <div>
        <h3 className="text-sm font-medium text-slate-400">Project difference</h3>
        <p className="mt-1 text-3xl font-bold text-white">
          {toMillions(diffValue)}
        </p>
      </div>

      {/* --- Download Summary Button --- */}
      <button
        onClick={handleDownloadSummary}
        disabled={isDownloadingSummary}
        className="rounded border border-slate-600 bg-transparent px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isDownloadingSummary ? "Downloading..." : "Download Summary"}
      </button>

      {/* --- Section: Period Totals --- */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <h3 className="text-sm font-medium text-slate-400">
            Total {totalMetric.period1} {metricLabel}
          </h3>
          <p className="mt-2 text-3xl font-bold text-white">
            {toMillions(totalMetric.file1)}
          </p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-slate-400">
            Total {totalMetric.period2} {metricLabel}
          </h3>
          <p className="mt-2 text-3xl font-bold text-white">
            {toMillions(totalMetric.file2)}
          </p>
        </div>
      </div>

      {/* --- Difference Badge (Green/Red Pill) --- */}
      <div>
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium border ${
            diffIsPositive
              ? "bg-green-900/30 text-green-400 border-green-700"
              : "bg-red-900/30 text-red-400 border-red-700"
          }`}
        >
          {diffIsPositive ? "↑" : "↓"} {toMillions(Math.abs(diffValue))}
        </span>
      </div>

      {/* --- Section: Trend Line Chart --- */}
      <Card className="p-6">
        <div className="h-[300px] w-full">
            <TrendLineChart 
                p1Label={totalMetric.period1}
                p1Value={totalMetric.file1}
                p2Label={totalMetric.period2}
                p2Value={totalMetric.file2}
            />
        </div>
      </Card>

      {/* --- Download Cost Breakdown Report Button --- */}
      <div>
        <button
          onClick={handleDownloadBreakdown}
          disabled={isDownloadingBreakdown}
          className="rounded border border-slate-600 bg-transparent px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isDownloadingBreakdown ? "Generating report..." : "Download Cost Breakdown Report"}
        </button>
        {breakdownError && (
          <p className="mt-2 text-xs text-red-400">{breakdownError}</p>
        )}
      </div>
    </div>
  );
}
