
"use client";

import { Sidebar } from "./components/dashboard/Sidebar";
import { TabNavigation } from "./components/dashboard/TabNavigation";
import { useDashboardStore } from "./store/useDashboardStore";

// View Components
import { OverallSummary } from "./components/dashboard/views/OverallSummary";
import { ProjectSummary } from "./components/dashboard/views/ProjectSummary";
import { MainCostDriver, SubCategories, SubSubCategories } from "./components/dashboard/views";
import { TrajectoryExplorer } from "./components/dashboard/views/TrajectoryExplorer";


import { DataSourceBanner } from "./components/DataSourceBanner";
import { DataFetcher } from "./components/dashboard/DataFetcher";
import { ValidationModal } from "./components/ValidationModal";

export default function DashboardPage() {
  const { activeTab, analysisError, setAnalysisError } = useDashboardStore();

  return (
    <div className="flex h-screen bg-[#020b1c] text-slate-100">
      <ValidationModal />
      <DataFetcher />
      <Sidebar />
      <main className="flex-1 overflow-auto flex flex-col">
        <DataSourceBanner />
        <div className="p-8">
            <header className="mb-8">
            <h1 className="text-2xl font-bold text-white">Finance: Cost Monitoring Dashboard</h1>
            <p className="mt-2 text-slate-400">
                This dashboard visualizes the differences in project costs (EAC or YTD), highlighting project-level changes.
            </p>
        </header>

        {analysisError && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-800 rounded-lg flex items-start justify-between">
            <div className="text-red-200">
              <h4 className="font-semibold mb-1">Analysis Failed</h4>
              <p className="text-sm opacity-90">{analysisError}</p>
            </div>
            <button 
              onClick={() => setAnalysisError(null)}
              className="text-red-400 hover:text-red-200"
            >
              ×
            </button>
          </div>
        )}

        <TabNavigation />

        <div className="mt-6">
            {activeTab === 'overall' && <OverallSummary />}
            {activeTab === 'project' && <ProjectSummary />}
            {activeTab === 'main_driver' && <MainCostDriver />}
            {activeTab === 'sub_categories' && <SubCategories />}
            {activeTab === 'sub_sub_categories' && <SubSubCategories />}
            {activeTab === 'trajectory' && <TrajectoryExplorer />}
        </div>
        </div>
      </main>
    </div>
  );
}
