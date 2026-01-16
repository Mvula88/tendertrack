'use client'

import { useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import {
  FileText,
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Trash2,
  Download,
  Calendar,
  Building2,
  ExternalLink,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useCompany } from '@/contexts/company-context'
import { useProcurementPlans, useDeleteProcurementPlan } from '@/hooks/use-procurement-plans'
import { useOrganizations } from '@/hooks/use-organizations'
import { ProcurementPlanDialog } from '@/components/procurement-plans/procurement-plan-dialog'

export default function ProcurementPlansPage() {
  const { currentCompany, isLoading: companyLoading } = useCompany()
  const { data: plans, isLoading: plansLoading } = useProcurementPlans()
  const { data: organizations } = useOrganizations()
  const deletePlan = useDeleteProcurementPlan()

  const [searchQuery, setSearchQuery] = useState('')
  const [yearFilter, setYearFilter] = useState<string>('all')
  const [orgFilter, setOrgFilter] = useState<string>('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [planToDelete, setPlanToDelete] = useState<string | null>(null)

  // Get unique fiscal years for filtering
  const fiscalYears = [...new Set(plans?.map((p) => p.fiscal_year) ?? [])].sort().reverse()

  // Filter plans
  const filteredPlans = plans?.filter((plan) => {
    const matchesSearch =
      plan.organization.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plan.fiscal_year.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plan.notes?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesYear = yearFilter === 'all' || plan.fiscal_year === yearFilter
    const matchesOrg = orgFilter === 'all' || plan.organization_id === orgFilter
    return matchesSearch && matchesYear && matchesOrg
  }) ?? []

  const handleDelete = (id: string) => {
    setPlanToDelete(id)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (planToDelete) {
      await deletePlan.mutateAsync(planToDelete)
      setDeleteDialogOpen(false)
      setPlanToDelete(null)
    }
  }

  if (companyLoading) {
    return <ProcurementPlansPageSkeleton />
  }

  if (!currentCompany) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <FileText className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-2xl font-semibold">No Company Selected</h2>
        <p className="text-muted-foreground">Select a company to view procurement plans.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Procurement Plans</h1>
          <p className="text-muted-foreground">
            Track and manage organization procurement plans by fiscal year
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Plan
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by organization or notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Fiscal year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {fiscalYears.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={orgFilter} onValueChange={setOrgFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Organization" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Organizations</SelectItem>
                {organizations?.map((org) => (
                  <SelectItem key={org.id} value={org.id}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Plans Table */}
      {plansLoading ? (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : filteredPlans.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No procurement plans found</h3>
            <p className="text-muted-foreground text-sm mt-1">
              {searchQuery || yearFilter !== 'all' || orgFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Get started by adding your first procurement plan'}
            </p>
            {!searchQuery && yearFilter === 'all' && orgFilter === 'all' && (
              <Button className="mt-4" onClick={() => setDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Procurement Plan
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Plans ({filteredPlans.length})</CardTitle>
            <CardDescription>
              Procurement plans uploaded for tracking tender opportunities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organization</TableHead>
                  <TableHead>Fiscal Year</TableHead>
                  <TableHead>Upload Date</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Document</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPlans.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <Link
                          href={`/organizations/${plan.organization_id}`}
                          className="font-medium hover:underline"
                        >
                          {plan.organization.name}
                        </Link>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          <Calendar className="h-3 w-3 mr-1" />
                          {plan.fiscal_year}
                        </Badge>
                        {(plan.revision_number ?? 0) > 0 && (
                          <Badge variant="outline" className="text-xs">
                            Rev {plan.revision_number}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(plan.upload_date), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-muted-foreground">
                      {plan.notes || '-'}
                    </TableCell>
                    <TableCell>
                      {plan.file_url ? (
                        <a
                          href={plan.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-primary hover:underline"
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </a>
                      ) : (
                        <span className="text-muted-foreground">No file</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <Link href={`/organizations/${plan.organization_id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Organization
                            </Link>
                          </DropdownMenuItem>
                          {plan.file_url && (
                            <DropdownMenuItem asChild>
                              <a
                                href={plan.file_url}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <ExternalLink className="mr-2 h-4 w-4" />
                                Open Document
                              </a>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDelete(plan.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Procurement Plan Dialog */}
      <ProcurementPlanDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Procurement Plan</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this procurement plan? This action
              cannot be undone.
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

function ProcurementPlansPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-5 w-72 mt-2" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-[150px]" />
            <Skeleton className="h-10 w-[200px]" />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
