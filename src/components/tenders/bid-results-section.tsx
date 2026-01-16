'use client'

import { format } from 'date-fns'
import {
  Trophy,
  TrendingDown,
  TrendingUp,
  Users,
  Plus,
  Trash2,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useDeleteBidOpeningResult } from '@/hooks/use-bid-results'
import type { BidOpeningResult } from '@/types/database'
import { cn } from '@/lib/utils'

interface BidResultsSectionProps {
  tenderId: string
  bidResults: BidOpeningResult[]
  ourBidAmount?: number | null
  onAddResult: () => void
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2,
  }).format(amount)
}

export function BidResultsSection({
  tenderId,
  bidResults,
  ourBidAmount,
  onAddResult,
}: BidResultsSectionProps) {
  const deleteBidResult = useDeleteBidOpeningResult()

  const handleDelete = async (id: string) => {
    await deleteBidResult.mutateAsync({ id, tenderId })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Bid Opening Results</CardTitle>
            <CardDescription>
              Track bid opening outcomes and compare with competitors
            </CardDescription>
          </div>
          <Button onClick={onAddResult}>
            <Plus className="h-4 w-4 mr-2" />
            Add Result
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {bidResults.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Trophy className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">
              No bid opening results recorded yet
            </p>
            <Button variant="link" onClick={onAddResult} className="mt-2">
              Add your first result
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {bidResults.map((result) => {
              const bidDifference = result.our_bid_amount - result.lowest_bid_amount
              const bidPercentage =
                result.lowest_bid_amount > 0
                  ? ((bidDifference / result.lowest_bid_amount) * 100).toFixed(1)
                  : '0'
              const allBids = result.all_bids_data as Array<{
                company: string
                amount: number
              }> | null

              return (
                <div
                  key={result.id}
                  className="rounded-lg border p-4 space-y-4"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'p-2 rounded-full',
                          result.is_lowest_bidder
                            ? 'bg-green-100 dark:bg-green-900/30'
                            : 'bg-orange-100 dark:bg-orange-900/30'
                        )}
                      >
                        {result.is_lowest_bidder ? (
                          <Trophy className="h-5 w-5 text-green-600 dark:text-green-400" />
                        ) : (
                          <TrendingDown className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">
                            {format(new Date(result.opening_date), 'PPP')}
                          </h4>
                          {result.is_lowest_bidder ? (
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                              Lowest Bidder
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              Not Lowest
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {result.total_bidders} bidder
                          {result.total_bidders !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Result</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this bid opening
                            result? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(result.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="rounded-lg bg-muted/50 p-3">
                      <p className="text-xs text-muted-foreground">Our Bid</p>
                      <p className="text-lg font-semibold">
                        {formatCurrency(result.our_bid_amount)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-3">
                      <p className="text-xs text-muted-foreground">
                        Lowest Bid
                      </p>
                      <p className="text-lg font-semibold">
                        {formatCurrency(result.lowest_bid_amount)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-3">
                      <p className="text-xs text-muted-foreground">
                        Difference
                      </p>
                      <p
                        className={cn(
                          'text-lg font-semibold flex items-center gap-1',
                          bidDifference <= 0
                            ? 'text-green-600'
                            : 'text-red-600'
                        )}
                      >
                        {bidDifference <= 0 ? (
                          <TrendingDown className="h-4 w-4" />
                        ) : (
                          <TrendingUp className="h-4 w-4" />
                        )}
                        {bidPercentage}%
                      </p>
                    </div>
                  </div>

                  {/* Winner Info */}
                  {!result.is_lowest_bidder && result.winner_company_name && (
                    <div className="rounded-lg border-l-4 border-orange-400 bg-orange-50 dark:bg-orange-900/10 p-3">
                      <p className="text-sm">
                        <span className="font-medium">Winner:</span>{' '}
                        {result.winner_company_name}
                      </p>
                    </div>
                  )}

                  {/* All Bids Table */}
                  {allBids && allBids.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium mb-2">All Bids</h5>
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Company</TableHead>
                              <TableHead className="text-right">
                                Amount
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {allBids
                              .sort((a, b) => a.amount - b.amount)
                              .map((bid, index) => (
                                <TableRow key={index}>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      {bid.company}
                                      {index === 0 && (
                                        <Badge
                                          variant="outline"
                                          className="text-xs"
                                        >
                                          Lowest
                                        </Badge>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-right font-mono">
                                    {formatCurrency(bid.amount)}
                                  </TableCell>
                                </TableRow>
                              ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {result.notes && (
                    <div>
                      <h5 className="text-sm font-medium mb-1">Notes</h5>
                      <p className="text-sm text-muted-foreground">
                        {result.notes}
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
