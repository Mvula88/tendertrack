'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useCurrentCompanyId } from '@/contexts/company-context'
import type { Competitor, CompetitorInsert, CompetitorUpdate, CompetitiveBid, CompetitiveBidInsert } from '@/types/database'
import { toast } from 'sonner'

export function useCompetitors() {
  const companyId = useCurrentCompanyId()
  const supabase = createClient()

  return useQuery({
    queryKey: ['competitors', companyId],
    queryFn: async () => {
      if (!companyId) return []

      // Get competitors that are either shared (null company) or created by the current company
      const { data, error } = await supabase
        .from('competitors')
        .select('*')
        .or(`user_company_id.is.null,user_company_id.eq.${companyId}`)
        .order('name', { ascending: true })

      if (error) throw error
      return data as Competitor[]
    },
    enabled: !!companyId,
  })
}

export function useCompetitor(id: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['competitors', id],
    queryFn: async () => {
      if (!id) return null

      const { data, error } = await supabase
        .from('competitors')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data as Competitor
    },
    enabled: !!id,
  })
}

export function useCreateCompetitor() {
  const queryClient = useQueryClient()
  const companyId = useCurrentCompanyId()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (competitor: Omit<CompetitorInsert, 'user_company_id'> & { shared?: boolean }) => {
      if (!companyId) throw new Error('No company selected')

      const { shared, ...competitorData } = competitor

      const { data, error } = await supabase
        .from('competitors')
        .insert({
          ...competitorData,
          user_company_id: shared ? null : companyId,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competitors', companyId] })
      toast.success('Competitor added successfully')
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })
}

export function useUpdateCompetitor() {
  const queryClient = useQueryClient()
  const companyId = useCurrentCompanyId()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ id, shared, ...competitor }: CompetitorUpdate & { id: string; shared?: boolean }) => {
      const updateData: CompetitorUpdate = {
        ...competitor,
      }

      if (shared !== undefined) {
        updateData.user_company_id = shared ? null : companyId
      }

      const { data, error } = await supabase
        .from('competitors')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['competitors', companyId] })
      queryClient.invalidateQueries({ queryKey: ['competitors', data.id] })
      toast.success('Competitor updated successfully')
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })
}

export function useDeleteCompetitor() {
  const queryClient = useQueryClient()
  const companyId = useCurrentCompanyId()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (id: string): Promise<{ success: boolean }> => {
      // First check if there are any competitive bids associated with this competitor
      const { count, error: countError } = await supabase
        .from('competitive_bids')
        .select('*', { count: 'exact', head: true })
        .eq('competitor_id', id)

      if (countError) throw countError

      if (count && count > 0) {
        // Show toast and return early (no error thrown = no error overlay)
        const message = `Cannot delete this competitor because they have ${count} recorded bid${count !== 1 ? 's' : ''}. Please delete the competitive bids first.`
        toast.error(message)
        return { success: false }
      }

      const { error } = await supabase
        .from('competitors')
        .delete()
        .eq('id', id)

      if (error) throw error
      return { success: true }
    },
    onSuccess: (data) => {
      // Only show success message and invalidate if actually deleted
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ['competitors', companyId] })
        toast.success('Competitor deleted successfully')
      }
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })
}

// Competitive Bids hooks
export function useCompetitiveBids(tenderId?: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['competitive-bids', tenderId],
    queryFn: async () => {
      if (!tenderId) return []

      const { data, error } = await supabase
        .from('competitive_bids')
        .select(`
          *,
          competitor:competitors(*)
        `)
        .eq('tender_id', tenderId)

      if (error) throw error
      return data
    },
    enabled: !!tenderId,
  })
}

export function useCompetitorBids(competitorId: string) {
  const companyId = useCurrentCompanyId()
  const supabase = createClient()

  return useQuery({
    queryKey: ['competitor-bids', competitorId, companyId],
    queryFn: async () => {
      if (!competitorId || !companyId) return []

      const { data, error } = await supabase
        .from('competitive_bids')
        .select(`
          *,
          tender:tenders(
            id,
            title,
            due_date,
            status,
            our_bid_amount,
            organization:organizations(name)
          )
        `)
        .eq('competitor_id', competitorId)
        .eq('tender.user_company_id', companyId)

      if (error) throw error
      return data.filter(bid => bid.tender !== null)
    },
    enabled: !!competitorId && !!companyId,
  })
}

export function useCreateCompetitiveBid() {
  const queryClient = useQueryClient()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (bid: CompetitiveBidInsert) => {
      const { data, error } = await supabase
        .from('competitive_bids')
        .insert(bid)
        .select()
        .single()

      if (error) throw error

      // Update competitor encounter count
      await supabase.rpc('increment_encounter_count', {
        p_competitor_id: bid.competitor_id,
      })

      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['competitive-bids', data.tender_id] })
      queryClient.invalidateQueries({ queryKey: ['competitors'] })
      toast.success('Competitive bid added')
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })
}
