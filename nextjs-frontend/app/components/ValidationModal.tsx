"use client";

import { useDashboardStore } from "@/app/store/useDashboardStore";
import { X } from "lucide-react";

export function ValidationModal() {
  const { validationMessage, clearValidation } = useDashboardStore();

  if (!validationMessage) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-slate-800 border border-slate-700 rounded-lg shadow-2xl p-6 max-w-md w-full mx-4">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Validation Error</h3>
          <button
            onClick={clearValidation}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <p className="text-slate-300 mb-6">{validationMessage}</p>
        
        <button
          onClick={clearValidation}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors"
        >
          OK
        </button>
      </div>
    </div>
  );
}
