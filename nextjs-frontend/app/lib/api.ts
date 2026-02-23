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

// Helper to parse error response
async function getErrorMessage(res: Response): Promise<string> {
  try {
    const data = await res.json();
    if (data.error) return data.error;
    if (data.detail) return typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
  } catch (e) {
    // ignore json parse error
  }
  return res.statusText || `Request failed with status ${res.status}`;
}

function checkDataSource(res: Response) {
  // We ignoring 'x-mock-data' as we no longer support it
  const isTest = res.headers.get("x-backend-test-mode") === "true";
  const url = res.headers.get("x-api-url") || "Backend API";

  if (isTest) {
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
    const errorMsg = await getErrorMessage(res);
    console.warn(
      "[API] Failed to fetch periods. Status:",
      res.status,
      errorMsg
    );
    throw new Error(errorMsg);
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
    const errorMsg = await getErrorMessage(res);
    console.warn(
      "[API] Failed to fetch projects. Status:",
      res.status,
      errorMsg
    );
    throw new Error(errorMsg);
  }
  const data = await res.json();
  console.log(`[API] Fetched ${data.projects.length} projects:`, data.projects);
  return data.projects;
}

export async function fetchOverallSummary(
  periodFrom: string,
  periodTo: string,
  metric: string,
): Promise<any[]> {
  console.log(
    "[API] Fetching overall summary. Period:",
    periodFrom,
    "->",
    periodTo,
    "Metric:",
    metric,
  );
  const res = await fetch(`${API_BASE_url}/analysis/overall-summary`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ period_from: periodFrom, period_to: periodTo, metric }),
  });
  checkDataSource(res);
  if (!res.ok) {
    const errorMsg = await getErrorMessage(res);
    console.warn(
      "[API] Failed to fetch overall summary. Status:",
      res.status,
      errorMsg
    );
    throw new Error(errorMsg);
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
    const errorMsg = await getErrorMessage(res);
    console.warn(
      "[API] Failed to fetch forecast comparison. Status:",
      res.status,
      errorMsg
    );
    throw new Error(errorMsg);
  }
  const data = await res.json();
  const numProjects = Object.keys(data.projects || {}).length;
  console.log(
    `[API] Fetched forecast comparison for ${numProjects} project(s)`,
  );
  return data;
}

export async function fetchProjectSummary(
  projectNo: number,
  fromPeriod: string,
  toPeriod: string,
  metric: string,
): Promise<string> {
  console.log("[API] Fetching project summary for project:", projectNo);
  const res = await fetch(
    `${API_BASE_url}/analysis/summary/${projectNo}?from_period=${fromPeriod}&to_period=${toPeriod}&metric=${metric}`,
  );
  if (!res.ok) {
    const errorMsg = await getErrorMessage(res);
    console.warn("[API] Failed to fetch project summary. Status:", res.status, errorMsg);
    throw new Error(errorMsg);
  }
  const data = await res.json();
  console.log(`[API] Fetched project summary (${data.summary?.length || 0} chars)`);
  return data.summary;
}

export async function downloadXlsx(
  fromPeriod: string,
  toPeriod: string,
  projectNo: number,
  metric: string,
): Promise<Blob> {
  console.log("[API] Requesting Excel cost breakdown report for project:", projectNo);
  const res = await fetch(`${API_BASE_url}/download/xlsx`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      from_period: fromPeriod,
      to_period: toPeriod,
      project_no: projectNo,
      metric,
    }),
  });
  if (!res.ok) {
    const errorMsg = await getErrorMessage(res);
    console.warn("[API] Failed to download xlsx. Status:", res.status, errorMsg);
    throw new Error(errorMsg);
  }
  console.log("[API] Excel report received successfully");
  return res.blob();
}
