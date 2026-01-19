
"use client";

import { useEffect, useState } from "react";
import { useDashboardStore } from "@/app/store/useDashboardStore";
import { fetchPeriods, fetchProjects } from "@/app/lib/api";

import { ChevronLeft, ChevronRight } from "lucide-react";

function formatPeriod(period: string) {
  if (!period || period.length !== 6) return period;
  const year = period.substring(0, 4);
  const month = period.substring(4, 6);
  return `${month}-${year}`;
}

export function Sidebar() {
  const [periods, setPeriods] = useState<string[]>([]);
  const [projects, setProjects] = useState<number[]>([]);
  
  const { 
    fromPeriod, setFromPeriod,
    toPeriod, setToPeriod,
    selectedProject, setSelectedProject,
    metric, setMetric,
    runAnalysis, isAnalysisRunning,
    isSidebarCollapsed, toggleSidebar
  } = useDashboardStore();

  useEffect(() => {
    fetchPeriods().then(setPeriods).catch(console.error);
    fetchProjects().then(setProjects).catch(console.error);
  }, []);

  return (
    <aside className={`relative flex flex-col h-screen flex-shrink-0 overflow-y-auto border-r border-slate-800 bg-slate-950 text-white transition-all duration-300 ${isSidebarCollapsed ? 'w-16 p-4 items-center' : 'w-[280px] p-6'}`}>
      <div className="flex items-center justify-between mb-6">
          {!isSidebarCollapsed && <h3 className="text-xl font-bold truncate">Project Details</h3>}
          <button onClick={toggleSidebar} className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white">
              {isSidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
      </div>
      
      {!isSidebarCollapsed && (
        <div className="flex flex-col gap-6">
            <div className="space-y-2">
            <label className="text-sm font-medium text-slate-400">From period</label>
            <select 
                className="w-full rounded border border-slate-700 bg-slate-900 p-2 text-sm text-white focus:border-blue-600 focus:outline-none"
                value={fromPeriod}
                onChange={(e) => setFromPeriod(e.target.value)}
            >
                <option value="">Select period</option>
                {periods.map(p => <option key={p} value={p}>{formatPeriod(p)}</option>)}
            </select>
            </div>

            <div className="space-y-2">
            <label className="text-sm font-medium text-slate-400">To period</label>
            <select 
                className="w-full rounded border border-slate-700 bg-slate-900 p-2 text-sm text-white focus:border-blue-600 focus:outline-none"
                value={toPeriod}
                onChange={(e) => setToPeriod(e.target.value)}
            >
                <option value="">Select period</option>
                {periods.map(p => <option key={p} value={p}>{formatPeriod(p)}</option>)}
            </select>
            </div>

            <div className="space-y-2">
            <label className="text-sm font-medium text-slate-400">Project number</label>
            <select 
                className="w-full rounded border border-slate-700 bg-slate-900 p-2 text-sm text-white focus:border-blue-600 focus:outline-none"
                value={selectedProject || ""}
                onChange={(e) => {
                    const val = e.target.value;
                    if (val === "OVERALL") {
                        setSelectedProject("OVERALL");
                    } else {
                        setSelectedProject(Number(val));
                    }
                }}
            >
                <option value="">Select project</option>
                <option value="OVERALL">Overall Summary</option>
                {projects.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            </div>

            <div className="space-y-2">
            <label className="text-sm font-medium text-slate-400">Metric</label>
            <select 
                className="w-full rounded border border-slate-700 bg-slate-900 p-2 text-sm text-white focus:border-blue-600 focus:outline-none"
                value={metric}
                onChange={(e) => setMetric(e.target.value)}
            >
                <option value="forecast_costs_at_completion">Forecast Costs at Completion</option>
                <option value="ytd_actual">YTD Actual</option>
            </select>
            </div>

            <button
            onClick={runAnalysis}
            disabled={isAnalysisRunning}
            className={`w-full rounded py-2.5 text-sm font-medium text-white transition-colors
              ${isAnalysisRunning 
                ? 'bg-blue-600/50 cursor-not-allowed' 
                : (!fromPeriod || !toPeriod || !selectedProject)
                  ? 'bg-blue-600/50 hover:bg-blue-600/50 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
            {isAnalysisRunning ? 'Running...' : 'Run analysis'}
            </button>
        </div>
      )}
    </aside>
  );
}
