'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import type { UserCompanyWithRole } from '@/types/database'

interface CompanyContextType {
  currentCompany: UserCompanyWithRole | null
  companies: UserCompanyWithRole[]
  isLoading: boolean
  switchCompany: (companyId: string) => void
  refreshCompanies: () => Promise<void>
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined)

const STORAGE_KEY = 'tender_management_current_company'

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const [currentCompany, setCurrentCompany] = useState<UserCompanyWithRole | null>(null)
  const [companies, setCompanies] = useState<UserCompanyWithRole[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const queryClient = useQueryClient()
  const supabase = createClient()

  const fetchCompanies = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setCompanies([])
        setCurrentCompany(null)
        setIsLoading(false)
        return
      }

      // Fetch companies where user is a member
      const { data: memberData, error: memberError } = await supabase
        .from('user_company_members')
        .select(`
          role,
          user_companies (
            id,
            name,
            registration_number,
            vat_number,
            contact_email,
            contact_phone,
            address,
            logo_url,
            is_active,
            has_sample_data,
            ai_credits,
            company_history,
            core_services,
            bee_level,
            reference_projects,
            created_by,
            created_at,
            updated_at
          )
        `)
        .eq('user_id', user.id)

      if (memberError) {
        console.error('Error fetching companies:', JSON.stringify(memberError, null, 2))
        console.error('Error code:', memberError.code)
        console.error('Error message:', memberError.message)
        console.error('Error details:', memberError.details)
        setIsLoading(false)
        return
      }

      const companiesWithRoles: UserCompanyWithRole[] = (memberData || [])
        .filter(item => item.user_companies)
        .map(item => ({
          ...(item.user_companies as any),
          role: item.role
        }))

      setCompanies(companiesWithRoles)

      // Try to restore previous selection from localStorage
      const storedCompanyId = localStorage.getItem(STORAGE_KEY)

      if (storedCompanyId) {
        const storedCompany = companiesWithRoles.find(c => c.id === storedCompanyId)
        if (storedCompany) {
          setCurrentCompany(storedCompany)
        } else if (companiesWithRoles.length > 0) {
          setCurrentCompany(companiesWithRoles[0])
          localStorage.setItem(STORAGE_KEY, companiesWithRoles[0].id)
        }
      } else if (companiesWithRoles.length > 0) {
        setCurrentCompany(companiesWithRoles[0])
        localStorage.setItem(STORAGE_KEY, companiesWithRoles[0].id)
      }
    } catch (error) {
      console.error('Error in fetchCompanies:', error)
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchCompanies()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        fetchCompanies()
      } else if (event === 'SIGNED_OUT') {
        setCompanies([])
        setCurrentCompany(null)
        localStorage.removeItem(STORAGE_KEY)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [fetchCompanies, supabase.auth])

  const switchCompany = useCallback((companyId: string) => {
    const company = companies.find(c => c.id === companyId)
    if (company) {
      setCurrentCompany(company)
      localStorage.setItem(STORAGE_KEY, companyId)
      // Invalidate all company-scoped queries
      queryClient.invalidateQueries({ queryKey: ['tenders'] })
      queryClient.invalidateQueries({ queryKey: ['organizations'] })
      queryClient.invalidateQueries({ queryKey: ['competitors'] })
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['analytics'] })
    }
  }, [companies, queryClient])

  const refreshCompanies = useCallback(async () => {
    await fetchCompanies()
  }, [fetchCompanies])

  return (
    <CompanyContext.Provider
      value={{
        currentCompany,
        companies,
        isLoading,
        switchCompany,
        refreshCompanies,
      }}
    >
      {children}
    </CompanyContext.Provider>
  )
}

export function useCompany() {
  const context = useContext(CompanyContext)
  if (context === undefined) {
    throw new Error('useCompany must be used within a CompanyProvider')
  }
  return context
}

export function useCurrentCompanyId() {
  const { currentCompany } = useCompany()
  return currentCompany?.id
}
