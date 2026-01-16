'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import {
  ArrowLeft,
  Users,
  Globe,
  Lock,
  Pencil,
  Trash2,
  MoreHorizontal,
  Target,
  TrendingUp,
  TrendingDown,
  DollarSign,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
import { useCompetitor, useDeleteCompetitor, useCompetitorBids } from '@/hooks/use-competitors'
import { CompetitorDialog } from '@/components/competitors/competitor-dialog'
import { cn } from '@/lib/utils'

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 0,
  }).format(amount)
}

export default function CompetitorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const { data: competitor, isLoading: competitorLoading } = useCompetitor(id)
  const { data: competitorBids, isLoading: bidsLoading } = useCompetitorBids(id)
  const deleteCompetitor = useDeleteCompetitor()

  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  // Calculate statistics
  const validBids = competitorBids?.filter((bid) => bid.tender) ?? []
  const totalEncounters = validBids.length

  const bidsWithOurAmount = validBids.filter(
    (bid) => bid.tender?.our_bid_amount !== null
  )

  const winsAgainstUs = bidsWithOurAmount.filter(
    (bid) => bid.bid_amount < (bid.tender?.our_bid_amount || 0)
  ).length

  const lossesToUs = bidsWithOurAmount.filter(
    (bid) => bid.bid_amount > (bid.tender?.our_bid_amount || 0)
  ).length

  const ourWinRate =
    winsAgainstUs + lossesToUs > 0
      ? Math.round((lossesToUs / (winsAgainstUs + lossesToUs)) * 100)
      : 0

  const avgCompetitorBid =
    validBids.length > 0
      ? validBids.reduce((sum, bid) => sum + bid.bid_amount, 0) / validBids.length
      : 0

  const avgOurBid =
    bidsWithOurAmount.length > 0
      ? bidsWithOurAmount.reduce((sum, bid) => sum + (bid.tender?.our_bid_amount || 0), 0) /
        bidsWithOurAmount.length
      : 0

  const handleDelete = async () => {
    await deleteCompetitor.mutateAsync(id)
    router.push('/competitors')
  }

  if (competitorLoading) {
    return <CompetitorDetailSkeleton />
  }

  if (!competitor) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Users className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-2xl font-semibold">Competitor Not Found</h2>
        <p className="text-muted-foreground">
          The competitor you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link href="/competitors">
          <Button>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Competitors
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Link href="/competitors" className="hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <span>Competitors</span>
            <span>/</span>
            <span className="text-foreground">{competitor.name}</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{competitor.name}</h1>
          <div className="flex items-center gap-2 mt-2">
            {competitor.user_company_id === null ? (
              <Badge variant="outline">
                <Globe className="h-3 w-3 mr-1" />
                Shared
              </Badge>
            ) : (
              <Badge variant="outline">
                <Lock className="h-3 w-3 mr-1" />
                Private
              </Badge>
            )}
            <Badge variant="secondary">
              <Target className="h-3 w-3 mr-1" />
              {competitor.encounter_count} encounters
            </Badge>
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
              <DropdownMenuItem
                onClick={() => setDeleteDialogOpen(true)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Competitor
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Specialty Areas */}
          {competitor.specialty_areas && competitor.specialty_areas.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Specialty Areas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {competitor.specialty_areas.map((area, index) => (
                    <Badge key={index} variant="secondary">
                      {area}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Bid History */}
          <Card>
            <CardHeader>
              <CardTitle>Bid History</CardTitle>
              <CardDescription>
                Tenders where you competed against {competitor.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {bidsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : validBids.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Target className="h-12 w-12 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">
                    No bid records with this competitor yet
                  </p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tender</TableHead>
                        <TableHead>Their Bid</TableHead>
                        <TableHead>Our Bid</TableHead>
                        <TableHead>Result</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {validBids.map((bid) => {
                        const ourBid = bid.tender?.our_bid_amount
                        const theyWon = ourBid ? bid.bid_amount < ourBid : false
                        const weWon = ourBid ? bid.bid_amount > ourBid : false

                        return (
                          <TableRow key={bid.id}>
                            <TableCell>
                              <Link
                                href={`/tenders/${bid.tender?.id}`}
                                className="font-medium hover:underline"
                              >
                                {bid.tender?.title}
                              </Link>
                              <p className="text-xs text-muted-foreground">
                                {(bid.tender?.organization as any)?.name}
                              </p>
                            </TableCell>
                            <TableCell className="font-mono">
                              {formatCurrency(bid.bid_amount)}
                            </TableCell>
                            <TableCell className="font-mono">
                              {ourBid ? formatCurrency(ourBid) : '-'}
                            </TableCell>
                            <TableCell>
                              {theyWon ? (
                                <Badge
                                  variant="destructive"
                                  className="bg-red-100 text-red-800 hover:bg-red-100"
                                >
                                  <TrendingDown className="h-3 w-3 mr-1" />
                                  They won
                                </Badge>
                              ) : weWon ? (
                                <Badge
                                  variant="default"
                                  className="bg-green-100 text-green-800 hover:bg-green-100"
                                >
                                  <TrendingUp className="h-3 w-3 mr-1" />
                                  We won
                                </Badge>
                              ) : (
                                <Badge variant="secondary">Tie</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          {competitor.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {competitor.notes}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Competition Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Total Encounters
                </span>
                <span className="font-semibold">{totalEncounters}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Our Win Rate vs Them
                </span>
                <span
                  className={cn(
                    'font-semibold',
                    ourWinRate >= 50 ? 'text-green-600' : 'text-red-600'
                  )}
                >
                  {ourWinRate}%
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  They Won
                </span>
                <span className="font-semibold text-red-600">{winsAgainstUs}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">We Won</span>
                <span className="font-semibold text-green-600">{lossesToUs}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Their Avg Bid
                </span>
                <span className="font-semibold font-mono text-sm">
                  {avgCompetitorBid > 0 ? formatCurrency(avgCompetitorBid) : '-'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Our Avg Bid</span>
                <span className="font-semibold font-mono text-sm">
                  {avgOurBid > 0 ? formatCurrency(avgOurBid) : '-'}
                </span>
              </div>
              {avgCompetitorBid > 0 && avgOurBid > 0 && (
                <>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Price Difference
                    </span>
                    <span
                      className={cn(
                        'font-semibold',
                        avgOurBid < avgCompetitorBid
                          ? 'text-green-600'
                          : 'text-red-600'
                      )}
                    >
                      {avgOurBid < avgCompetitorBid ? (
                        <>We&apos;re {((1 - avgOurBid / avgCompetitorBid) * 100).toFixed(0)}% lower</>
                      ) : (
                        <>They&apos;re {((1 - avgCompetitorBid / avgOurBid) * 100).toFixed(0)}% lower</>
                      )}
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Dialog */}
      <CompetitorDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        competitor={competitor}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Competitor</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this competitor? This action cannot
              be undone and will remove all associated bid data.
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

function CompetitorDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-5 w-48 mb-2" />
        <Skeleton className="h-9 w-64" />
        <div className="flex gap-2 mt-2">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-28" />
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-6 w-24" />
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        <div>
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-36" />
            </CardHeader>
            <CardContent className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
