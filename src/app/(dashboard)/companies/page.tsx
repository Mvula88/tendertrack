'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Building2,
  Plus,
  Settings,
  Users,
  TrendingUp,
  ChevronRight,
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useCompany } from '@/contexts/company-context'
import { useTenders } from '@/hooks/use-tenders'
import { cn } from '@/lib/utils'

export default function CompaniesPage() {
  const { companies, currentCompany, isLoading, switchCompany } = useCompany()
  const { data: tenders } = useTenders()

  // Calculate stats for each company
  const getCompanyStats = (companyId: string) => {
    const companyTenders = tenders?.filter((t) => t.user_company_id === companyId) ?? []
    const won = companyTenders.filter((t) => t.status === 'won').length
    const lost = companyTenders.filter((t) => t.status === 'lost').length
    const active = companyTenders.filter(
      (t) => !['won', 'lost', 'abandoned'].includes(t.status)
    ).length
    const winRate = won + lost > 0 ? Math.round((won / (won + lost)) * 100) : 0

    return { active, won, lost, winRate }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (isLoading) {
    return <CompaniesPageSkeleton />
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Companies</h1>
          <p className="text-muted-foreground">
            Manage your companies and team members
          </p>
        </div>
        <Link href="/companies/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Company
          </Button>
        </Link>
      </div>

      {/* Companies Grid */}
      {companies.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No companies yet</h3>
            <p className="text-muted-foreground text-sm mt-1">
              Create your first company to start tracking tenders
            </p>
            <Link href="/companies/new">
              <Button className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Create Company
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {companies.map((company) => {
            const stats = getCompanyStats(company.id)
            const isCurrentCompany = company.id === currentCompany?.id

            return (
              <Card
                key={company.id}
                className={cn(
                  'hover:shadow-md transition-shadow',
                  isCurrentCompany && 'ring-2 ring-primary'
                )}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={company.logo_url || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {getInitials(company.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{company.name}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            variant={isCurrentCompany ? 'default' : 'secondary'}
                          >
                            {company.role}
                          </Badge>
                          {isCurrentCompany && (
                            <Badge variant="outline" className="bg-primary/10">
                              Active
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 py-3 border-t border-b">
                    <div className="text-center">
                      <p className="text-2xl font-bold">{stats.active}</p>
                      <p className="text-xs text-muted-foreground">Active</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">
                        {stats.won}
                      </p>
                      <p className="text-xs text-muted-foreground">Won</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">{stats.winRate}%</p>
                      <p className="text-xs text-muted-foreground">Win Rate</p>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                    {company.contact_email && <p>{company.contact_email}</p>}
                    {company.contact_phone && <p>{company.contact_phone}</p>}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-4">
                    {!isCurrentCompany && (
                      <Button
                        className="flex-1"
                        onClick={() => switchCompany(company.id)}
                      >
                        Switch to this
                      </Button>
                    )}
                    {(company.role === 'owner' || company.role === 'admin') && (
                      <Link href={`/companies/${company.id}/settings`}>
                        <Button variant="outline" size="icon">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

function CompaniesPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-5 w-56 mt-2" />
        </div>
        <Skeleton className="h-10 w-36" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div>
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-5 w-20 mt-1" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 py-3">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="text-center">
                    <Skeleton className="h-8 w-12 mx-auto" />
                    <Skeleton className="h-3 w-10 mx-auto mt-1" />
                  </div>
                ))}
              </div>
              <Skeleton className="h-4 w-48 mt-3" />
              <Skeleton className="h-10 w-full mt-4" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
