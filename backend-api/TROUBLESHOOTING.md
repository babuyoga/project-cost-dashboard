# Backend API Troubleshooting Guide

This guide helps you verify that the backend API is working correctly and inspect endpoint outputs.

## 🚀 Quick Status Check

Run this command to check if the server is up and running:

```bash
curl http://localhost:8000/health
# Expected: {"status":"healthy"}
```

## 📚 Endpoint Reference

### 1. Project Helpers

These endpoints provide data for UI filters.

#### **List Available Periods**

Get all valid YYYYMM periods from the database.

```bash
curl http://localhost:8000/api/projects/periods
```

**Expected Output:**

```json
{ "periods": ["202301", "202302", "202303", ...] }
```

#### **List Available Projects**

Get all project numbers.

```bash
curl http://localhost:8000/api/projects/list
```

**Expected Output:**

```json
{ "projects": [2035, 2121, 2171, ...] }
```

---

### 2. Analysis Endpoints

Core logic for cost comparisons.

#### **Forecast Comparison**

Compares costs between two periods for a specific project.

**Method:** `POST`
**URL:** `http://localhost:8000/api/analysis/forecast-comparison`

**Curl Command:**

```bash
curl -X POST "http://localhost:8000/api/analysis/forecast-comparison" \
  -H "Content-Type: application/json" \
  -d '{
    "from_period": "202301",
    "to_period": "202401",
    "project_no": 2208,
    "metric": "forecast_costs_at_completion"
  }'
```

**Common Errors:**

- `404 Not Found`: "No data found for period X" -> Check database/Excel files.
- `422 Validation Error`: Invalid JSON format -> Check quotes and commas.

#### **Project Summary (Text)**

Generates a human-readable summary for AI chat.

**Method:** `GET`
**URL:** `http://localhost:8000/api/analysis/summary/{project_no}`

**Curl Command:**

```bash
curl "http://localhost:8000/api/analysis/summary/2208?from_period=202301&to_period=202401&metric=forecast_costs_at_completion"
```

#### **Overall Summary**

Get a collapsed summary for all projects in a specific period.

**Method:** `POST`
**URL:** `http://localhost:8000/api/analysis/overall-summary`

**Curl Command:**

```bash
curl -X POST "http://localhost:8000/api/analysis/overall-summary" \
  -H "Content-Type: application/json" \
  -d '{
    "period": "202301",
    "metric": "forecast_costs_at_completion"
  }'
```

---

## 🛠️ Testing Tools

### Option A: Swagger UI (Browser)

Interactive documentation where you can try out endpoints.

1. Open **http://localhost:8000/docs**
2. Click "Try it out" on any endpoint.
3. Fill inputs and click "Execute".

### Option B: Postman / Insomnia

Import the OpenAPI spec directly:

- **URL:** `http://localhost:8000/openapi.json`
- This will auto-import all endpoints with correct parameters.

## ❓ Common Issues

| Issue                  | Solution                                                                  |
| ---------------------- | ------------------------------------------------------------------------- |
| **Connection Refused** | Ensure server is running (`uvicorn app.main:app --reload`).               |
| **500 Internal Error** | Check console logs. Usually database connection failed or missing `.env`. |
| **Empty Data**         | Verify `TEST_MODE` in `.env`. If `true`, check Excel files exist.         |
