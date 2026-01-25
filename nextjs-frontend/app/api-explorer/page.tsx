"use client";

import { useState } from "react";
import { useAuthGuard } from "@/app/hooks/useAuthGuard";
import { useRouter } from "next/navigation";

// --- Endpoint Definitions ---
type EndpointConfig = {
  name: string;
  method: "GET" | "POST";
  path: string;
  description: string;
  defaultParams?: Record<string, string>;
  defaultBody?: Record<string, any>;
};

const ENDPOINTS: EndpointConfig[] = [
  {
    name: "List Periods",
    method: "GET",
    path: "/projects/periods",
    description: "Get available YYYYMM periods.",
  },
  {
    name: "List Projects",
    method: "GET",
    path: "/projects/list",
    description: "Get available project numbers.",
  },
  {
    name: "Forecast Comparison",
    method: "POST",
    path: "/analysis/forecast-comparison",
    description: "Compare costs between two periods.",
    defaultBody: {
      from_period: "202301",
      to_period: "202401",
      project_no: 2208,
      metric: "forecast_costs_at_completion",
    },
  },
  {
    name: "Project Summary",
    method: "GET",
    path: "/analysis/summary/{project_no}",
    description: "Get human-readable summary.",
    defaultParams: {
      project_no: "2208",
      from_period: "202301",
      to_period: "202401",
      metric: "forecast_costs_at_completion",
    },
  },
  {
    name: "Overall Summary",
    method: "POST",
    path: "/analysis/overall-summary",
    description: "Collapsed summary for all projects.",
    defaultBody: {
      period: "202301",
      metric: "forecast_costs_at_completion",
    },
  },
];

export default function ApiExplorerPage() {
  const { loading: authLoading, authorized } = useAuthGuard();
  const [selectedEndpoint, setSelectedEndpoint] = useState<EndpointConfig>(
    ENDPOINTS[0],
  );
  const [baseUrl, setBaseUrl] = useState<"frontend" | "backend">("frontend");

  // State for inputs
  const [params, setParams] = useState<Record<string, string>>({});
  const [body, setBody] = useState<string>("");

  // State for execution
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize defaults when endpoint changes
  const handleEndpointChange = (endpoint: EndpointConfig) => {
    setSelectedEndpoint(endpoint);
    setParams(endpoint.defaultParams || {});
    setBody(
      endpoint.defaultBody ? JSON.stringify(endpoint.defaultBody, null, 2) : "",
    );
    setResponse(null);
    setError(null);
  };

  const handleExecute = async () => {
    setLoading(true);
    setResponse(null);
    setError(null);

    const base = baseUrl === "frontend" ? "/api" : "http://localhost:8000/api";

    // Replace path params and build query string
    let url = base + selectedEndpoint.path;
    const queryParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`{${key}}`)) {
        url = url.replace(`{${key}}`, value);
      } else {
        queryParams.append(key, value);
      }
    });

    if (
      selectedEndpoint.method === "GET" &&
      Array.from(queryParams).length > 0
    ) {
      url += `?${queryParams.toString()}`;
    }

    try {
      const options: RequestInit = {
        method: selectedEndpoint.method,
        headers: {
          "Content-Type": "application/json",
        },
      };

      if (selectedEndpoint.method === "POST" && body) {
        // Validate JSON
        try {
          JSON.parse(body);
        } catch (e) {
          throw new Error("Invalid JSON in body");
        }
        options.body = body;
      }

      console.log(`Fetching: ${url}`);
      const res = await fetch(url, options);

      const data = await res.json();
      setResponse({
        status: res.status,
        statusText: res.statusText,
        data: data,
      });
    } catch (err: any) {
      setError(err.message || "Request failed");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#020b1c]">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  if (!authorized) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#020b1c] text-slate-100 p-8 flex flex-col gap-6">
      <header>
        <h1 className="text-3xl font-bold text-white mb-2">API Explorer</h1>
        <p className="text-slate-400">
          Interactive testing for Frontend and Backend APIs.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
        {/* Sidebar: Endpoint Selector */}
        <div className="lg:col-span-3 bg-[#0f172a] rounded-lg border border-slate-800 p-4 flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Endpoints
          </h2>
          {ENDPOINTS.map((endpoint, idx) => (
            <button
              key={idx}
              onClick={() => handleEndpointChange(endpoint)}
              className={`text-left px-4 py-3 rounded-md transition-colors border-l-4 ${
                selectedEndpoint.name === endpoint.name
                  ? "bg-blue-900/50 border-blue-500 text-blue-100"
                  : "bg-transparent border-transparent text-slate-400 hover:bg-[#1e293b]"
              }`}
            >
              <div className="font-medium">{endpoint.name}</div>
              <div className="text-xs mt-1 flex gap-2">
                <span
                  className={`uppercase font-bold ${endpoint.method === "GET" ? "text-green-400" : "text-orange-400"}`}
                >
                  {endpoint.method}
                </span>
                <span className="opacity-70 truncate">{endpoint.path}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Main Content: Configuration & Response */}
        <div className="lg:col-span-9 flex flex-col gap-6">
          {/* Configuration Panel */}
          <div className="bg-[#0f172a] rounded-lg border border-slate-800 p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-1">
                  {selectedEndpoint.name}
                </h2>
                <p className="text-slate-400 text-sm">
                  {selectedEndpoint.description}
                </p>
              </div>
              <div className="flex bg-[#1e293b] rounded-lg p-1">
                <button
                  onClick={() => setBaseUrl("frontend")}
                  className={`px-3 py-1.5 text-sm rounded-md transition-all ${baseUrl === "frontend" ? "bg-blue-600 text-white shadow-sm" : "text-slate-400 hover:text-white"}`}
                >
                  Next.js Proxy
                </button>
                <button
                  onClick={() => setBaseUrl("backend")}
                  className={`px-3 py-1.5 text-sm rounded-md transition-all ${baseUrl === "backend" ? "bg-purple-600 text-white shadow-sm" : "text-slate-400 hover:text-white"}`}
                >
                  Direct Backend
                </button>
              </div>
            </div>

            {/* Params Section */}
            {selectedEndpoint.defaultParams && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-slate-300 mb-3">
                  Path / Query Parameters
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.keys(selectedEndpoint.defaultParams).map((key) => (
                    <div key={key}>
                      <label className="block text-xs text-slate-500 mb-1 font-mono">
                        {key}
                      </label>
                      <input
                        type="text"
                        value={params[key] || ""}
                        onChange={(e) =>
                          setParams((prev) => ({
                            ...prev,
                            [key]: e.target.value,
                          }))
                        }
                        className="w-full bg-[#1e293b] border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Body Section */}
            {selectedEndpoint.method === "POST" && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-slate-300 mb-3">
                  Request Body (JSON)
                </h3>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full h-40 bg-[#1e293b] border border-slate-700 rounded p-3 text-sm font-mono text-slate-300 focus:outline-none focus:border-blue-500"
                />
              </div>
            )}

            <button
              onClick={handleExecute}
              disabled={loading}
              className={`w-full py-2.5 rounded-lg font-medium transition-all ${
                loading
                  ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                  : "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20"
              }`}
            >
              {loading ? "Executing Request..." : "Send Request"}
            </button>
          </div>

          {/* Result Panel */}
          <div className="bg-[#0f172a] rounded-lg border border-slate-800 p-6 flex-1 flex flex-col min-h-[400px]">
            <h3 className="text-sm font-semibold text-slate-400 mb-4 flex justify-between items-center">
              Response
              {response && (
                <span
                  className={`text-xs px-2 py-1 rounded ${response.status >= 200 && response.status < 300 ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}
                >
                  {response.status} {response.statusText}
                </span>
              )}
            </h3>

            <div className="flex-1 bg-[#020b1c] rounded border border-slate-800 p-4 font-mono text-xs overflow-auto">
              {error ? (
                <div className="text-red-400">Error: {error}</div>
              ) : response ? (
                <pre className="text-green-300">
                  {JSON.stringify(response.data, null, 2)}
                </pre>
              ) : (
                <div className="text-slate-600 h-full flex items-center justify-center italic">
                  Select an endpoint and click "Send Request" to see results
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
