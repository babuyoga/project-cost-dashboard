export const MOCK_PERIODS = ['202305', '202306', '202307'];

export const MOCK_PROJECTS = [101, 102, 103];

export const MOCK_OVERALL_SUMMARY = [
  {
    iProjNo: 101,
    iProjYear: 2023,
    cClientDesc: "Mock Client A",
    cProjDesc: "Alpha Project (Mock)",
    forecast_costs_at_completion: 150000,
    ytd_actual: 120000
  },
  {
    iProjNo: 102,
    iProjYear: 2023,
    cClientDesc: "Mock Client B",
    cProjDesc: "Beta Project (Mock)",
    forecast_costs_at_completion: 250000,
    ytd_actual: 200000
  },
  {
    iProjNo: 103,
    iProjYear: 2023,
    cClientDesc: "Mock Client C",
    cProjDesc: "Gamma Project (Mock)",
    forecast_costs_at_completion: 95000,
    ytd_actual: 45000
  }
];

export const MOCK_FORECAST_COMPARISON = {
  projects: {
    "101": {
      project_meta: { description: "Alpha Project (Mock)", client: "Mock Client A" },
      total_forecast_costs_at_completion: {
        period1: "202305", period2: "202306", file1: 140000, file2: 150000, difference: 10000
      },
      total_ytd_actual: {
        period1: "202305", period2: "202306", file1: 110000, file2: 120000, difference: 10000
      },
      costline_increases_trajectory: [
        {
          category: "Labor",
          file1_metric: 80000,
          file2_metric: 85000,
          difference: 5000,
          subcategories: []
        }
      ]
    },
    "102": {
        project_meta: { description: "Beta Project (Mock)", client: "Mock Client B" },
        total_forecast_costs_at_completion: {
          period1: "202305", period2: "202306", file1: 200000, file2: 250000, difference: 50000
        },
        total_ytd_actual: {
          period1: "202305", period2: "202306", file1: 180000, file2: 200000, difference: 20000
        },
        costline_increases_trajectory: [
          {
            category: "Materials",
            file1_metric: 50000,
            file2_metric: 90000,
            difference: 40000,
            subcategories: []
          }
        ]
      },
      "103": {
        project_meta: { description: "Gamma Project (Mock)", client: "Mock Client C" },
        total_forecast_costs_at_completion: {
          period1: "202305", period2: "202306", file1: 90000, file2: 95000, difference: 5000
        },
        total_ytd_actual: {
          period1: "202305", period2: "202306", file1: 40000, file2: 45000, difference: 5000
        },
        costline_increases_trajectory: [
            {
              category: "Equipment",
              file1_metric: 10000,
              file2_metric: 12000,
              difference: 2000,
              subcategories: []
            }
          ]
      }
  }
};
