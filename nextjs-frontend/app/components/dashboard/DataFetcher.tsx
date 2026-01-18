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
        const p1 = fetchOverallSummary(toPeriod, metric);
        
        // Only fetch project comparison if a project is selected
        const p2 = selectedProject 
            ? fetchForecastComparison(fromPeriod, toPeriod, selectedProject, metric)
            : Promise.resolve(null);

        Promise.all([p1, p2])
            .then(([overallData, comparisonData]) => {
                // For comparison data, we need to extract the specific project if it exists
                let projData = null;
                if (comparisonData && selectedProject) {
                    projData = comparisonData.projects[String(selectedProject)] || null;
                }
                
                setAnalysisData(overallData, projData);
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
