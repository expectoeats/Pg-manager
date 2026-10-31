'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface PlanData {
  name: string;
  count: number;
}

const COLORS = ['#007AFF', '#34C759', '#FF9500', '#AF52DE', '#FF3B30', '#5AC8FA'];

export function PlanDistributionChart({ data }: { data: PlanData[] }) {
  const total = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }: any) => 
            name && percent ? `${name.split(' ').slice(0, 2).join(' ')} (${(percent * 100).toFixed(0)}%)` : ''
          }
          outerRadius={90}
          fill="#8884d8"
          dataKey="count"
          paddingAngle={2}
        >
          {data.map((entry, index) => (
            <Cell 
              key={`cell-${index}`} 
              fill={COLORS[index % COLORS.length]}
              stroke="#fff"
              strokeWidth={2}
            />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: 'rgba(255, 255, 255, 0.98)',
            border: '1px solid #E5E5EA',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            padding: '12px',
          }}
          formatter={(value: any) => [
            `${Number(value)} resident${Number(value) !== 1 ? 's' : ''} (${((Number(value) / total) * 100).toFixed(1)}%)`,
            'Count'
          ]}
        />
        <Legend 
          verticalAlign="bottom" 
          height={36}
          iconType="circle"
          formatter={(value) => (
            <span style={{ color: '#1C1C1E', fontWeight: 500, fontSize: '12px' }}>
              {value.length > 20 ? value.slice(0, 20) + '...' : value}
            </span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
