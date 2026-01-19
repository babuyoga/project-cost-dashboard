# Frontend ↔ Backend Mapping

This document maps each Next.js frontend API function (and its route) to the corresponding FastAPI backend endpoint.

| Frontend Function (file)                                                                                           | Frontend API Route (Next.js)               | Backend FastAPI Route                | HTTP Method | Description                                                       |
| ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------ | ------------------------------------ | ----------- | ----------------------------------------------------------------- |
| `fetchPeriods()` – **app/lib/api.ts**                                                                              | `/api/projects/periods` (GET)              | `/api/projects/periods`              | GET         | Returns all valid YYYYMM periods for UI filters.                  |
| `fetchProjects()` – **app/lib/api.ts**                                                                             | `/api/projects/list` (GET)                 | `/api/projects/list`                 | GET         | Returns distinct project numbers for the project selector.        |
| `fetchOverallSummary(period, metric)` – **app/lib/api.ts**                                                         | `/api/analysis/overall-summary` (POST)     | `/api/analysis/overall-summary`      | POST        | Collapsed summary for all projects in a given period/metric.      |
| `fetchForecastComparison(from, to, projectNo, metric)` – **app/lib/api.ts**                                        | `/api/analysis/forecast-comparison` (POST) | `/api/analysis/forecast-comparison`  | POST        | Compares costs between two periods for a specific project/metric. |
| `fetchProjectSummary(projectNo, from, to, metric)` – **app/lib/api.ts** (via GET `/analysis/summary/{project_no}`) | `/api/analysis/summary/{project_no}` (GET) | `/api/analysis/summary/{project_no}` | GET         | Generates a human‑readable summary for a single project.          |

## How the Calls Flow

1. **Frontend API Route Files** (`app/api/.../route.ts`) act as thin proxies. They forward requests to the FastAPI server (default `http://backend:8000` or `process.env.API_URL`). If the backend is unreachable, they return mock data.
2. **FastAPI Routers** (`backend-api/app/routers/...`) implement the actual logic:
   - `projects.router` provides `/periods` and `/list`.
   - `analysis.router` provides `/forecast-comparison`, `/summary/{project_no}`, and `/overall-summary`.
3. The frontend helper functions ultimately hit the matching FastAPI endpoints listed above.

_All URLs assume the API runs locally on port **8000** (or the `API_URL` env var)._
