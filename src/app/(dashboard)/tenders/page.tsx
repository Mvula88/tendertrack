'use client'

import { useState } from 'react'
import Link from 'next/link'
import { format, differenceInDays } from 'date-fns'
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  CheckCircle,
  ExternalLink,
  ArrowUpDown,
  FileText,
  Download,
  FileSpreadsheet,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { toast } from 'sonner'
import { useCompany } from '@/contexts/company-context'
import { useTenders, useDeleteTender, useUpdateTender } from '@/hooks/use-tenders'
import { useCategories } from '@/hooks/use-categories'
import { useOrganizations } from '@/hooks/use-organizations'
import { TenderDialog } from '@/components/tenders/tender-dialog'
import type { TenderStatus, TenderWithRelations } from '@/types/database'
import { cn } from '@/lib/utils'
import { exportTendersToCSV, exportTendersToExcel } from '@/lib/export'

const statusConfig: Record<TenderStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  identified: { label: 'Identified', variant: 'secondary' },
  evaluating: { label: 'Evaluating', variant: 'outline' },
  preparing: { label: 'Preparing', variant: 'outline' },
  submitted: { label: 'Submitted', variant: 'default' },
  bid_opening: { label: 'Bid Opening', variant: 'default' },
  under_evaluation: { label: 'Under Evaluation', variant: 'default' },
  won: { label: 'Won', variant: 'default' },
  lost: { label: 'Lost', variant: 'destructive' },
  abandoned: { label: 'Abandoned', variant: 'secondary' },
}

function getUrgencyClass(dueDate: string, status: TenderStatus): string {
  if (['won', 'lost', 'abandoned'].includes(status)) return ''

  const days = differenceInDays(new Date(dueDate), new Date())
  if (days < 0) return 'bg-red-50 dark:bg-red-900/10'
  if (days <= 1) return 'bg-red-50 dark:bg-red-900/10'
  if (days <= 3) return 'bg-orange-50 dark:bg-orange-900/10'
  if (days <= 7) return 'bg-yellow-50 dark:bg-yellow-900/10'
  return ''
}

function getDaysLabel(dueDate: string): { label: string; className: string } {
  const days = differenceInDays(new Date(dueDate), new Date())
  if (days < 0) return { label: `${Math.abs(days)}d overdue`, className: 'text-red-600' }
  if (days === 0) return { label: 'Today', className: 'text-red-600 font-bold' }
  if (days === 1) return { label: 'Tomorrow', className: 'text-orange-600 font-semibold' }
  if (days <= 3) return { label: `${days}d left`, className: 'text-orange-600' }
  if (days <= 7) return { label: `${days}d left`, className: 'text-yellow-600' }
  return { label: `${days}d left`, className: 'text-muted-foreground' }
}

export default function TendersPage() {
  const { currentCompany, isLoading: companyLoading } = useCompany()
  const { data: tenders, isLoading: tendersLoading } = useTenders()
  const { data: categories } = useCategories()
  const { data: organizations } = useOrganizations()
  const deleteTender = useDeleteTender()
  const updateTender = useUpdateTender()

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTender, setEditingTender] = useState<TenderWithRelations | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [tenderToDelete, setTenderToDelete] = useState<string | null>(null)

  // Filter tenders
  const filteredTenders = tenders?.filter((tender) => {
    const matchesSearch =
      tender.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tender.organization?.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || tender.status === statusFilter
    const matchesCategory = categoryFilter === 'all' || tender.category_id === categoryFilter
    return matchesSearch && matchesStatus && matchesCategory
  }) ?? []

  const handleEdit = (tender: TenderWithRelations) => {
    setEditingTender(tender)
    setDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    setTenderToDelete(id)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (tenderToDelete) {
      await deleteTender.mutateAsync(tenderToDelete)
      setDeleteDialogOpen(false)
      setTenderToDelete(null)
    }
  }

  const handleMarkApplied = async (tender: TenderWithRelations) => {
    await updateTender.mutateAsync({
      id: tender.id,
      applied: !tender.applied,
      applied_date: tender.applied ? null : new Date().toISOString(),
    })
  }

  const handleDialogClose = () => {
    setDialogOpen(false)
    setEditingTender(null)
  }

  const handleExportCSV = () => {
    try {
      exportTendersToCSV(filteredTenders)
      toast.success('Tenders exported to CSV successfully')
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export tenders. Please try again.')
    }
  }

  const handleExportExcel = () => {
    try {
      exportTendersToExcel(filteredTenders)
      toast.success('Tenders exported for Excel successfully')
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Failed to export tenders. Please try again.')
    }
  }

  if (companyLoading) {
    return <TendersPageSkeleton />
  }

  if (!currentCompany) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <FileText className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-2xl font-semibold">No Company Selected</h2>
        <p className="text-muted-foreground">Select a company to view tenders.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tenders</h1>
          <p className="text-muted-foreground">
            Manage and track all your tender opportunities
          </p>
        </div>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={!filteredTenders.length}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Export Format</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleExportCSV}>
                <FileText className="mr-2 h-4 w-4" />
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportExcel}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Export for Excel
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Tender
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search tenders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {Object.entries(statusConfig).map(([value, { label }]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories?.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tenders Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Tenders</CardTitle>
          <CardDescription>
            {filteredTenders.length} tender{filteredTenders.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tendersLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredTenders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No tenders found</h3>
              <p className="text-muted-foreground text-sm mt-1">
                {searchQuery || statusFilter !== 'all' || categoryFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Get started by adding your first tender'}
              </p>
              {!searchQuery && statusFilter === 'all' && categoryFilter === 'all' && (
                <Button className="mt-4" onClick={() => setDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Tender
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Organization</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>
                      <Button variant="ghost" className="p-0 h-auto font-medium">
                        Due Date
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Applied</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTenders.map((tender) => {
                    const daysInfo = getDaysLabel(tender.due_date)
                    return (
                      <TableRow
                        key={tender.id}
                        className={cn(getUrgencyClass(tender.due_date, tender.status))}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/tenders/${tender.id}`}
                              className="font-medium hover:underline"
                            >
                              {tender.title}
                            </Link>
                            {tender.document_url && (
                              <a
                                href={tender.document_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-muted-foreground hover:text-foreground"
                              >
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                          {tender.priority_score && (
                            <div className="flex gap-0.5 mt-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <span
                                  key={star}
                                  className={cn(
                                    'text-xs',
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
                        </TableCell>
                        <TableCell>{tender.organization?.name}</TableCell>
                        <TableCell>{tender.category?.name || '-'}</TableCell>
                        <TableCell>
                          <div>
                            <div className="text-sm">
                              {format(new Date(tender.due_date), 'dd MMM yyyy')}
                            </div>
                            <div className={cn('text-xs', daysInfo.className)}>
                              {daysInfo.label}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusConfig[tender.status].variant}>
                            {statusConfig[tender.status].label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {tender.applied ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem asChild>
                                <Link href={`/tenders/${tender.id}`}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEdit(tender)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleMarkApplied(tender)}>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                {tender.applied ? 'Mark as Not Applied' : 'Mark as Applied'}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDelete(tender.id)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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

      {/* Tender Dialog */}
      <TenderDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        tender={editingTender}
        categories={categories ?? []}
        organizations={organizations ?? []}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              tender and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
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

function TendersPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-5 w-64 mt-2" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-[180px]" />
            <Skeleton className="h-10 w-[180px]" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-24" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
