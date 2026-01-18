
"use client";

import { useDashboardStore } from "@/app/store/useDashboardStore";
import { cn } from "@/app/lib/utils";

const TABS = [
  { id: 'overall', label: 'Overall Summary' },
  { id: 'project', label: 'Project Summary' },
  { id: 'main_driver', label: 'Main Cost Driver' },
  { id: 'sub_categories', label: 'Sub Categories' },
  { id: 'sub_sub_categories', label: 'Sub-Subcategories' },
  { id: 'trajectory', label: 'Cost Trajectory Explorer' },
];

export function TabNavigation() {
  const { activeTab, setActiveTab } = useDashboardStore();

  return (
    <div className="mb-6 border-b border-slate-800">
      <nav className="flex space-x-6 overflow-x-auto">
        {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "whitespace-nowrap pb-3 text-sm font-medium transition-colors hover:text-white",
                activeTab === tab.id 
                  ? "border-b-2 border-blue-500 text-white" 
                  : "text-slate-400"
              )}
            >
              {tab.label}
            </button>
        ))}
      </nav>
    </div>
  );
}
