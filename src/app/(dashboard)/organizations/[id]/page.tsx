'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { format, differenceInDays } from 'date-fns'
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  Globe,
  Lock,
  Pencil,
  Trash2,
  FileText,
  MoreHorizontal,
  Plus,
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
import { useOrganization, useDeleteOrganization } from '@/hooks/use-organizations'
import { useTenders } from '@/hooks/use-tenders'
import { OrganizationDialog } from '@/components/organizations/organization-dialog'
import type { OrganizationType, TenderStatus } from '@/types/database'
import { cn } from '@/lib/utils'

const typeLabels: Record<OrganizationType, string> = {
  ministry: 'Ministry',
  parastatal: 'Parastatal',
  private_company: 'Private Company',
  municipality: 'Municipality',
}

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

export default function OrganizationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const { data: organization, isLoading: orgLoading } = useOrganization(id)
  const { data: allTenders, isLoading: tendersLoading } = useTenders()
  const deleteOrganization = useDeleteOrganization()

  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  // Filter tenders for this organization
  const orgTenders = allTenders?.filter((t) => t.organization_id === id) ?? []

  // Calculate stats
  const totalTenders = orgTenders.length
  const wonTenders = orgTenders.filter((t) => t.status === 'won').length
  const lostTenders = orgTenders.filter((t) => t.status === 'lost').length
  const winRate =
    wonTenders + lostTenders > 0
      ? Math.round((wonTenders / (wonTenders + lostTenders)) * 100)
      : 0

  const handleDelete = async () => {
    await deleteOrganization.mutateAsync(id)
    router.push('/organizations')
  }

  if (orgLoading) {
    return <OrganizationDetailSkeleton />
  }

  if (!organization) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Building2 className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-2xl font-semibold">Organization Not Found</h2>
        <p className="text-muted-foreground">
          The organization you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link href="/organizations">
          <Button>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Organizations
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
            <Link href="/organizations" className="hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <span>Organizations</span>
            <span>/</span>
            <span className="text-foreground">{organization.name}</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            {organization.name}
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="secondary">{typeLabels[organization.type]}</Badge>
            {organization.shared ? (
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
                Delete Organization
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Tenders from this Organization */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Tenders</CardTitle>
                  <CardDescription>
                    All tenders from {organization.name}
                  </CardDescription>
                </div>
                <Link href={`/tenders?organization=${id}`}>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Tender
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {tendersLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : orgTenders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">
                    No tenders from this organization yet
                  </p>
                  <Link href="/tenders">
                    <Button variant="link" className="mt-2">
                      Add a tender
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orgTenders.slice(0, 10).map((tender) => {
                        const daysLeft = differenceInDays(
                          new Date(tender.due_date),
                          new Date()
                        )
                        const isCompleted = ['won', 'lost', 'abandoned', 'submitted', 'under_evaluation', 'bid_opening'].includes(tender.status)
                        return (
                          <TableRow key={tender.id}>
                            <TableCell>
                              <Link
                                href={`/tenders/${tender.id}`}
                                className="font-medium hover:underline"
                              >
                                {tender.title}
                              </Link>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {format(new Date(tender.due_date), 'dd MMM yyyy')}
                              </div>
                              {!isCompleted && (
                                <div
                                  className={cn(
                                    'text-xs',
                                    daysLeft < 0
                                      ? 'text-red-600'
                                      : daysLeft <= 3
                                      ? 'text-orange-600'
                                      : 'text-muted-foreground'
                                  )}
                                >
                                  {daysLeft < 0
                                    ? `${Math.abs(daysLeft)}d overdue`
                                    : daysLeft === 0
                                    ? 'Today'
                                    : `${daysLeft}d left`}
                                </div>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant={statusConfig[tender.status].variant}>
                                {statusConfig[tender.status].label}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
              {orgTenders.length > 10 && (
                <div className="mt-4 text-center">
                  <Link href={`/tenders?organization=${id}`}>
                    <Button variant="outline" size="sm">
                      View all {orgTenders.length} tenders
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {organization.contact_email ? (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={`mailto:${organization.contact_email}`}
                    className="hover:underline"
                  >
                    {organization.contact_email}
                  </a>
                </div>
              ) : null}
              {organization.contact_phone ? (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{organization.contact_phone}</span>
                </div>
              ) : null}
              {!organization.contact_email && !organization.contact_phone && (
                <p className="text-sm text-muted-foreground italic">
                  No contact information available
                </p>
              )}
            </CardContent>
          </Card>

          {/* Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Total Tenders
                </span>
                <span className="font-semibold">{totalTenders}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Won</span>
                <span className="font-semibold text-green-600">
                  {wonTenders}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Lost</span>
                <span className="font-semibold text-red-600">{lostTenders}</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Win Rate</span>
                <span
                  className={cn(
                    'font-semibold',
                    winRate >= 50 ? 'text-green-600' : 'text-orange-600'
                  )}
                >
                  {winRate}%
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Dialog */}
      <OrganizationDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        organization={organization}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Organization</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this organization? This action
              cannot be undone. Note: You cannot delete organizations that have
              associated tenders.
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

function OrganizationDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-5 w-48 mb-2" />
        <Skeleton className="h-9 w-64" />
        <div className="flex gap-2 mt-2">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-20" />
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2">
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
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-36" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4 mt-2" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-24" />
            </CardHeader>
            <CardContent className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
