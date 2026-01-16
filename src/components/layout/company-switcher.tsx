'use client'

import { Building2, Check, ChevronsUpDown, Plus } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { useCompany } from '@/contexts/company-context'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'

export function CompanySwitcher() {
  const { currentCompany, companies, isLoading, switchCompany } = useCompany()

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-4 w-32" />
      </div>
    )
  }

  if (!currentCompany) {
    return (
      <Link href="/onboarding">
        <Button variant="outline" size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Create Company
        </Button>
      </Link>
    )
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center gap-2 px-2 py-1.5 h-auto"
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={currentCompany.logo_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {getInitials(currentCompany.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col items-start">
            <span className="text-sm font-medium truncate max-w-[150px]">
              {currentCompany.name}
            </span>
            <span className="text-xs text-muted-foreground capitalize">
              {currentCompany.role}
            </span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[250px]">
        <DropdownMenuLabel>Switch Company</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {companies.map((company) => (
          <DropdownMenuItem
            key={company.id}
            onClick={() => switchCompany(company.id)}
            className="flex items-center gap-2 cursor-pointer"
          >
            <Avatar className="h-6 w-6">
              <AvatarImage src={company.logo_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                {getInitials(company.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{company.name}</p>
              <p className="text-xs text-muted-foreground capitalize">
                {company.role}
              </p>
            </div>
            {company.id === currentCompany.id && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/companies" className="flex items-center gap-2 cursor-pointer">
            <Building2 className="h-4 w-4" />
            Manage Companies
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/companies/new" className="flex items-center gap-2 cursor-pointer">
            <Plus className="h-4 w-4" />
            Add Company
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
