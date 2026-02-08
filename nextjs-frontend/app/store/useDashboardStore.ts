import { create } from 'zustand';
import { ProjectAnalysis } from '../lib/api';

interface DashboardState {
  // Selections
  fromPeriod: string; 
  toPeriod: string; 
  selectedProject: number | 'OVERALL' | null;
  metric: 'forecast_costs_at_completion' | 'ytd_actual';

  // Dashboard State
  activeTab: string; // 'overall' | 'project' | 'main_driver' | 'sub_categories' | 'sub_sub_categories' | 'trajectory'

  isSidebarCollapsed: boolean;

  // Analysis & Processing State
  isAnalysisRunning: boolean;
  
  // Data Source Tracking
  dataSource: 'production' | 'test' | 'mock' | null;
  dataSourceUrl: string | null;

  // Analysis Data
  overallSummaryData: any[];
  projectAnalysisData: ProjectAnalysis | null;
  analysisLoading: boolean;
  analysisError: string | null;

  // Validation
  validationMessage: string | null;

  // Actions
  setFromPeriod: (period: string) => void;
  setToPeriod: (period: string) => void;
  setSelectedProject: (projectId: number | 'OVERALL') => void;
  setMetric: (metric: string) => void;
  setActiveTab: (tab: string) => void;
  toggleSidebar: () => void;

  // Triggers
  runAnalysis: () => void;
  setAnalysisFinished: () => void;
  setDataSource: (source: 'production' | 'test' | 'mock' | null, url?: string) => void;
  setAnalysisData: (overall: any[], project: ProjectAnalysis | null) => void;
  setAnalysisLoading: (loading: boolean) => void;
  setAnalysisError: (error: string | null) => void;
  clearValidation: () => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  fromPeriod: '',
  toPeriod: '',
  selectedProject: null,
  metric: 'forecast_costs_at_completion',
  activeTab: 'overall',
  isAnalysisRunning: false,
  isSidebarCollapsed: false,
  
  dataSource: null,
  dataSourceUrl: null,

  overallSummaryData: [],
  projectAnalysisData: null,
  analysisLoading: false,
  analysisError: null,

  validationMessage: null,

  setFromPeriod: (period) => set({ fromPeriod: period }),
  setToPeriod: (period) => set({ toPeriod: period }),
  setSelectedProject: (projectId) => set({ selectedProject: projectId }),
  setMetric: (metric) => set({ metric: metric as any }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),

  runAnalysis: () => set((state) => {
    // Validate filters
    const missing: string[] = [];
    if (!state.fromPeriod) missing.push("From Period");
    if (!state.toPeriod) missing.push("To Period");
    if (!state.selectedProject) missing.push("Project Number");

    if (missing.length > 0) {
      return { 
        validationMessage: `Please select the following to run analysis: ${missing.join(', ')}` 
      };
    }
    return { isAnalysisRunning: true, validationMessage: null };
  }),
  setAnalysisFinished: () => set({ isAnalysisRunning: false }),
  setDataSource: (source, url) => set({ dataSource: source, dataSourceUrl: url || null }),
  
  setAnalysisData: (overall, project) => set({ overallSummaryData: overall, projectAnalysisData: project }),
  setAnalysisLoading: (loading) => set({ analysisLoading: loading }),
  setAnalysisError: (error) => set({ analysisError: error }),
  clearValidation: () => set({ validationMessage: null }),
}));
