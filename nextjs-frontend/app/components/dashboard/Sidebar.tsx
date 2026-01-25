"use client";

import { useEffect, useState } from "react";
import { useDashboardStore } from "@/app/store/useDashboardStore";
import { fetchPeriods, fetchProjects } from "@/app/lib/api";

import Link from "next/link";
import { ChevronLeft, ChevronRight, LogOut, User } from "lucide-react";

function formatPeriod(period: string) {
  if (!period || period.length !== 6) return period;
  const year = period.substring(0, 4);
  const month = period.substring(4, 6);
  return `${month}-${year}`;
}

export function Sidebar() {
  const [initError, setInitError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [periods, setPeriods] = useState<string[]>([]);
  const [projects, setProjects] = useState<number[]>([]);
  const [username, setUsername] = useState<string>("Username");

  const initializeData = async () => {
    setIsInitializing(true);
    const startTime = Date.now();
    // Don't clear error yet, so the box stays visible while loading
    try {
      // Fetch user info in parallel with other data
      const fetchUser = async () => {
        try {
          const res = await fetch("/api/auth/me");
          if (res.ok) {
            const data = await res.json();
            setUsername(data.username);
          }
        } catch (error) {
          console.error("Failed to fetch user", error);
        }
      };

      const [periodsResult, projectsResult, _userResult] = await Promise.allSettled([
        fetchPeriods(),
        fetchProjects(),
        fetchUser()
      ]);

      if (periodsResult.status === 'fulfilled') {
        setPeriods(periodsResult.value);
      }
      if (projectsResult.status === 'fulfilled') {
        setProjects(projectsResult.value);
      }

      const errors: string[] = [];
      if (periodsResult.status === 'rejected') errors.push(`Periods: ${periodsResult.reason.message}`);
      if (projectsResult.status === 'rejected') errors.push(`Projects: ${projectsResult.reason.message}`);

      if (errors.length > 0) {
        setInitError(errors.join(' | ')); // Combine errors if both failed
        // Note: we don't re-throw, just set the UI error state
      } else {
        setInitError(null);
      }
    } catch (error: any) {
      console.error("Failed to initialize sidebar data:", error);
      setInitError(error.message || "Failed to load options");
    } finally {
      // Calculate remaining time to satisfy the minimum 3-second loader requirement
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, 3000 - elapsedTime);
      
      if (remainingTime > 0) {
        await new Promise(resolve => setTimeout(resolve, remainingTime));
      }
      
      setIsInitializing(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Logout failed", err);
    } finally {
      window.location.href = "/";
    }
  };

  const { 
    fromPeriod, setFromPeriod,
    toPeriod, setToPeriod,
    selectedProject, setSelectedProject,
    metric, setMetric,
    runAnalysis, isAnalysisRunning,
    isSidebarCollapsed, toggleSidebar
  } = useDashboardStore();

  useEffect(() => {
    initializeData();
  }, []);

  return (
    <aside 
      className={`relative flex flex-col h-screen flex-shrink-0 border-r border-slate-800 bg-slate-950 text-white transition-all duration-300 ${isSidebarCollapsed ? 'w-16' : 'w-[280px]'}`}
    >
      
      {/* Scrollable Content Area */}
      {/* We move padding here to ensure scrollbar is at the edge if needed, or inside padding. 
          Actually, usually scrollbars look better if padding is inside the scroll container. */}
      <div className={`flex-1 overflow-y-auto overflow-x-hidden flex flex-col ${isSidebarCollapsed ? 'p-4 items-center' : 'p-6'}`}>
        
        <div className="w-full flex items-center justify-between mb-6">
            {!isSidebarCollapsed && <h3 className="text-xl font-bold truncate">Project Details</h3>}
            <button onClick={toggleSidebar} className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white ml-auto">
                {isSidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            </button>
        </div>

        {initError && !isSidebarCollapsed && (
          <div className="mb-4 p-3 bg-red-900/20 border border-red-800 rounded text-sm text-red-200">
            <p className="mb-2">{initError}</p>
            <button 
              onClick={initializeData} 
              disabled={isInitializing}
              className="text-xs bg-red-800 hover:bg-red-700 text-white px-2 py-1 rounded transition-colors disabled:opacity-50"
            >
              {isInitializing ? 'Retrying...' : 'Retry'}
            </button>
          </div>
        )}
        
        {!isSidebarCollapsed && (
          <div className="flex flex-col gap-6 w-full">
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
      </div>

      {/* Footer with User Info */}
      <div className={`border-t border-slate-800 bg-slate-950 flex-shrink-0 z-50 ${isSidebarCollapsed ? 'p-4 flex flex-col items-center' : 'p-6'}`}>
        {!isSidebarCollapsed ? (
          <div className="flex items-center justify-between">
            <Link href="/settings" className="flex items-center gap-3 hover:bg-slate-800/50 p-2 rounded transition-colors -ml-2">
              <div className="h-8 w-8 rounded-full bg-blue-600/20 flex items-center justify-center border border-blue-600/30 text-blue-400">
                <User size={16} />
              </div>
              <span className="text-sm font-medium text-slate-200">{username}</span>
            </Link>
            <button 
              onClick={handleSignOut} 
              className="group relative p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
            >
              <LogOut size={18} />
              
              {/* Custom Tooltip */}
              <span className="absolute right-0 bottom-full mb-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 border border-slate-700 shadow-xl">
                Sign Out
              </span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 w-full">
            <Link href="/settings" className="h-8 w-8 rounded-full bg-blue-600/20 flex items-center justify-center border border-blue-600/30 text-blue-400 hover:bg-blue-600/30 transition-colors" title="Settings">
                <User size={16} />
            </Link>
            <button 
              onClick={handleSignOut}
              className="group relative p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
            >
              <LogOut size={18} />
              
              {/* Custom Tooltip */}
              <span className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 border border-slate-700 shadow-xl">
                Sign Out
              </span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
