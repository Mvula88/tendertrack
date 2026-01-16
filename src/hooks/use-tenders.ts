'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useCurrentCompanyId } from '@/contexts/company-context'
import type { Tender, TenderInsert, TenderUpdate, TenderWithRelations, TenderStatus } from '@/types/database'
import { toast } from 'sonner'

export function useTenders() {
  const companyId = useCurrentCompanyId()
  const supabase = createClient()

  return useQuery({
    queryKey: ['tenders', companyId],
    queryFn: async () => {
      if (!companyId) return []

      const { data, error } = await supabase
        .from('tenders')
        .select(`
          *,
          organization:organizations(*),
          category:tender_categories(*)
        `)
        .eq('user_company_id', companyId)
        .order('due_date', { ascending: true })

      if (error) throw error
      return data as TenderWithRelations[]
    },
    enabled: !!companyId,
  })
}

export function useTender(id: string) {
  const companyId = useCurrentCompanyId()
  const supabase = createClient()

  return useQuery({
    queryKey: ['tenders', companyId, id],
    queryFn: async () => {
      if (!companyId || !id) return null

      const { data, error } = await supabase
        .from('tenders')
        .select(`
          *,
          organization:organizations(*),
          category:tender_categories(*),
          bid_opening_results(*)
        `)
        .eq('id', id)
        .eq('user_company_id', companyId)
        .single()

      if (error) throw error
      return data as TenderWithRelations
    },
    enabled: !!companyId && !!id,
  })
}

export function useCreateTender() {
  const queryClient = useQueryClient()
  const companyId = useCurrentCompanyId()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (tender: Omit<TenderInsert, 'user_company_id' | 'created_by'>) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      if (!companyId) throw new Error('No company selected')

      const { data, error } = await supabase
        .from('tenders')
        .insert({
          ...tender,
          user_company_id: companyId,
          created_by: user.id,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenders', companyId] })
      queryClient.invalidateQueries({ queryKey: ['dashboard', companyId] })
      toast.success('Tender created successfully')
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })
}

export function useUpdateTender() {
  const queryClient = useQueryClient()
  const companyId = useCurrentCompanyId()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ id, ...tender }: TenderUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('tenders')
        .update({
          ...tender,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_company_id', companyId!)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tenders', companyId] })
      queryClient.invalidateQueries({ queryKey: ['tenders', companyId, data.id] })
      queryClient.invalidateQueries({ queryKey: ['dashboard', companyId] })
      toast.success('Tender updated successfully')
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })
}

export function useDeleteTender() {
  const queryClient = useQueryClient()
  const companyId = useCurrentCompanyId()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('tenders')
        .delete()
        .eq('id', id)
        .eq('user_company_id', companyId!)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenders', companyId] })
      queryClient.invalidateQueries({ queryKey: ['dashboard', companyId] })
      toast.success('Tender deleted successfully')
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })
}

export function useTenderStats() {
  const companyId = useCurrentCompanyId()
  const supabase = createClient()

  return useQuery({
    queryKey: ['dashboard', companyId, 'stats'],
    queryFn: async () => {
      if (!companyId) return null

      const { data: tenders, error } = await supabase
        .from('tenders')
        .select('status, our_bid_amount, applied')
        .eq('user_company_id', companyId)

      if (error) throw error

      const totalActive = tenders.filter(t =>
        !['won', 'lost', 'abandoned'].includes(t.status)
      ).length

      const submitted = tenders.filter(t => t.applied).length
      const won = tenders.filter(t => t.status === 'won').length
      const lost = tenders.filter(t => t.status === 'lost').length
      const winRate = (won + lost) > 0 ? (won / (won + lost)) * 100 : 0

      const pipelineValue = tenders
        .filter(t => !['won', 'lost', 'abandoned'].includes(t.status) && t.our_bid_amount)
        .reduce((sum, t) => sum + (t.our_bid_amount || 0), 0)

      const statusCounts: Record<TenderStatus, number> = {
        identified: 0,
        evaluating: 0,
        preparing: 0,
        submitted: 0,
        bid_opening: 0,
        under_evaluation: 0,
        won: 0,
        lost: 0,
        abandoned: 0,
      }

      tenders.forEach(t => {
        statusCounts[t.status as TenderStatus]++
      })

      return {
        totalActive,
        submitted,
        winRate: Math.round(winRate),
        pipelineValue,
        statusCounts,
        total: tenders.length,
      }
    },
    enabled: !!companyId,
  })
}

export function useUpcomingDeadlines() {
  const companyId = useCurrentCompanyId()
  const supabase = createClient()

  return useQuery({
    queryKey: ['dashboard', companyId, 'upcoming'],
    queryFn: async () => {
      if (!companyId) return []

      const now = new Date()
      const sevenDaysFromNow = new Date()
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7)

      const { data, error } = await supabase
        .from('tenders')
        .select(`
          *,
          organization:organizations(name)
        `)
        .eq('user_company_id', companyId)
        .gte('due_date', now.toISOString())
        .lte('due_date', sevenDaysFromNow.toISOString())
        .not('status', 'in', '("won","lost","abandoned")')
        .order('due_date', { ascending: true })
        .limit(10)

      if (error) throw error
      return data
    },
    enabled: !!companyId,
  })
}
