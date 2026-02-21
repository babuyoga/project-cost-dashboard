"use client";

import { useEffect } from "react";
import { useDashboardStore } from "@/app/store/useDashboardStore";
import { fetchOverallSummary, fetchForecastComparison } from "@/app/lib/api";

export function DataFetcher() {
  const { 
    isAnalysisRunning, 
    toPeriod, 
    fromPeriod, 
    metric, 
    selectedProject,
    setAnalysisFinished,
    setAnalysisData,
    setAnalysisLoading,
    setAnalysisError
  } = useDashboardStore();

  useEffect(() => {
    if (isAnalysisRunning) {
        setAnalysisLoading(true);
        setAnalysisError(null);

        // Fetch both datasets in parallel
        const p1 = fetchOverallSummary(fromPeriod, toPeriod, metric);
        
        // Only fetch project comparison if a specific project is selected (not 'OVERALL')
        const p2 = (selectedProject && selectedProject !== 'OVERALL')
            ? fetchForecastComparison(fromPeriod, toPeriod, selectedProject, metric)
            : Promise.resolve(null);

        Promise.all([p1, p2])
            .then(([overallData, comparisonData]) => {
                // For comparison data, we need to extract the specific project.
                // The backend might return a key like "2171 & 2172" even if we requested "2171".
                // Since we only request one project at a time, we can safely take the first value.
                let projData = null;
                let projKey: string | null = null;
                if (comparisonData && comparisonData.projects) {
                    const keys = Object.keys(comparisonData.projects);
                    const projects = Object.values(comparisonData.projects);
                    if (projects.length > 0) {
                        projData = projects[0];
                        projKey = keys[0];
                    }
                }
                
                setAnalysisData(overallData, projData as any, projKey);
            })
            .catch((err) => {
                console.error("Analysis Failed:", err);
                setAnalysisError(err.message || "Failed to fetch analysis data");
            })
            .finally(() => {
                setAnalysisLoading(false);
                setAnalysisFinished();
            });
    }
  }, [
    isAnalysisRunning, 
    toPeriod, 
    fromPeriod, 
    metric, 
    selectedProject, 
    setAnalysisFinished, 
    setAnalysisData, 
    setAnalysisLoading, 
    setAnalysisError
  ]);

  return null; // This component does not render anything
}
