
"use client";

import { useEffect, useState } from "react";
import { useDashboardStore } from "@/app/store/useDashboardStore";
import { Card } from "@/app/components/ui/card";

export function OverallSummary() {
  const { metric, overallSummaryData, analysisLoading, analysisError } = useDashboardStore();

  if (analysisLoading) return <div className="text-white">Loading analysis...</div>;
  if (analysisError) return <div className="text-red-500">Error: {analysisError}</div>;
  if (!overallSummaryData || overallSummaryData.length === 0) return <div className="text-slate-400">Click &quot;Run analysis&quot; to view data.</div>;

  const data = overallSummaryData;

  // Find max difference project
  const maxDiff = [...data].sort((a,b) => b[metric] - a[metric])[0];

  return (
    <div className="space-y-6">
      {maxDiff && (
          <div className="rounded-lg border border-blue-700 bg-blue-900/20 p-4 text-blue-100">
             <span className="font-bold">Insight:</span> Project {maxDiff.iProjNo} has the highest incurred cost.
          </div>
      )}

      <Card className="overflow-hidden">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-900 text-xs uppercase text-slate-400">
            <tr>
              <th className="px-6 py-3">Project No</th>
              <th className="px-6 py-3">Year</th>
              <th className="px-6 py-3">Client</th>
              <th className="px-6 py-3">Description</th>
              <th className="px-6 py-3 text-right">Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {data.map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-800/50">
                <td className="px-6 py-4 font-medium text-white">{row.iProjNo}</td>
                <td className="px-6 py-4">{row.iProjYear}</td>
                <td className="px-6 py-4">{row.cClientDesc}</td>
                <td className="px-6 py-4">{row.cProjDesc}</td>
                <td className="px-6 py-4 text-right font-mono text-white">
                  {row[metric]?.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
