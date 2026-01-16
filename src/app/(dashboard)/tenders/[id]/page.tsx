'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { format, differenceInDays } from 'date-fns'
import {
  ArrowLeft,
  Building,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  ExternalLink,
  FileText,
  MoreHorizontal,
  Pencil,
  Trash2,
  Trophy,
  XCircle,
  Users,
  TrendingDown,
  TrendingUp,
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
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useTender, useDeleteTender, useUpdateTender } from '@/hooks/use-tenders'
import { useBidOpeningResults } from '@/hooks/use-bid-results'
import { useCategories } from '@/hooks/use-categories'
import { useOrganizations } from '@/hooks/use-organizations'
import { TenderDialog } from '@/components/tenders/tender-dialog'
import { BidOpeningResultDialog } from '@/components/tenders/bid-opening-result-dialog'
import { BidResultsSection } from '@/components/tenders/bid-results-section'
import type { TenderStatus } from '@/types/database'
import { cn } from '@/lib/utils'

const statusConfig: Record<TenderStatus, { label: string; color: string; icon: React.ElementType }> = {
  identified: { label: 'Identified', color: 'bg-slate-100 text-slate-800', icon: FileText },
  evaluating: { label: 'Evaluating', color: 'bg-blue-100 text-blue-800', icon: Clock },
  preparing: { label: 'Preparing', color: 'bg-purple-100 text-purple-800', icon: FileText },
  submitted: { label: 'Submitted', color: 'bg-yellow-100 text-yellow-800', icon: CheckCircle },
  bid_opening: { label: 'Bid Opening', color: 'bg-orange-100 text-orange-800', icon: Users },
  under_evaluation: { label: 'Under Evaluation', color: 'bg-cyan-100 text-cyan-800', icon: Clock },
  won: { label: 'Won', color: 'bg-green-100 text-green-800', icon: Trophy },
  lost: { label: 'Lost', color: 'bg-red-100 text-red-800', icon: XCircle },
  abandoned: { label: 'Abandoned', color: 'bg-gray-100 text-gray-800', icon: XCircle },
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2,
  }).format(amount)
}

export default function TenderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const { data: tender, isLoading } = useTender(id)
  const { data: bidResults } = useBidOpeningResults(id)
  const { data: categories } = useCategories()
  const { data: organizations } = useOrganizations()
  const deleteTender = useDeleteTender()
  const updateTender = useUpdateTender()

  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [bidResultDialogOpen, setBidResultDialogOpen] = useState(false)

  const handleDelete = async () => {
    await deleteTender.mutateAsync(id)
    router.push('/tenders')
  }

  const handleMarkApplied = async () => {
    if (!tender) return
    await updateTender.mutateAsync({
      id: tender.id,
      applied: !tender.applied,
      applied_date: tender.applied ? null : new Date().toISOString(),
    })
  }

  const handleStatusChange = async (status: TenderStatus) => {
    if (!tender) return
    await updateTender.mutateAsync({
      id: tender.id,
      status,
    })
  }

  if (isLoading) {
    return <TenderDetailSkeleton />
  }

  if (!tender) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <FileText className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-2xl font-semibold">Tender Not Found</h2>
        <p className="text-muted-foreground">
          The tender you&apos;re looking for doesn&apos;t exist or you don&apos;t have access.
        </p>
        <Link href="/tenders">
          <Button>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tenders
          </Button>
        </Link>
      </div>
    )
  }

  const daysUntilDue = differenceInDays(new Date(tender.due_date), new Date())
  const isOverdue = daysUntilDue < 0
  const StatusIcon = statusConfig[tender.status].icon

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Link href="/tenders" className="hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <span>Tenders</span>
            <span>/</span>
            <span className="text-foreground">{tender.title}</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{tender.title}</h1>
          <div className="flex items-center gap-3 mt-2">
            <Badge className={cn(statusConfig[tender.status].color)}>
              <StatusIcon className="mr-1 h-3 w-3" />
              {statusConfig[tender.status].label}
            </Badge>
            {tender.applied && (
              <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700">
                <CheckCircle className="mr-1 h-3 w-3" />
                Applied
              </Badge>
            )}
            {tender.priority_score && (
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={cn(
                      'text-sm',
                      star <= tender.priority_score!
                        ? 'text-yellow-500'
                        : 'text-gray-300'
                    )}
                  >
                    ★
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setEditDialogOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleMarkApplied}>
                <CheckCircle className="mr-2 h-4 w-4" />
                {tender.applied ? 'Mark as Not Applied' : 'Mark as Applied'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleStatusChange('won')}
                disabled={tender.status === 'won'}
              >
                <Trophy className="mr-2 h-4 w-4 text-green-600" />
                Mark as Won
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleStatusChange('lost')}
                disabled={tender.status === 'lost'}
              >
                <XCircle className="mr-2 h-4 w-4 text-red-600" />
                Mark as Lost
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setDeleteDialogOpen(true)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Info */}
        <div className="md:col-span-2 space-y-6">
          {/* Details Card */}
          <Card>
            <CardHeader>
              <CardTitle>Tender Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {tender.description && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">
                    Description
                  </h4>
                  <p className="text-sm">{tender.description}</p>
                </div>
              )}

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <Building className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">
                      Organization
                    </h4>
                    <p className="text-sm font-medium">
                      {tender.organization?.name}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {tender.organization?.type.replace('_', ' ')}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">
                      Category
                    </h4>
                    <p className="text-sm font-medium">
                      {tender.category?.name || 'Uncategorized'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">
                      Due Date
                    </h4>
                    <p className="text-sm font-medium">
                      {format(new Date(tender.due_date), 'PPP')}
                    </p>
                    {!['won', 'lost', 'abandoned', 'submitted', 'under_evaluation', 'bid_opening'].includes(tender.status) && (
                      <p
                        className={cn(
                          'text-xs',
                          isOverdue
                            ? 'text-red-600'
                            : daysUntilDue <= 3
                            ? 'text-orange-600'
                            : daysUntilDue <= 7
                            ? 'text-yellow-600'
                            : 'text-muted-foreground'
                        )}
                      >
                        {isOverdue
                          ? `${Math.abs(daysUntilDue)} days overdue`
                          : daysUntilDue === 0
                          ? 'Due today!'
                          : daysUntilDue === 1
                          ? 'Due tomorrow'
                          : `${daysUntilDue} days remaining`}
                      </p>
                    )}
                  </div>
                </div>

                {tender.our_bid_amount && (
                  <div className="flex items-start gap-3">
                    <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">
                        Our Bid Amount
                      </h4>
                      <p className="text-sm font-medium">
                        {formatCurrency(tender.our_bid_amount)}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {tender.document_url && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">
                      Documents
                    </h4>
                    <a
                      href={tender.document_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <ExternalLink className="h-4 w-4" />
                      View Tender Documents
                    </a>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Bid Opening Results Section */}
          <BidResultsSection
            tenderId={id}
            bidResults={bidResults ?? []}
            ourBidAmount={tender.our_bid_amount}
            onAddResult={() => setBidResultDialogOpen(true)}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => setBidResultDialogOpen(true)}
              >
                <Trophy className="mr-2 h-4 w-4" />
                Add Bid Opening Result
              </Button>
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={handleMarkApplied}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                {tender.applied ? 'Mark Not Applied' : 'Mark as Applied'}
              </Button>
              {tender.document_url && (
                <a
                  href={tender.document_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full"
                >
                  <Button className="w-full justify-start" variant="outline">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open Documents
                  </Button>
                </a>
              )}
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <div className="w-0.5 h-full bg-border" />
                  </div>
                  <div className="pb-4">
                    <p className="text-sm font-medium">Created</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(tender.created_at), 'PPP')}
                    </p>
                  </div>
                </div>

                {tender.applied && tender.applied_date && (
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <div className="w-0.5 h-full bg-border" />
                    </div>
                    <div className="pb-4">
                      <p className="text-sm font-medium">Applied</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(tender.applied_date), 'PPP')}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        'w-2 h-2 rounded-full',
                        isOverdue ? 'bg-red-500' : 'bg-orange-500'
                      )}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Due Date</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(tender.due_date), 'PPP')}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Dialog */}
      <TenderDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        tender={tender}
        categories={categories ?? []}
        organizations={organizations ?? []}
      />

      {/* Bid Opening Result Dialog */}
      <BidOpeningResultDialog
        open={bidResultDialogOpen}
        onOpenChange={setBidResultDialogOpen}
        tenderId={id}
        defaultOurBidAmount={tender.our_bid_amount}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tender</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this tender? This action cannot be
              undone and will remove all associated bid opening results.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function TenderDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-5 w-48 mb-2" />
        <Skeleton className="h-9 w-96" />
        <div className="flex gap-2 mt-2">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-20" />
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-4 w-full" />
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-28" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
