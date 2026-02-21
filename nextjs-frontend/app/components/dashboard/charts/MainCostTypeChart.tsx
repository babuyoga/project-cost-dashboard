"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ReferenceLine,
  Label,
} from "recharts";

interface MainCostTypeChartProps {
  data: { name: string; value: number }[];
}

/** Produces a continuous green→yellow→red gradient color based on ratio 0–1. */
function getDifferenceColor(value: number, maxPositive: number): string {
  if (value < 0) return "#ef4444"; // Red for negative differences

  const ratio = maxPositive === 0 ? 0 : Math.min(value / maxPositive, 1);

  if (ratio >= 0.5) {
    // Yellow (0.5) → Green (1.0)
    const t = (ratio - 0.5) * 2;
    const r = Math.round(234 * (1 - t) + 34 * t);
    const g = Math.round(179 * (1 - t) + 197 * t);
    const b = Math.round(8 * (1 - t) + 94 * t);
    return `rgb(${r},${g},${b})`;
  } else {
    // Red (0) → Yellow (0.5)
    const t = ratio * 2;
    const r = 239;
    const g = Math.round(68 + (179 - 68) * t);
    const b = Math.round(68 + (8 - 68) * t);
    return `rgb(${r},${g},${b})`;
  }
}

/** Vertical gradient legend bar shown to the right of the chart. */
function GradientLegend({ maxValue }: { maxValue: number }) {
  const steps = 5;
  return (
    <div className="ml-4 flex flex-col items-center gap-1 shrink-0">
      <span className="text-xs text-slate-400 mb-1">Difference</span>
      <div
        className="w-3 rounded"
        style={{
          height: "160px",
          background:
            "linear-gradient(to bottom, rgb(34,197,94), rgb(234,179,8), rgb(239,68,68))",
        }}
      />
      <div
        className="flex flex-col justify-between text-xs text-slate-400"
        style={{ height: "160px" }}
      >
        {Array.from({ length: steps }, (_, i) => {
          const val = maxValue * (1 - i / (steps - 1));
          return (
            <span key={i}>
              {val.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
          );
        })}
      </div>
    </div>
  );
}

/** A custom tooltip for the chart, showing the raw value in millions. */
function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded border border-slate-700 bg-slate-900 p-2 text-sm shadow-lg">
      <p className="text-slate-300 font-medium mb-1">{label}</p>
      <p className="text-white">
        Difference:{" "}
        <span className="font-mono">
          {(payload[0].value / 1000).toLocaleString(undefined, {
            minimumFractionDigits: 3,
            maximumFractionDigits: 3,
          })}
        </span>
      </p>
    </div>
  );
}

export function MainCostTypeChart({ data }: MainCostTypeChartProps) {
  const maxPositive = Math.max(...data.map((d) => d.value), 0);

  // Dynamic height: at least 300px, 40px per bar
  const chartHeight = Math.max(300, data.length * 42);

  return (
    <div className="flex items-start w-full">
      <div className="flex-1" style={{ minWidth: 0 }}>
        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart
            layout="vertical"
            data={data}
            margin={{ top: 5, right: 20, left: 10, bottom: 30 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis type="number" stroke="#94a3b8" tick={{ fontSize: 11 }}>
              <Label
                value="Difference (Current - Previous Period)"
                position="insideBottom"
                offset={-18}
                fill="#94a3b8"
                fontSize={11}
              />
            </XAxis>
            <YAxis
              dataKey="name"
              type="category"
              width={160}
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              stroke="#94a3b8"
              tickFormatter={(val: string) =>
                val.length > 22 ? val.slice(0, 20) + "…" : val
              }
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "#1e293b" }} />
            <ReferenceLine x={0} stroke="#475569" />
            <Bar dataKey="value" maxBarSize={28}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={getDifferenceColor(entry.value, maxPositive)}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <GradientLegend maxValue={maxPositive / 1000} />
    </div>
  );
}
