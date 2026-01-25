# Next.js Frontend Architecture Documentation

## Overview
The `nextjs-frontend` application is a Next.js 16 application with the App Router. It uses SQLite (via `better-sqlite3`) for local data and proxies some requests to a FastAPI backend.

---

## API Endpoints

All API routes are located in `app/api/` and are **Server Components** (Next.js Route Handlers).

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | User login with session creation and cookie setting |

### Admin - Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/users` | List all users |
| POST | `/api/admin/users` | Create a new user |
| GET | `/api/admin/users/[userId]` | Get a single user |
| PUT | `/api/admin/users/[userId]` | Update user (username, enabled, isAdmin) |
| DELETE | `/api/admin/users/[userId]` | Delete user |
| POST | `/api/admin/users/[userId]/enable` | Enable a user |
| POST | `/api/admin/users/[userId]/disable` | Disable a user |
| PATCH | `/api/admin/users/[userId]/password` | Update user password |
| POST | `/api/admin/users/[userId]/invalidate-sessions` | Invalidate all sessions for a user |

### Admin - Sessions

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/sessions` | List all sessions |
| DELETE | `/api/admin/sessions/[sessionId]` | Invalidate a specific session |

### Admin - Utilities

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/password-hash` | Generate bcrypt hash for a password |

### Projects (Backend Proxy)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects/list` | Proxy to backend - list projects |
| GET | `/api/projects/periods` | Proxy to backend - list periods |

### Analysis (Backend Proxy)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/analysis/forecast-comparison` | Proxy to backend - compare costs between periods |
| POST | `/api/analysis/overall-summary` | Proxy to backend - overall project summary |

---

## Pages

All pages use the App Router convention ([page.tsx](file:///Users/jerryjose/Code/cost-dashboard/nextjs-frontend/app/page.tsx)).

| Path | File | Component Type | Description |
|------|------|----------------|-------------|
| `/` | [app/page.tsx](file:///Users/jerryjose/Code/cost-dashboard/nextjs-frontend/app/page.tsx) | **Client** | Login page |
| `/admin` | [app/admin/page.tsx](file:///Users/jerryjose/Code/cost-dashboard/nextjs-frontend/app/admin/page.tsx) | **Client** | User management (admin) |
| `/admin/session` | [app/admin/session/page.tsx](file:///Users/jerryjose/Code/cost-dashboard/nextjs-frontend/app/admin/session/page.tsx) | **Client** | Session management (admin) |
| `/api-explorer` | [app/api-explorer/page.tsx](file:///Users/jerryjose/Code/cost-dashboard/nextjs-frontend/app/api-explorer/page.tsx) | **Client** | Interactive API testing tool |
| `/dashboard` | [app/dashboard/page.tsx](file:///Users/jerryjose/Code/cost-dashboard/nextjs-frontend/app/dashboard/page.tsx) | **Client** | Main cost monitoring dashboard |

---

## Components

### UI Components (`app/components/ui/`)

| Component | File | Type | Description |
|-----------|------|------|-------------|
| Button | [button.tsx](file:///Users/jerryjose/Code/cost-dashboard/nextjs-frontend/app/components/ui/button.tsx) | **Server** | Reusable button component |
| Card | [card.tsx](file:///Users/jerryjose/Code/cost-dashboard/nextjs-frontend/app/components/ui/card.tsx) | **Server** | Card container component |
| ConfirmationModal | [ConfirmationModal.tsx](file:///Users/jerryjose/Code/cost-dashboard/nextjs-frontend/app/components/ui/ConfirmationModal.tsx) | **Client** | Modal for delete/action confirmation |

### Admin Components (`app/components/admin/`)

| Component | File | Type | Description |
|-----------|------|------|-------------|
| AdminSidebar | [AdminSidebar.tsx](file:///Users/jerryjose/Code/cost-dashboard/nextjs-frontend/app/components/admin/AdminSidebar.tsx) | **Client** | Admin navigation sidebar |

### Dashboard Components (`app/components/dashboard/`)

| Component | File | Type | Description |
|-----------|------|------|-------------|
| Sidebar | [Sidebar.tsx](file:///Users/jerryjose/Code/cost-dashboard/nextjs-frontend/app/components/dashboard/Sidebar.tsx) | **Client** | Dashboard parameter selector sidebar |
| TabNavigation | [TabNavigation.tsx](file:///Users/jerryjose/Code/cost-dashboard/nextjs-frontend/app/components/dashboard/TabNavigation.tsx) | **Client** | Tab navigation for dashboard views |
| DataFetcher | [DataFetcher.tsx](file:///Users/jerryjose/Code/cost-dashboard/nextjs-frontend/app/components/dashboard/DataFetcher.tsx) | **Client** | Centralized data fetching component |

### Dashboard Views (`app/components/dashboard/views/`)

| Component | File | Type | Description |
|-----------|------|------|-------------|
| OverallSummary | [OverallSummary.tsx](file:///Users/jerryjose/Code/cost-dashboard/nextjs-frontend/app/components/dashboard/views/OverallSummary.tsx) | **Client** | Overall project summary view |
| ProjectSummary | [ProjectSummary.tsx](file:///Users/jerryjose/Code/cost-dashboard/nextjs-frontend/app/components/dashboard/views/ProjectSummary.tsx) | **Client** | Individual project summary view |
| TrajectoryExplorer | [TrajectoryExplorer.tsx](file:///Users/jerryjose/Code/cost-dashboard/nextjs-frontend/app/components/dashboard/views/TrajectoryExplorer.tsx) | **Client** | Time-series trajectory view |
| CostBreakdownView | [CostBreakdownView.tsx](file:///Users/jerryjose/Code/cost-dashboard/nextjs-frontend/app/components/dashboard/views/CostBreakdownView.tsx) | **Client** | Cost breakdown charts |
| index | [index.tsx](file:///Users/jerryjose/Code/cost-dashboard/nextjs-frontend/app/components/dashboard/views/index.tsx) | **Server** | Re-exports MainCostDriver, SubCategories, SubSubCategories |

### Dashboard Charts (`app/components/dashboard/charts/`)

| Component | File | Type | Description |
|-----------|------|------|-------------|
| TrendLineChart | [TrendLineChart.tsx](file:///Users/jerryjose/Code/cost-dashboard/nextjs-frontend/app/components/dashboard/charts/TrendLineChart.tsx) | **Client** | Line chart for trends |
| VarianceBarChart | [VarianceBarChart.tsx](file:///Users/jerryjose/Code/cost-dashboard/nextjs-frontend/app/components/dashboard/charts/VarianceBarChart.tsx) | **Client** | Bar chart for variance |

### Shared Components (`app/components/`)

| Component | File | Type | Description |
|-----------|------|------|-------------|
| DataSourceBanner | [DataSourceBanner.tsx](file:///Users/jerryjose/Code/cost-dashboard/nextjs-frontend/app/components/DataSourceBanner.tsx) | **Client** | Banner showing data source status |
| MockDataBanner | [MockDataBanner.tsx](file:///Users/jerryjose/Code/cost-dashboard/nextjs-frontend/app/components/MockDataBanner.tsx) | **Client** | Banner indicating mock data usage |
| ValidationModal | [ValidationModal.tsx](file:///Users/jerryjose/Code/cost-dashboard/nextjs-frontend/app/components/ValidationModal.tsx) | **Client** | Modal for parameter validation errors |

---

## State Management

- **Zustand** store located at `app/store/useDashboardStore.ts` for dashboard state (selected project, periods, active tab, analysis results, etc.)

## Database

- **SQLite** via `better-sqlite3`
- Database file: [cost-dashboard.db](file:///Users/jerryjose/Code/cost-dashboard/nextjs-frontend/cost-dashboard.db)
- Tables: `users`, `sessions`

## Key Libraries

| Library | Purpose |
|---------|---------|
| `next` (16.1.2) | React framework |
| `react` (19.2.3) | UI library |
| `zustand` | State management |
| `better-sqlite3` | SQLite database |
| `bcryptjs` | Password hashing |
| `uuid` | UUID generation |
| `recharts` | Charting library |
| `lucide-react` | Icon library |
