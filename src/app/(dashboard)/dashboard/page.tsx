'use client'

import Link from 'next/link'
import { format, differenceInDays, formatDistanceToNow } from 'date-fns'
import {
  FileText,
  Send,
  TrendingUp,
  DollarSign,
  Plus,
  Building,
  Calendar,
  ArrowRight,
  Clock,
  AlertCircle,
  Sparkles,
  Zap,
  ArrowUpCircle,
  CreditCard,
  ClipboardList,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useCompany } from '@/contexts/company-context'
import { useTenderStats, useUpcomingDeadlines } from '@/hooks/use-tenders'
import { useSubscription } from '@/hooks/use-subscription'
import { PLANS } from '@/lib/stripe'
import { TenderStatusChart } from '@/components/dashboard/tender-status-chart'
import { WelcomeBanner } from '@/components/dashboard/welcome-banner'
import { cn } from '@/lib/utils'

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

function getUrgencyColor(dueDate: string) {
  const days = differenceInDays(new Date(dueDate), new Date())
  if (days <= 1) return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
  if (days <= 3) return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
  if (days <= 7) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
  return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
}

export default function DashboardPage() {
  const { currentCompany, isLoading: companyLoading } = useCompany()
  const { data: stats, isLoading: statsLoading } = useTenderStats()
  const { data: upcomingDeadlines, isLoading: deadlinesLoading } = useUpcomingDeadlines()
  const { data: subscription } = useSubscription()
  
  const currentPlan = subscription?.plan || 'free'
  const planDetails = PLANS[currentPlan]
  const aiCredits = currentCompany?.ai_credits || 0

  if (companyLoading) {
    return <DashboardSkeleton />
  }

  if (!currentCompany) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Building className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-2xl font-semibold">No Company Selected</h2>
        <p className="text-muted-foreground text-center max-w-md">
          Create or select a company to start tracking your tenders.
        </p>
        <Link href="/onboarding">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Your First Company
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Overview of your tender pipeline and activities
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild size="sm" variant="outline">
            <Link href="/organizations/new">
              <Building className="mr-2 h-4 w-4" />
              Add Organization
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/tenders/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Tender
            </Link>
          </Button>
        </div>
      </div>

      <WelcomeBanner />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Tenders</CardTitle>
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20">
              <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-semibold">{stats?.totalActive ?? 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats?.total ?? 0} total tenders
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Submitted Bids</CardTitle>
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/20">
              <Send className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-semibold">{stats?.submitted ?? 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Awaiting results
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Win Rate</CardTitle>
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/20">
              <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-semibold">{stats?.winRate ?? 0}%</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Based on completed tenders
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pipeline Value</CardTitle>
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/20">
              <DollarSign className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <>
                <div className="text-2xl font-semibold">
                  {formatCurrency(stats?.pipelineValue ?? 0)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Active bid amounts
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Credits & Plan Card - Prominent Placement */}
      <Card className="border-blue-200 dark:border-blue-800/30 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-950/10 dark:to-indigo-950/10 hover:shadow-md transition-all">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-base">AI Features & Credits</CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Generate proposals, parse plans, check compliance
                </CardDescription>
              </div>
            </div>
            <Badge variant={currentPlan === 'free' ? 'secondary' : currentPlan === 'pro' ? 'default' : 'destructive'} className="text-xs">
              {planDetails.name}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Credits Display */}
            <div className="flex items-center justify-between p-4 bg-white/60 dark:bg-slate-900/30 rounded-lg border border-border/50">
              <div className="flex items-center gap-3">
                <div className={cn(
                  'p-2.5 rounded-full',
                  aiCredits === 0 ? 'bg-red-100 dark:bg-red-900/20' : 
                  aiCredits < 5 ? 'bg-amber-100 dark:bg-amber-900/20' : 
                  'bg-blue-100 dark:bg-blue-900/20'
                )}>
                  <Zap className={cn(
                    'h-5 w-5',
                    aiCredits === 0 ? 'text-red-600 dark:text-red-400' : 
                    aiCredits < 5 ? 'text-amber-600 dark:text-amber-400' : 
                    'text-blue-600 dark:text-blue-400'
                  )} />
                </div>
                <div>
                  <p className="text-2xl font-semibold leading-none">{aiCredits}</p>
                  <p className="text-xs text-muted-foreground mt-1">AI Credits Remaining</p>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                {aiCredits < 5 && (
                  <Button asChild size="sm" variant="default" className="bg-blue-600 hover:bg-blue-700">
                    <Link href="/settings?tab=billing">
                      <ArrowUpCircle className="h-3.5 w-3.5 mr-1.5" />
                      Top Up
                    </Link>
                  </Button>
                )}
                {currentPlan === 'free' && (
                  <Button asChild size="sm" variant="outline">
                    <Link href="/settings?tab=billing">
                      <CreditCard className="h-3.5 w-3.5 mr-1.5" />
                      Upgrade
                    </Link>
                  </Button>
                )}
              </div>
            </div>
            
            {/* AI Feature Cards */}
            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
              <Link href="/tenders" className="group">
                <div className="flex items-start gap-3 p-3 rounded-lg border border-border/50 bg-white/40 dark:bg-slate-900/20 hover:bg-white dark:hover:bg-slate-900/40 hover:border-blue-200 dark:hover:border-blue-800 transition-all">
                  <div className="p-1.5 rounded-md bg-blue-100 dark:bg-blue-900/30 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                    <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Generate Proposal</p>
                    <p className="text-xs text-muted-foreground mt-0.5">AI-powered bids</p>
                  </div>
                </div>
              </Link>
              <Link href="/procurement-plans" className="group">
                <div className="flex items-start gap-3 p-3 rounded-lg border border-border/50 bg-white/40 dark:bg-slate-900/20 hover:bg-white dark:hover:bg-slate-900/40 hover:border-blue-200 dark:hover:border-blue-800 transition-all">
                  <div className="p-1.5 rounded-md bg-blue-100 dark:bg-blue-900/30 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                    <ClipboardList className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Parse PDF Plans</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Extract tender data</p>
                  </div>
                </div>
              </Link>
              <Link href="/tenders" className="group">
                <div className="flex items-start gap-3 p-3 rounded-lg border border-border/50 bg-white/40 dark:bg-slate-900/20 hover:bg-white dark:hover:bg-slate-900/40 hover:border-blue-200 dark:hover:border-blue-800 transition-all">
                  <div className="p-1.5 rounded-md bg-blue-100 dark:bg-blue-900/30 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                    <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Compliance Check</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Verify requirements</p>
                  </div>
                </div>
              </Link>
              <Link href="/settings?tab=profile" className="group">
                <div className="flex items-start gap-3 p-3 rounded-lg border border-border/50 bg-white/40 dark:bg-slate-900/20 hover:bg-white dark:hover:bg-slate-900/40 hover:border-blue-200 dark:hover:border-blue-800 transition-all">
                  <div className="p-1.5 rounded-md bg-blue-100 dark:bg-blue-900/30 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                    <Building className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">AI Profile</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Company context</p>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts and Upcoming Deadlines */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Tender Status Chart */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Tenders by Status</CardTitle>
            <CardDescription>
              Distribution of your tenders across different stages
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            {statsLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <TenderStatusChart data={stats?.statusCounts} />
            )}
          </CardContent>
        </Card>

        {/* Upcoming Deadlines */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upcoming Deadlines
            </CardTitle>
            <CardDescription>Tenders due in the next 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            {deadlinesLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : upcomingDeadlines && upcomingDeadlines.length > 0 ? (
              <div className="space-y-3">
                {upcomingDeadlines.map((tender) => {
                  const daysLeft = differenceInDays(
                    new Date(tender.due_date),
                    new Date()
                  )
                  return (
                    <Link
                      key={tender.id}
                      href={`/tenders/${tender.id}`}
                      className="block"
                    >
                      <div className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors">
                        <div
                          className={cn(
                            'p-2 rounded-full',
                            daysLeft <= 1
                              ? 'bg-red-100 dark:bg-red-900/30'
                              : daysLeft <= 3
                              ? 'bg-orange-100 dark:bg-orange-900/30'
                              : 'bg-yellow-100 dark:bg-yellow-900/30'
                          )}
                        >
                          {daysLeft <= 1 ? (
                            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                          ) : (
                            <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {tender.title}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {(tender.organization as any)?.name}
                          </p>
                        </div>
                        <Badge
                          variant="secondary"
                          className={cn(getUrgencyColor(tender.due_date))}
                        >
                          {daysLeft === 0
                            ? 'Today'
                            : daysLeft === 1
                            ? 'Tomorrow'
                            : `${daysLeft} days`}
                        </Badge>
                      </div>
                    </Link>
                  )
                })}
                <Link href="/tenders">
                  <Button variant="ghost" className="w-full mt-2">
                    View All Tenders
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Calendar className="h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">
                  No upcoming deadlines in the next 7 days
                </p>
                <Link href="/tenders/new">
                  <Button variant="link" className="mt-2">
                    Add a tender
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Won This Year
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {stats?.statusCounts?.won ?? 0}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Lost This Year
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                {stats?.statusCounts?.lost ?? 0}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Under Evaluation
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {stats?.statusCounts?.under_evaluation ?? 0}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-5 w-64 mt-2" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-40" />
        </div>
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[300px] w-full" />
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
