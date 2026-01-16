'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useCurrentCompanyId } from '@/contexts/company-context'
import type { ProcurementPlan, ProcurementPlanInsert, Organization } from '@/types/database'
import { toast } from 'sonner'

export type ProcurementPlanWithOrganization = ProcurementPlan & {
  organization: Organization
}

export function useProcurementPlans() {
  const companyId = useCurrentCompanyId()
  const supabase = createClient()

  return useQuery({
    queryKey: ['procurement-plans', companyId],
    queryFn: async () => {
      if (!companyId) return []

      const { data, error } = await supabase
        .from('procurement_plans')
        .select(`
          *,
          organization:organizations(*)
        `)
        .or(`user_company_id.is.null,user_company_id.eq.${companyId}`)
        .order('fiscal_year', { ascending: false })
        .order('revision_number', { ascending: false })

      if (error) throw error
      return data as ProcurementPlanWithOrganization[]
    },
    enabled: !!companyId,
  })
}

export function useProcurementPlan(id: string) {
  const companyId = useCurrentCompanyId()
  const supabase = createClient()

  return useQuery({
    queryKey: ['procurement-plans', companyId, id],
    queryFn: async () => {
      if (!id) return null

      const { data, error } = await supabase
        .from('procurement_plans')
        .select(`
          *,
          organization:organizations(*)
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      return data as ProcurementPlanWithOrganization
    },
    enabled: !!id,
  })
}

export function useProcurementPlansByOrganization(organizationId: string) {
  const companyId = useCurrentCompanyId()
  const supabase = createClient()

  return useQuery({
    queryKey: ['procurement-plans', companyId, 'organization', organizationId],
    queryFn: async () => {
      if (!organizationId) return []

      const { data, error } = await supabase
        .from('procurement_plans')
        .select(`
          *,
          organization:organizations(*)
        `)
        .eq('organization_id', organizationId)
        .order('fiscal_year', { ascending: false })

      if (error) throw error
      return data as ProcurementPlanWithOrganization[]
    },
    enabled: !!organizationId,
  })
}

export function useCreateProcurementPlan() {
  const queryClient = useQueryClient()
  const companyId = useCurrentCompanyId()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (plan: Omit<ProcurementPlanInsert, 'user_company_id' | 'created_by'>) => {
      if (!companyId) throw new Error('No company selected')

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('procurement_plans')
        .insert({
          ...plan,
          user_company_id: companyId,
          created_by: user.id,
        })
        .select(`
          *,
          organization:organizations(*)
        `)
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['procurement-plans', companyId] })
      toast.success('Procurement plan added successfully')
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })
}

export function useDeleteProcurementPlan() {
  const queryClient = useQueryClient()
  const companyId = useCurrentCompanyId()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('procurement_plans')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['procurement-plans', companyId] })
      toast.success('Procurement plan deleted successfully')
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })
}
