
"use client";

import { useEffect, useState, useMemo } from "react";
import { useDashboardStore } from "@/app/store/useDashboardStore";
import { ProjectAnalysis } from "@/app/lib/api";
import { Card } from "@/app/components/ui/card";
import { VarianceBarChart } from "@/app/components/dashboard/charts/VarianceBarChart";

interface CostBreakdownViewProps {
    depth: 'main' | 'sub' | 'subsub';
}

export function CostBreakdownView({ depth }: CostBreakdownViewProps) {
    const { metric, projectAnalysisData, analysisLoading } = useDashboardStore();
    
    // Local filters for drilling down
    const [selectedMain, setSelectedMain] = useState<string>("");
    const [selectedSub, setSelectedSub] = useState<string>("");

    // Use data from store
    const data = projectAnalysisData;

    // Derived data based on depth
    const viewData = useMemo(() => {
        if (!data) return [];
        
        if (depth === 'main') {
            return data.costline_increases_trajectory.map(c => ({
                name: c.category,
                value: c.difference,
                raw: c
            }));
        } else if (depth === 'sub') {
             // Need to filter by main category or show all? 
             // Usually showing all subcategories might be too much, but for MVP let's assume filtering.
             // If selectedMain is empty, show top 20 subcategories? Start with empty.
             if (!selectedMain) return [];
             
             const parent = data.costline_increases_trajectory.find(c => c.category === selectedMain);
             return parent ? parent.subcategories.map(s => ({
                 name: s.category,
                 value: s.difference,
                 raw: s
             })) : [];
        } else if (depth === 'subsub') {
             if (!selectedMain || !selectedSub) return [];
             const main = data.costline_increases_trajectory.find(c => c.category === selectedMain);
             if (!main) return [];
             const sub = main.subcategories.find(s => s.category === selectedSub);
             return sub ? sub.children.map(ch => ({
                 name: ch.category,
                 value: ch.difference,
                 raw: ch
             })) : [];
        }
        return [];
    }, [data, depth, selectedMain, selectedSub]);

    // Sorting by ABS difference for charts usually makes sense to see biggest drivers
    const sortedData = [...viewData].sort((a,b) => Math.abs(b.value) - Math.abs(a.value));

    if (analysisLoading) return <div className="text-white">Loading breakdown...</div>;
    if (!data) return <div className="text-slate-400">No data available.</div>;

    // Filter UI
    const renderFilters = () => (
        <div className="mb-4 flex gap-4">
             {(depth === 'sub' || depth === 'subsub') && (
                 <select 
                    className="rounded bg-slate-800 p-2 text-white"
                    value={selectedMain}
                    onChange={e => { setSelectedMain(e.target.value); setSelectedSub(""); }}
                 >
                     <option value="">Select Main Category</option>
                     {data.costline_increases_trajectory.map(c => <option key={c.category} value={c.category}>{c.category}</option>)}
                 </select>
             )}
             {depth === 'subsub' && selectedMain && (
                 <select 
                    className="rounded bg-slate-800 p-2 text-white"
                    value={selectedSub}
                    onChange={e => setSelectedSub(e.target.value)}
                 >
                     <option value="">Select Subcategory</option>
                     {data.costline_increases_trajectory
                        .find(c => c.category === selectedMain)
                        ?.subcategories.map(s => <option key={s.category} value={s.category}>{s.category}</option>)}
                 </select>
             )}
        </div>
    );

    return (
        <div className="space-y-6">
            {renderFilters()}
            
            {(depth !== 'main' && viewData.length === 0) ? (
                <div className="text-slate-500">Please select filters to view details.</div>
            ) : (
                <>
                    <Card className="h-[400px] p-4">
                        <VarianceBarChart data={sortedData.slice(0, 15)} /> {/* Top 15 to avoid clutter */}
                    </Card>

                    <Card className="overflow-hidden">
                        <table className="w-full text-left text-sm text-slate-300">
                            <thead className="bg-slate-900 text-xs uppercase text-slate-400">
                                <tr>
                                    <th className="px-6 py-3">Category</th>
                                    <th className="px-6 py-3 text-right">Difference</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800">
                                {sortedData.map((row, idx) => (
                                    <tr key={idx}>
                                        <td className="px-6 py-4">{row.name}</td>
                                        <td className={`px-6 py-4 text-right font-mono ${row.value > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                            {row.value.toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </Card>
                </>
            )}
        </div>
    );
}

// Wrapper Components
export const MainCostDriver = () => <CostBreakdownView depth="main" />;
export const SubCategories = () => <CostBreakdownView depth="sub" />;
export const SubSubCategories = () => <CostBreakdownView depth="subsub" />;
