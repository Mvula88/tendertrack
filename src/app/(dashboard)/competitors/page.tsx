'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Users,
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Globe,
  Lock,
  Trophy,
  Target,
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useCompany } from '@/contexts/company-context'
import { useCompetitors, useDeleteCompetitor } from '@/hooks/use-competitors'
import { CompetitorDialog } from '@/components/competitors/competitor-dialog'
import type { Competitor } from '@/types/database'

export default function CompetitorsPage() {
  const { currentCompany, isLoading: companyLoading } = useCompany()
  const { data: competitors, isLoading: competitorsLoading } = useCompetitors()
  const deleteCompetitor = useDeleteCompetitor()

  const [searchQuery, setSearchQuery] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCompetitor, setEditingCompetitor] = useState<Competitor | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [competitorToDelete, setCompetitorToDelete] = useState<string | null>(null)

  // Filter competitors
  const filteredCompetitors = competitors?.filter((competitor) =>
    competitor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    competitor.specialty_areas?.some((area) =>
      area.toLowerCase().includes(searchQuery.toLowerCase())
    )
  ) ?? []

  const handleEdit = (competitor: Competitor) => {
    setEditingCompetitor(competitor)
    setDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    setCompetitorToDelete(id)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (competitorToDelete) {
      await deleteCompetitor.mutateAsync(competitorToDelete)
      setDeleteDialogOpen(false)
      setCompetitorToDelete(null)
    }
  }

  const handleDialogClose = () => {
    setDialogOpen(false)
    setEditingCompetitor(null)
  }

  if (companyLoading) {
    return <CompetitorsPageSkeleton />
  }

  if (!currentCompany) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Users className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-2xl font-semibold">No Company Selected</h2>
        <p className="text-muted-foreground">Select a company to view competitors.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Competitors</h1>
          <p className="text-muted-foreground">
            Track and analyze your competition in the tender market
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Competitor
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search competitors or specialties..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Competitors Grid */}
      {competitorsLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredCompetitors.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No competitors found</h3>
            <p className="text-muted-foreground text-sm mt-1">
              {searchQuery
                ? 'Try adjusting your search'
                : 'Get started by adding your first competitor'}
            </p>
            {!searchQuery && (
              <Button className="mt-4" onClick={() => setDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Competitor
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCompetitors.map((competitor) => (
            <Card key={competitor.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/competitors/${competitor.id}`}
                      className="hover:underline"
                    >
                      <CardTitle className="text-lg truncate">
                        {competitor.name}
                      </CardTitle>
                    </Link>
                    <div className="flex items-center gap-2 mt-1">
                      {competitor.user_company_id === null ? (
                        <Badge variant="outline" className="text-xs">
                          <Globe className="h-3 w-3 mr-1" />
                          Shared
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          <Lock className="h-3 w-3 mr-1" />
                          Private
                        </Badge>
                      )}
                    </div>
                  </div>
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
                        <Link href={`/competitors/${competitor.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEdit(competitor)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDelete(competitor.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Specialty Areas */}
                  {competitor.specialty_areas && competitor.specialty_areas.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {competitor.specialty_areas.slice(0, 3).map((area, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {area}
                        </Badge>
                      ))}
                      {competitor.specialty_areas.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{competitor.specialty_areas.length - 3}
                        </Badge>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      No specialties listed
                    </p>
                  )}

                  {/* Stats */}
                  <div className="flex items-center gap-4 pt-2 border-t">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Target className="h-4 w-4" />
                      <span>{competitor.encounter_count} encounters</span>
                    </div>
                  </div>
                </div>
                <Link href={`/competitors/${competitor.id}`}>
                  <Button variant="ghost" className="w-full mt-4" size="sm">
                    <Trophy className="mr-2 h-4 w-4" />
                    View Analysis
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Competitor Dialog */}
      <CompetitorDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        competitor={editingCompetitor}
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

function CompetitorsPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-5 w-72 mt-2" />
        </div>
        <Skeleton className="h-10 w-40" />
      </div>
      <Card>
        <CardContent className="pt-6">
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
