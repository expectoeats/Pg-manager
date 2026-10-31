'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface ChartData {
  month: string;
  income: number;
  expense: number;
  profit: number;
}

export function IncomeExpenseChart({ data }: { data: ChartData[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <defs>
          <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#34C759" stopOpacity={1} />
            <stop offset="100%" stopColor="#34C759" stopOpacity={0.8} />
          </linearGradient>
          <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FF3B30" stopOpacity={1} />
            <stop offset="100%" stopColor="#FF3B30" stopOpacity={0.8} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E5EA" vertical={false} />
        <XAxis 
          dataKey="month" 
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#8E8E93', fontSize: 12, fontWeight: 500 }}
        />
        <YAxis 
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#8E8E93', fontSize: 12, fontWeight: 500 }}
          tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'rgba(255, 255, 255, 0.98)',
            border: '1px solid #E5E5EA',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            padding: '12px',
          }}
          labelStyle={{ color: '#1C1C1E', fontWeight: 600, marginBottom: '8px' }}
          formatter={(value: any) => `₹${Number(value).toLocaleString('en-IN')}`}
        />
        <Legend 
          wrapperStyle={{ paddingTop: '20px' }}
          iconType="circle"
          formatter={(value) => <span style={{ color: '#1C1C1E', fontWeight: 500, fontSize: '13px' }}>{value}</span>}
        />
        <Bar 
          dataKey="income" 
          fill="url(#incomeGradient)" 
          radius={[8, 8, 0, 0]}
          name="Income"
        />
        <Bar 
          dataKey="expense" 
          fill="url(#expenseGradient)" 
          radius={[8, 8, 0, 0]}
          name="Expenses"
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
