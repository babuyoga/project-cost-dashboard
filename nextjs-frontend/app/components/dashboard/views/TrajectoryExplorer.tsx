"use client";

import { useEffect, useState } from "react";
import { useDashboardStore } from "@/app/store/useDashboardStore";
import { Card } from "@/app/components/ui/card";
import { ChevronRight, ChevronDown } from "lucide-react";

export function TrajectoryExplorer() {
  const { metric, projectAnalysisData, analysisLoading } = useDashboardStore();

  if (analysisLoading)
    return <div className="text-white">Loading trajectory...</div>;

  // Show placeholder if no project data
  if (!projectAnalysisData) {
    return (
      <div className="flex h-[400px] items-center justify-center rounded-lg border border-slate-800 bg-slate-900">
        <p className="text-lg text-slate-400">
          Choose a project number in the sidebar and run analysis.
        </p>
      </div>
    );
  }

  const data = projectAnalysisData;

  return (
    <Card className="p-4">
      <div className="space-y-1">
        <div className="flex px-4 py-2 font-bold text-slate-400">
          <div className="flex-1">Category Hierarchy</div>
          <div className="w-32 text-right">Value ({metric}, $M)</div>
          <div className="w-32 text-right">Difference</div>
        </div>
        {data.costline_increases_trajectory.map((node, i) => (
          <TreeNode key={i} node={node} level={0} />
        ))}
      </div>
    </Card>
  );
}

function TreeNode({ node, level }: { node: any; level: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren =
    (node.subcategories && node.subcategories.length > 0) ||
    (node.children && node.children.length > 0);
  const children = node.subcategories || node.children || [];

  const paddingLeft = `${level * 20 + 8}px`;

  return (
    <div>
      <div
        className="flex cursor-pointer items-center rounded py-2 hover:bg-slate-800"
        onClick={() => hasChildren && setIsOpen(!isOpen)}
      >
        <div className="flex flex-1 items-center" style={{ paddingLeft }}>
          {hasChildren && (
            <span className="mr-2 text-slate-400">
              {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </span>
          )}
          {!hasChildren && <span className="mr-2 w-[14px]" />} {/* Spacer */}
          <span className="text-sm font-medium text-slate-200">
            {node.category}
          </span>
        </div>

        <div className="w-32 text-right font-mono text-xs text-slate-400">
          {/* Using file2 as current value proxy, adjust if needed */}
          {node.file2_metric != null
            ? (node.file2_metric / 1000).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })
            : undefined}
        </div>
        <div
          className={`w-32 text-right font-mono text-sm font-bold ${node.difference > 0 ? "text-red-500" : "text-green-500"}`}
        >
          {node.difference != null
            ? (node.difference / 1000).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })
            : undefined}
        </div>
      </div>

      {isOpen && hasChildren && (
        <div>
          {children.map((child: any, i: number) => (
            <TreeNode key={i} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}
