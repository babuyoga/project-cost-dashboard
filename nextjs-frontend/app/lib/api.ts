export const API_BASE_url = "/api"; // Use relative path for Next.js proxying
import { useDashboardStore } from "../store/useDashboardStore";

// Types
export interface ProjectAnalysis {
  project_meta: { description: string; client: string };
  total_forecast_costs_at_completion: MetricTotal;
  total_ytd_actual: MetricTotal;
  costline_increases_trajectory: CostlineTrajectory[];
}

export interface MetricTotal {
  period1: string;
  period2: string;
  file1: number;
  file2: number;
  difference: number;
}

export interface CostlineTrajectory {
  category: string;
  file1_metric: number;
  file2_metric: number;
  difference: number;
  subcategories: CostlineSubcategory[];
}

export interface CostlineSubcategory {
  category: string;
  file1_metric: number;
  file2_metric: number;
  difference: number;
  children: CostlineChild[];
}

export interface CostlineChild {
  category: string;
  file1_metric: number;
  file2_metric: number;
  difference: number;
}

function checkDataSource(res: Response) {
  const isMock = res.headers.get("x-mock-data") === "true";
  const isTest = res.headers.get("x-backend-test-mode") === "true";
  const url = res.headers.get("x-api-url") || "Backend API";

  if (isMock) {
    useDashboardStore.getState().setDataSource("mock", url);
  } else if (isTest) {
    useDashboardStore.getState().setDataSource("test", url);
  } else {
    // Production data - clear any previous mock/test indicators
    useDashboardStore.getState().setDataSource("production", url);
  }
}

export async function fetchPeriods(): Promise<string[]> {
  console.log(
    "[API] Fetching periods from:",
    `${API_BASE_url}/projects/periods`,
  );
  const res = await fetch(`${API_BASE_url}/projects/periods`);
  checkDataSource(res);
  if (!res.ok) {
    console.error(
      "[API] Failed to fetch periods. Status:",
      res.status,
      res.statusText,
    );
    throw new Error("Failed to fetch periods");
  }
  const data = await res.json();
  console.log(`[API] Fetched ${data.periods.length} periods:`, data.periods);
  return data.periods;
}

export async function fetchProjects(): Promise<number[]> {
  console.log("[API] Fetching projects from:", `${API_BASE_url}/projects/list`);
  const res = await fetch(`${API_BASE_url}/projects/list`);
  checkDataSource(res);
  if (!res.ok) {
    console.error(
      "[API] Failed to fetch projects. Status:",
      res.status,
      res.statusText,
    );
    throw new Error("Failed to fetch projects");
  }
  const data = await res.json();
  console.log(`[API] Fetched ${data.projects.length} projects:`, data.projects);
  return data.projects;
}

export async function fetchOverallSummary(
  period: string,
  metric: string,
): Promise<any[]> {
  console.log(
    "[API] Fetching overall summary. Period:",
    period,
    "Metric:",
    metric,
  );
  const res = await fetch(`${API_BASE_url}/analysis/overall-summary`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ period, metric }),
  });
  checkDataSource(res);
  if (!res.ok) {
    console.error(
      "[API] Failed to fetch overall summary. Status:",
      res.status,
      res.statusText,
    );
    throw new Error("Failed to fetch overall summary");
  }
  const data = await res.json();
  console.log(`[API] Fetched overall summary with ${data.length} projects`);
  return data;
}

export async function fetchForecastComparison(
  fromPeriod: string,
  toPeriod: string,
  projectNo: number,
  metric: string,
): Promise<{ projects: Record<string, ProjectAnalysis> }> {
  console.log("[API] Fetching forecast comparison");
  console.log(
    "  From:",
    fromPeriod,
    "-> To:",
    toPeriod,
    "| Project:",
    projectNo,
    "| Metric:",
    metric,
  );
  const res = await fetch(`${API_BASE_url}/analysis/forecast-comparison`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      from_period: fromPeriod,
      to_period: toPeriod,
      project_no: projectNo,
      metric,
    }),
  });
  checkDataSource(res);
  if (!res.ok) {
    console.error(
      "[API] Failed to fetch forecast comparison. Status:",
      res.status,
      res.statusText,
    );
    throw new Error("Failed to fetch comparison");
  }
  const data = await res.json();
  const numProjects = Object.keys(data.projects || {}).length;
  console.log(
    `[API] Fetched forecast comparison for ${numProjects} project(s)`,
  );
  return data;
}
