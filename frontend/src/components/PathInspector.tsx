import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface PathInspectorProps {
  pathResult: any;
  title: string;
}

export const PathInspector: React.FC<PathInspectorProps> = ({ pathResult, title }) => {
  if (!pathResult) return null;

  const data = pathResult.running_pnl.map((pnl: number, idx: number) => ({
    day: idx,
    pnl: pnl,
    shares: pathResult.day_by_day_accumulation[idx]
  }));

  return (
    <div style={{ height: '300px', width: '100%', marginTop: '16px' }}>
      <h4 style={{ fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '12px' }}>{title}</h4>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
          <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickLine={false} axisLine={{ stroke: 'var(--border-subtle)' }} />
          <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickLine={false} axisLine={{ stroke: 'var(--border-subtle)' }} tickFormatter={(val) => `$${(val/1000).toFixed(0)}k`} />
          <Tooltip 
            contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '4px', fontSize: '12px', fontFamily: 'var(--font-mono)' }}
            formatter={(value: any, name: any) => [
              name === 'pnl' ? `$${value.toFixed(2)}` : value.toFixed(0),
              name === 'pnl' ? 'Running P&L' : 'Accumulated Shares'
            ]}
            labelFormatter={(label) => `Day ${label}`}
          />
          <ReferenceLine y={0} stroke="var(--text-muted)" strokeDasharray="3 3" />
          <Line type="monotone" dataKey="pnl" stroke="var(--terracotta-primary)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
