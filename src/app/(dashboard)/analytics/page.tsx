'use client'

import { useMemo } from 'react'
import {
  BarChart3,
  TrendingUp,
  Trophy,
  DollarSign,
  Target,
  PieChart,
  Building,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  Pie,
  PieChart as RechartsPieChart,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useCompany } from '@/contexts/company-context'
import { useTenders } from '@/hooks/use-tenders'
import { useOrganizations } from '@/hooks/use-organizations'
import { useCategories } from '@/hooks/use-categories'
import { useCompetitors } from '@/hooks/use-competitors'
import type { TenderStatus } from '@/types/database'

const COLORS = [
  '#4ade80',
  '#60a5fa',
  '#f472b6',
  '#fb923c',
  '#a78bfa',
  '#fbbf24',
  '#38bdf8',
  '#f87171',
]

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export default function AnalyticsPage() {
  const { currentCompany, isLoading: companyLoading } = useCompany()
  const { data: tenders, isLoading: tendersLoading } = useTenders()
  const { data: organizations } = useOrganizations()
  const { data: categories } = useCategories()
  const { data: competitors } = useCompetitors()

  const analytics = useMemo(() => {
    if (!tenders) return null

    // Overall stats
    const totalTenders = tenders.length
    const wonTenders = tenders.filter((t) => t.status === 'won')
    const lostTenders = tenders.filter((t) => t.status === 'lost')
    const completedTenders = wonTenders.length + lostTenders.length
    const overallWinRate =
      completedTenders > 0
        ? Math.round((wonTenders.length / completedTenders) * 100)
        : 0

    const totalWonValue = wonTenders.reduce(
      (sum, t) => sum + (t.our_bid_amount || 0),
      0
    )

    const pipelineValue = tenders
      .filter((t) => !['won', 'lost', 'abandoned'].includes(t.status))
      .reduce((sum, t) => sum + (t.our_bid_amount || 0), 0)

    // Win rate by category
    const categoryStats = categories?.map((cat) => {
      const catTenders = tenders.filter((t) => t.category_id === cat.id)
      const catWon = catTenders.filter((t) => t.status === 'won').length
      const catLost = catTenders.filter((t) => t.status === 'lost').length
      const catCompleted = catWon + catLost
      return {
        name: cat.name,
        won: catWon,
        lost: catLost,
        total: catTenders.length,
        winRate: catCompleted > 0 ? Math.round((catWon / catCompleted) * 100) : 0,
      }
    }).filter((c) => c.total > 0) ?? []

    // Win rate by organization
    const orgStats = organizations?.map((org) => {
      const orgTenders = tenders.filter((t) => t.organization_id === org.id)
      const orgWon = orgTenders.filter((t) => t.status === 'won').length
      const orgLost = orgTenders.filter((t) => t.status === 'lost').length
      const orgCompleted = orgWon + orgLost
      return {
        name: org.name.length > 20 ? org.name.substring(0, 20) + '...' : org.name,
        fullName: org.name,
        won: orgWon,
        lost: orgLost,
        total: orgTenders.length,
        winRate: orgCompleted > 0 ? Math.round((orgWon / orgCompleted) * 100) : 0,
      }
    }).filter((o) => o.total > 0).sort((a, b) => b.total - a.total).slice(0, 10) ?? []

    // Tenders by month
    const monthlyData: Record<string, { month: string; submitted: number; won: number; lost: number }> = {}
    tenders.forEach((tender) => {
      const date = new Date(tender.created_at)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const monthLabel = date.toLocaleString('default', { month: 'short', year: '2-digit' })

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { month: monthLabel, submitted: 0, won: 0, lost: 0 }
      }
      monthlyData[monthKey].submitted++
      if (tender.status === 'won') monthlyData[monthKey].won++
      if (tender.status === 'lost') monthlyData[monthKey].lost++
    })

    const monthlyTrend = Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([_, data]) => data)

    // Status distribution
    const statusCounts: { name: string; value: number; color: string }[] = [
      { name: 'Won', value: tenders.filter((t) => t.status === 'won').length, color: '#4ade80' },
      { name: 'Lost', value: tenders.filter((t) => t.status === 'lost').length, color: '#f87171' },
      { name: 'Submitted', value: tenders.filter((t) => t.status === 'submitted').length, color: '#fbbf24' },
      { name: 'Preparing', value: tenders.filter((t) => t.status === 'preparing').length, color: '#a78bfa' },
      { name: 'Evaluating', value: tenders.filter((t) => t.status === 'evaluating').length, color: '#60a5fa' },
      { name: 'Under Evaluation', value: tenders.filter((t) => t.status === 'under_evaluation').length, color: '#38bdf8' },
      { name: 'Other', value: tenders.filter((t) => ['identified', 'bid_opening', 'abandoned'].includes(t.status)).length, color: '#94a3b8' },
    ].filter((s) => s.value > 0)

    // Pipeline by status
    const pipelineByStatus = [
      { name: 'Identified', value: tenders.filter((t) => t.status === 'identified').reduce((s, t) => s + (t.our_bid_amount || 0), 0) },
      { name: 'Evaluating', value: tenders.filter((t) => t.status === 'evaluating').reduce((s, t) => s + (t.our_bid_amount || 0), 0) },
      { name: 'Preparing', value: tenders.filter((t) => t.status === 'preparing').reduce((s, t) => s + (t.our_bid_amount || 0), 0) },
      { name: 'Submitted', value: tenders.filter((t) => t.status === 'submitted').reduce((s, t) => s + (t.our_bid_amount || 0), 0) },
      { name: 'Under Eval', value: tenders.filter((t) => t.status === 'under_evaluation').reduce((s, t) => s + (t.our_bid_amount || 0), 0) },
    ].filter((p) => p.value > 0)

    return {
      totalTenders,
      wonCount: wonTenders.length,
      lostCount: lostTenders.length,
      overallWinRate,
      totalWonValue,
      pipelineValue,
      categoryStats,
      orgStats,
      monthlyTrend,
      statusCounts,
      pipelineByStatus,
    }
  }, [tenders, organizations, categories])

  if (companyLoading || tendersLoading) {
    return <AnalyticsSkeleton />
  }

  if (!currentCompany) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <BarChart3 className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-2xl font-semibold">No Company Selected</h2>
        <p className="text-muted-foreground">Select a company to view analytics.</p>
      </div>
    )
  }

  if (!analytics || analytics.totalTenders === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            Analyze your tender performance and competitive intelligence
          </p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No Data Available</h3>
            <p className="text-muted-foreground text-sm mt-1">
              Add some tenders to see analytics and insights
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">
          Analyze your tender performance and competitive intelligence
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {analytics.overallWinRate}%
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics.wonCount} won / {analytics.lostCount} lost
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Won Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(analytics.totalWonValue)}
            </div>
            <p className="text-xs text-muted-foreground">
              From {analytics.wonCount} won tenders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pipeline Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(analytics.pipelineValue)}
            </div>
            <p className="text-xs text-muted-foreground">Active opportunities</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tenders</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalTenders}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Monthly Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Trend</CardTitle>
            <CardDescription>Tenders submitted, won, and lost over time</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.monthlyTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.monthlyTrend}>
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="submitted"
                    stroke="#60a5fa"
                    strokeWidth={2}
                    name="Submitted"
                  />
                  <Line
                    type="monotone"
                    dataKey="won"
                    stroke="#4ade80"
                    strokeWidth={2}
                    name="Won"
                  />
                  <Line
                    type="monotone"
                    dataKey="lost"
                    stroke="#f87171"
                    strokeWidth={2}
                    name="Lost"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                Not enough data
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Status Distribution</CardTitle>
            <CardDescription>Current tender status breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.statusCounts.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPieChart>
                  <Pie
                    data={analytics.statusCounts}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {analytics.statusCounts.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RechartsPieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No data
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Win Rate by Category */}
        <Card>
          <CardHeader>
            <CardTitle>Win Rate by Category</CardTitle>
            <CardDescription>Performance across tender categories</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.categoryStats.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.categoryStats} layout="vertical">
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={100}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload
                        return (
                          <div className="bg-background border rounded-lg shadow-lg p-2">
                            <p className="font-medium">{data.name}</p>
                            <p className="text-sm">Win Rate: {data.winRate}%</p>
                            <p className="text-xs text-muted-foreground">
                              {data.won} won / {data.lost} lost
                            </p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Bar dataKey="winRate" fill="#4ade80" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No category data
              </div>
            )}
          </CardContent>
        </Card>

        {/* Win Rate by Organization */}
        <Card>
          <CardHeader>
            <CardTitle>Win Rate by Organization</CardTitle>
            <CardDescription>Performance with top organizations</CardDescription>
          </CardHeader>
          <CardContent>
            {analytics.orgStats.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.orgStats} layout="vertical">
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={120}
                    tick={{ fontSize: 10 }}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload
                        return (
                          <div className="bg-background border rounded-lg shadow-lg p-2">
                            <p className="font-medium">{data.fullName}</p>
                            <p className="text-sm">Win Rate: {data.winRate}%</p>
                            <p className="text-xs text-muted-foreground">
                              {data.won} won / {data.lost} lost ({data.total} total)
                            </p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Bar dataKey="winRate" fill="#60a5fa" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No organization data
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Value by Status */}
      {analytics.pipelineByStatus.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pipeline Value by Status</CardTitle>
            <CardDescription>Value of opportunities at each stage</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.pipelineByStatus}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis
                  tickFormatter={(value) =>
                    value >= 1000000
                      ? `${(value / 1000000).toFixed(1)}M`
                      : value >= 1000
                      ? `${(value / 1000).toFixed(0)}K`
                      : value
                  }
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  formatter={(value: number | undefined) => value !== undefined ? formatCurrency(value) : ''}
                  labelFormatter={(label) => `Stage: ${label}`}
                />
                <Bar dataKey="value" fill="#a78bfa" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-5 w-64 mt-2" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-5 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-4 w-32 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-56" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
