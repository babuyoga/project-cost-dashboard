
"use client";

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ReferenceLine } from 'recharts';

interface VarianceBarChartProps {
    data: { name: string; value: number }[];
}

export function VarianceBarChart({ data }: VarianceBarChartProps) {
    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart layout="vertical" data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis type="number" stroke="#94a3b8" />
                <YAxis dataKey="name" type="category" width={150} tick={{fontSize: 12}} stroke="#94a3b8" />
                <Tooltip 
                    cursor={{fill: '#1e293b'}}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff' }}
                />
                <ReferenceLine x={0} stroke="#475569" />
                <Bar dataKey="value">
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.value > 0 ? '#ef4444' : '#22c55e'} />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
}
