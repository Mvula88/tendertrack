'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useCurrentCompanyId } from '@/contexts/company-context'
import type { TenderCategory, TenderCategoryInsert } from '@/types/database'
import { toast } from 'sonner'

export function useCategories() {
  const companyId = useCurrentCompanyId()
  const supabase = createClient()

  return useQuery({
    queryKey: ['categories', companyId],
    queryFn: async () => {
      if (!companyId) return []

      // Get categories that are either system-wide (null company) or created by the current company
      const { data, error } = await supabase
        .from('tender_categories')
        .select('*')
        .or(`user_company_id.is.null,user_company_id.eq.${companyId}`)
        .order('name', { ascending: true })

      if (error) throw error
      return data as TenderCategory[]
    },
    enabled: !!companyId,
  })
}

export function useCreateCategory() {
  const queryClient = useQueryClient()
  const companyId = useCurrentCompanyId()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (name: string) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      if (!companyId) throw new Error('No company selected')

      const { data, error } = await supabase
        .from('tender_categories')
        .insert({
          name,
          user_company_id: companyId,
          created_by: user.id,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', companyId] })
      toast.success('Category created successfully')
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })
}

export function useDeleteCategory() {
  const queryClient = useQueryClient()
  const companyId = useCurrentCompanyId()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (id: string) => {
      // Only allow deleting categories created by this company
      const { error } = await supabase
        .from('tender_categories')
        .delete()
        .eq('id', id)
        .eq('user_company_id', companyId!)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', companyId] })
      toast.success('Category deleted successfully')
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })
}
