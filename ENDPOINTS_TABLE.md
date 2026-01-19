# Backend API Endpoints Overview

| Endpoint  | Method | Purpose                                                  | Example Usage |
| --------- | ------ | -------------------------------------------------------- | ------------- |
| `/health` | GET    | Quick health check to confirm the API server is running. | ```bash       |

curl http://localhost:8000/health

````|
| `/api/projects/periods` | GET | Retrieve all valid YYYYMM periods from the database (used for UI filter dropdowns). | ```bash
curl http://localhost:8000/api/projects/periods
``` |
| `/api/projects/list` | GET | Retrieve all distinct project numbers available in the system (used for UI project filter). | ```bash
curl http://localhost:8000/api/projects/list
``` |
| `/api/analysis/forecast-comparison` | POST | Compare costs between two periods for a specific project and metric. | ```bash
curl -X POST "http://localhost:8000/api/analysis/forecast-comparison" \
  -H "Content-Type: application/json" \
  -d '{"from_period": "202301", "to_period": "202401", "project_no": 2208, "metric": "forecast_costs_at_completion"}'
``` |
| `/api/analysis/summary/{project_no}` | GET | Generate a human‑readable summary of a project's cost changes (useful for AI chat). | ```bash
curl "http://localhost:8000/api/analysis/summary/2208?from_period=202301&to_period=202401&metric=forecast_costs_at_completion"
``` |
| `/api/analysis/overall-summary` | POST | Get a collapsed summary for all projects in a specific period and metric. | ```bash
curl -X POST "http://localhost:8000/api/analysis/overall-summary" \
  -H "Content-Type: application/json" \
  -d '{"period": "202301", "metric": "forecast_costs_at_completion"}'
``` |

*All URLs assume the API is running locally on port **8000**.*
````
