"use client";

import { useState, useMemo } from "react";
import { ChevronDown } from "lucide-react";
import { useDashboardStore } from "@/app/store/useDashboardStore";
import { CostlineTrajectory } from "@/app/lib/api";
import { Card } from "@/app/components/ui/card";
import { MainCostTypeChart } from "@/app/components/dashboard/charts/MainCostTypeChart";

// ─── Types ──────────────────────────────────────────────────────────────────

type SortColumn = "category" | "file1_metric" | "file2_metric" | "difference";
type SortDirection = "asc" | "desc";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Format a raw API value (in thousands) to a 3-decimal display string. */
function fmtValue(value: number): string {
  return (value / 1000).toLocaleString(undefined, {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });
}

// ─── Sub-components ──────────────────────────────────────────────────────────

/** A single sortable column header button. */
function SortableHeader({
  label,
  column,
  align = "right",
  currentSort,
  currentDirection,
  onSort,
}: {
  label: string;
  column: SortColumn;
  align?: "left" | "right";
  currentSort: SortColumn;
  currentDirection: SortDirection;
  onSort: (col: SortColumn) => void;
}) {
  const isActive = currentSort === column;
  return (
    <th
      className={`px-4 py-3 cursor-pointer select-none text-xs font-medium uppercase tracking-wider text-slate-400 hover:text-white transition-colors ${
        align === "right" ? "text-right" : "text-left"
      }`}
      onClick={() => onSort(column)}
    >
      <span
        className={`inline-flex items-center gap-1 ${
          align === "right" ? "flex-row-reverse" : "flex-row"
        }`}
      >
        {isActive && (
          <span className="text-blue-400 font-bold">
            {currentDirection === "asc" ? "↑" : "↓"}
          </span>
        )}
        {label}
      </span>
    </th>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function MainCostDriver() {
  const {
    projectAnalysisData,
    projectKey,
    analysisLoading,
    analysisError,
  } = useDashboardStore();

  // ── Local UI state ──
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [sortColumn, setSortColumn] = useState<SortColumn>("difference");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // ── Sort handler ──
  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(column);
      setSortDirection("desc");
    }
  };

  // ── Loading / error / empty states ──
  if (analysisLoading)
    return <div className="text-white">Loading breakdown…</div>;
  if (analysisError)
    return <div className="text-red-500">Error: {analysisError}</div>;
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
  const trajectory: CostlineTrajectory[] = data.costline_increases_trajectory;

  // ── Sorted table rows ──
  const sortedRows = useMemo(() => {
    const items = [...trajectory];
    items.sort((a, b) => {
      let cmp: number;
      if (sortColumn === "category") {
        cmp = a.category.localeCompare(b.category);
      } else {
        cmp = a[sortColumn] - b[sortColumn];
      }
      return sortDirection === "asc" ? cmp : -cmp;
    });
    return items;
  }, [trajectory, sortColumn, sortDirection]);

  // ── Chart data (always sorted by difference descending for visual clarity) ──
  const chartData = [...trajectory]
    .sort((a, b) => b.difference - a.difference)
    .map((item) => ({ name: item.category, value: item.difference }));

  // ── CSV download ──
  const handleDownloadCsv = () => {
    const header = ["category", "file1_metric", "file2_metric", "difference"];
    const rows = sortedRows.map((r) => [
      r.category,
      (r.file1_metric / 1000).toFixed(3),
      (r.file2_metric / 1000).toFixed(3),
      (r.difference / 1000).toFixed(3),
    ]);
    const csv = [header, ...rows]
      .map((row) =>
        row
          .map((cell) => {
            const s = String(cell);
            return s.includes(",") || s.includes('"')
              ? `"${s.replace(/"/g, '""')}"`
              : s;
          })
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `main_cost_driver_${projectKey ?? "export"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* ── Section: Title + Selected Project Dropdown ── */}
      <div>
        <h2 className="text-xl font-bold text-white">Main Cost Type Breakdown</h2>
        <p className="mt-3 text-sm font-medium text-slate-400">
          Selected Project
        </p>

        <div className="relative mt-2 inline-block w-full max-w-md">
          <button
            onClick={() => setIsDropdownOpen((v) => !v)}
            className="flex w-full items-center justify-between rounded border border-slate-700 bg-slate-900 px-4 py-2.5 text-left text-sm text-white hover:border-slate-600 transition-colors"
          >
            <span>{projectKey ?? "—"}</span>
            <ChevronDown
              size={16}
              className={`ml-2 shrink-0 text-slate-400 transition-transform ${
                isDropdownOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {isDropdownOpen && (
            <div className="absolute z-10 mt-1 w-full rounded border border-slate-700 bg-slate-900 p-3 shadow-xl">
              <p className="text-sm text-slate-300 leading-relaxed">
                {projectKey} — {data.project_meta.description} (
                {data.project_meta.client})
              </p>
            </div>
          )}
        </div>

        {/* Full description always visible when dropdown is closed */}
        {!isDropdownOpen && (
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-400">
            {projectKey} — {data.project_meta.description} (
            {data.project_meta.client})
          </p>
        )}
      </div>

      {/* ── Section: Horizontal Bar Chart ── */}
      <div>
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-300">
          Main Cost Type Differences
        </h3>
        <Card className="p-4 overflow-x-auto">
          <MainCostTypeChart data={chartData} />
        </Card>
      </div>

      {/* ── Section: Sortable Data Table ── */}
      <Card className="overflow-hidden">
        {/* Table toolbar */}
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2">
          <span className="text-xs text-slate-500">
            {sortedRows.length} cost types
          </span>
          <button
            onClick={handleDownloadCsv}
            title="Download as CSV"
            className="rounded p-1 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            {/* Simple download icon using SVG */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900 text-slate-400">
              <tr>
                {/* Row index — not sortable */}
                <th className="w-10 px-4 py-3 text-xs font-medium uppercase tracking-wider text-slate-500">
                  #
                </th>
                <SortableHeader
                  label="category"
                  column="category"
                  align="left"
                  currentSort={sortColumn}
                  currentDirection={sortDirection}
                  onSort={handleSort}
                />
                <SortableHeader
                  label="file1_metric"
                  column="file1_metric"
                  align="right"
                  currentSort={sortColumn}
                  currentDirection={sortDirection}
                  onSort={handleSort}
                />
                <SortableHeader
                  label="file2_metric"
                  column="file2_metric"
                  align="right"
                  currentSort={sortColumn}
                  currentDirection={sortDirection}
                  onSort={handleSort}
                />
                <SortableHeader
                  label="difference"
                  column="difference"
                  align="right"
                  currentSort={sortColumn}
                  currentDirection={sortDirection}
                  onSort={handleSort}
                />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {sortedRows.map((row, idx) => {
                const diffPositive = row.difference >= 0;
                return (
                  <tr
                    key={row.category}
                    className="hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="px-4 py-3 text-xs font-mono text-slate-500">
                      {idx}
                    </td>
                    <td className="px-4 py-3 text-slate-200">{row.category}</td>
                    <td className="px-4 py-3 text-right font-mono text-slate-300">
                      {fmtValue(row.file1_metric)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-slate-300">
                      {fmtValue(row.file2_metric)}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-mono font-semibold ${
                        diffPositive ? "text-red-400" : "text-green-400"
                      }`}
                    >
                      {fmtValue(row.difference)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
