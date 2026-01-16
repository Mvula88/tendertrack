'use client'

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts'
import type { TenderStatus } from '@/types/database'

const statusConfig: Record<TenderStatus, { label: string; color: string }> = {
  identified: { label: 'Identified', color: '#94a3b8' },
  evaluating: { label: 'Evaluating', color: '#60a5fa' },
  preparing: { label: 'Preparing', color: '#a78bfa' },
  submitted: { label: 'Submitted', color: '#fbbf24' },
  bid_opening: { label: 'Bid Opening', color: '#fb923c' },
  under_evaluation: { label: 'Under Eval', color: '#38bdf8' },
  won: { label: 'Won', color: '#4ade80' },
  lost: { label: 'Lost', color: '#f87171' },
  abandoned: { label: 'Abandoned', color: '#9ca3af' },
}

interface TenderStatusChartProps {
  data?: Record<TenderStatus, number>
}

export function TenderStatusChart({ data }: TenderStatusChartProps) {
  if (!data) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        No data available
      </div>
    )
  }

  const chartData = Object.entries(data)
    .filter(([_, count]) => count > 0)
    .map(([status, count]) => ({
      status,
      count,
      label: statusConfig[status as TenderStatus]?.label || status,
      color: statusConfig[status as TenderStatus]?.color || '#94a3b8',
    }))

  if (chartData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
        <p>No tenders yet</p>
        <p className="text-sm">Add your first tender to see statistics</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 20 }}>
        <XAxis type="number" allowDecimals={false} />
        <YAxis
          type="category"
          dataKey="label"
          width={100}
          tick={{ fontSize: 12 }}
        />
        <Tooltip
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              const data = payload[0].payload
              return (
                <div className="bg-background border rounded-lg shadow-lg p-2">
                  <p className="font-medium">{data.label}</p>
                  <p className="text-muted-foreground text-sm">
                    {data.count} tender{data.count !== 1 ? 's' : ''}
                  </p>
                </div>
              )
            }
            return null
          }}
        />
        <Bar dataKey="count" radius={[0, 4, 4, 0]}>
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
