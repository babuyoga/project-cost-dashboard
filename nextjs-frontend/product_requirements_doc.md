# Project Reference & Technical Specification: Finance Cost Monitoring Dashboard

> [!IMPORTANT] > **Unified Source of Truth**: This document serves as both the **Product Requirements Document (PRD)** and the **Technical Specification**. It describes _what_ we are building (User Requirements) and _how_ we are building it (Technical Implementation).
> **UI State Management**: Global UI state is managed strictly via **Zustand** stores.

---

# Part 1: Product Requirements (PRD)

## 1. Overview

The **Finance Cost Monitoring Dashboard** is a high-fidelity analytics tool allowing finance teams to monitor project cost variances. It enables users to compare "Forecast Costs at Completion" (EAC) or "YTD Actuals" between two specific reporting periods (e.g., Jan 2019 vs. Jan 2020) and drill down to find the root cause of variances.

## 2. User User Experience & Views

The application consists of a persistent **Sidebar** for filtering and a **Main Content Area** with 6 tabs for different analytical views.

### 2.1. Global Filters (Sidebar)

Users must select the following before analyzing data:

- **From Period**: The baseline month (e.g., "January-2019").
- **To Period**: The comparison month (e.g., "January-2020").
- **Project**: The specific project to analyze.
- **Metric**: The financial metric (EAC or YTD).
- **Action**: A "Run Analysis" button triggers the data update.

### 2.2. Analytical Views (Tabs)

1.  **Overall Summary**: A leaderboard showing which projects had the highest cost movements across the portfolio (Snapshot or Difference).
2.  **Project Summary**: High-level KPI card and trend line for the selected project.
3.  **Main Cost Driver**: Breakdown of variance by top-level cost categories (e.g., Subcontractors, Materials).
4.  **Sub Categories**: Drill-down into specific sub-types (e.g., Subcontractors -> Civil Works).
5.  **Sub-Subcategories**: Lowest level atomic cost items (e.g., Civil Works -> Concrete).
6.  **Cost Trajectory Explorer**: A hierarchical tree view allowing interactive expansion of all cost levels.

---

# Part 2: Technical Specification

## 3. Technology Stack & Architecture

- **Framework**: Next.js 14+ (App Router).
- **Language**: TypeScript.
- **Styling**: Tailwind CSS (Custom Dark Mode Theme).
- **State Management**: **Zustand** (Global Store).
- **Data Fetching**: Client-side fetch (useEffect/SWR) triggered by Zustand state changes.
- **Visualizations**: Recharts.

## 4. State Management (Zustand)

We use a single global store to manage the filter state and trigger analysis.

### `store/useDashboardStore.ts`

```typescript
interface DashboardState {
  // Selections
  fromPeriod: string; // e.g., "201901"
  toPeriod: string; // e.g., "202001"
  selectedProject: number | null;
  metric: "forecast_costs_at_completion" | "ytd_actual";

  // Dashboard State
  activeTab: string; // 'overall' | 'project' | 'main_driver' | ...
  isAnalysisRunning: boolean;

  // Actions
  setFromPeriod: (period: string) => void;
  setToPeriod: (period: string) => void;
  setSelectedProject: (projectId: number) => void;
  setMetric: (metric: string) => void;
  setActiveTab: (tab: string) => void;

  // Triggers
  runAnalysis: () => void; // Sets isAnalysisRunning=true, meant to trigger data fetchers
}
```

## 5. Component Architecture

### 5.1. Directory Structure

```
app/
├── layout.tsx              # Root Layout (Providers)
├── page.tsx                # Main Entry (Sidebar + TabContainer)
└── components/
    ├── dashboard/
    │   ├── Sidebar.tsx     # Filter Inputs (Zustand Writer)
    │   ├── TabNavigation.tsx # Tab Switcher (Zustand Writer/Reader)
    │   ├── views/
    │   │   ├── OverallSummary.tsx
    │   │   ├── ProjectSummary.tsx
    │   │   ├── MainCostDriver.tsx
    │   │   ├── SubCategories.tsx
    │   │   ├── SubSubCategories.tsx
    │   │   └── TrajectoryExplorer.tsx
    │   └── charts/
    │       ├── VarianceBarChart.tsx # Reusable Recharts component
    │       └── TrendLineChart.tsx
    └── ui/                 # Shared Atoms (Card, Button, Select)
```

### 5.2. Component Specifications

#### `Sidebar.tsx`

- **Connects to**: `useDashboardStore`
- **Logic**:
  - Fetches filter options (`/projects/periods`, `/projects/list`) on mount.
  - Updates store values on change.
  - `Run Analysis` button calls `runAnalysis()` in store.

#### `TabNavigation.tsx`

- **Connects to**: `useDashboardStore` (reads/writes `activeTab`).
- **Visuals**: Horizontal list of links. Active tab highlighted in Blue (#3b82f6).

#### View Components (The Tabs)

All view components follow this pattern:

1.  **Watch**: Listen to `isAnalysisRunning` or `selectedProject` from Zustand.
2.  **Fetch**: When triggered, call the API `POST /analysis/forecast-comparison`.
3.  **Render**: Display specific slice of the returned data.

**1. `OverallSummary.tsx`**

- **API**: `POST /analysis/overall-summary`
- **Display**: Table of projects sorted by `difference`.
- **Columns**: `Project`, `Client`, `Value` (Snapshot), `Difference` (if available).

**2. `ProjectSummary.tsx`**

- **API**: `POST /analysis/forecast-comparison` (Full payload)
- **Data Slice**: `data.project_meta`
- **Components**:
  - KPI Cards: Total P1, Total P2, Difference.
  - `TrendLineChart`: Simple 2-point line chart (P1 -> P2).

**3. `MainCostDriver.tsx`**

- **Data Slice**: `data.costline_increases_trajectory` (Top level array).
- **Components**:
  - `VarianceBarChart`: Horizontal bars.
    - Red bar for positive difference (Cost Increase).
    - Green bar for negative difference (Savings).

**4. `SubCategories.tsx`**

- **Data Slice**: `data.costline_increases_trajectory[].subcategories`.
- **Interaction**: Adds a local dropdown to filter by "Main Cost Type".

**5. `TrajectoryExplorer.tsx`**

- **Data Slice**: Full nested JSON.
- **Component**: Recursive Accordion Tree.
  - Row: `[+] Category Name   |   $Value1   |   $Value2   |   $Diff`.
  - State: Local `isOpen` state for expansion.

---

## 6. API Integration & Data Models

### Endpoints

| Component       | Endpoint                        | Method | Payload                                        |
| :-------------- | :------------------------------ | :----- | :--------------------------------------------- |
| Sidebar         | `/projects/periods`             | GET    | -                                              |
| Sidebar         | `/projects/list`                | GET    | -                                              |
| Overall Summary | `/analysis/overall-summary`     | POST   | `{period, metric}`                             |
| Analysis Views  | `/analysis/forecast-comparison` | POST   | `{from_period, to_period, project_no, metric}` |

### TypeScript Interfaces

```typescript
// Shared Types
export interface ProjectAnalysis {
  project_meta: { description: string; client: string };
  costline_increases_trajectory: CostlineTrajectory[];
  // ... other fields
}

export interface CostlineTrajectory {
  category: string;
  file1_metric: number;
  file2_metric: number;
  difference: number;
  subcategories: CostlineSubcategory[];
}
```

---

## 7. Design System (Visual Specs)

**Theme**: Dark Mode Corporate Financial.

- **Palette**:

  - `bg-slate-950` (#020b1c) - App Background
  - `bg-slate-900` (#0b172a) - Component Background
  - `text-white` - Primary Text
  - `text-slate-400` - Secondary Text
  - `bg-blue-600` - Primary Action
  - `text-red-500` - Cost Increase
  - `text-green-500` - Cost Decrease

- **Layout**:
  - Sidebar Width: `280px` (Fixed).
  - Main Content: `flex-1`, `p-8`.
  - Gap: `gap-6` between cards.
