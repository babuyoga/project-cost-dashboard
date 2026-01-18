
"use client";

import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

interface TrendLineChartProps {
    p1Label: string;
    p1Value: number;
    p2Label: string;
    p2Value: number;
}

export function TrendLineChart({ p1Label, p1Value, p2Label, p2Value }: TrendLineChartProps) {
    const data = [
        { name: p1Label, value: p1Value },
        { name: p2Label, value: p2Value },
    ];

    return (
        <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff' }}
                />
                <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} activeDot={{ r: 8 }} />
            </LineChart>
        </ResponsiveContainer>
    );
}
