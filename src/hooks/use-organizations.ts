'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useCurrentCompanyId } from '@/contexts/company-context'
import type { Organization, OrganizationInsert, OrganizationUpdate } from '@/types/database'
import { toast } from 'sonner'

export function useOrganizations() {
  const companyId = useCurrentCompanyId()
  const supabase = createClient()

  return useQuery({
    queryKey: ['organizations', companyId],
    queryFn: async () => {
      if (!companyId) return []

      // Get organizations that are either shared or created by the current company
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .or(`shared.eq.true,created_by_company_id.eq.${companyId}`)
        .order('name', { ascending: true })

      if (error) throw error
      return data as Organization[]
    },
    enabled: !!companyId,
  })
}

export function useOrganization(id: string) {
  const companyId = useCurrentCompanyId()
  const supabase = createClient()

  return useQuery({
    queryKey: ['organizations', companyId, id],
    queryFn: async () => {
      if (!id) return null

      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data as Organization
    },
    enabled: !!id,
  })
}

export function useCreateOrganization() {
  const queryClient = useQueryClient()
  const companyId = useCurrentCompanyId()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (organization: Omit<OrganizationInsert, 'created_by_company_id'>) => {
      if (!companyId) throw new Error('No company selected')

      const { data, error } = await supabase
        .from('organizations')
        .insert({
          ...organization,
          created_by_company_id: companyId,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations', companyId] })
      toast.success('Organization created successfully')
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })
}

export function useUpdateOrganization() {
  const queryClient = useQueryClient()
  const companyId = useCurrentCompanyId()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ id, ...organization }: OrganizationUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('organizations')
        .update(organization)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['organizations', companyId] })
      queryClient.invalidateQueries({ queryKey: ['organizations', companyId, data.id] })
      toast.success('Organization updated successfully')
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })
}

export function useDeleteOrganization() {
  const queryClient = useQueryClient()
  const companyId = useCurrentCompanyId()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (id: string): Promise<{ success: boolean }> => {
      // First check if there are any tenders associated with this organization
      const { count, error: countError } = await supabase
        .from('tenders')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', id)

      if (countError) throw countError

      if (count && count > 0) {
        // Show toast and return early (no error thrown = no error overlay)
        const message = `Cannot delete this organization because it has ${count} associated tender${count !== 1 ? 's' : ''}. Please delete or reassign the tenders first.`
        toast.error(message)
        return { success: false }
      }

      const { error } = await supabase
        .from('organizations')
        .delete()
        .eq('id', id)

      if (error) throw error
      return { success: true }
    },
    onSuccess: (data) => {
      // Only show success message and invalidate if actually deleted
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ['organizations', companyId] })
        toast.success('Organization deleted successfully')
      }
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })
}
