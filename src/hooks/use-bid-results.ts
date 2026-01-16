'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useCurrentCompanyId } from '@/contexts/company-context'
import type { BidOpeningResult, BidOpeningResultInsert } from '@/types/database'
import { toast } from 'sonner'

export function useBidOpeningResults(tenderId: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['bid-results', tenderId],
    queryFn: async () => {
      if (!tenderId) return []

      const { data, error } = await supabase
        .from('bid_opening_results')
        .select('*')
        .eq('tender_id', tenderId)
        .order('opening_date', { ascending: false })

      if (error) throw error
      return data as BidOpeningResult[]
    },
    enabled: !!tenderId,
  })
}

export function useCreateBidOpeningResult() {
  const queryClient = useQueryClient()
  const companyId = useCurrentCompanyId()
  const supabase = createClient()

  return useMutation({
    mutationFn: async (result: BidOpeningResultInsert) => {
      const { data, error } = await supabase
        .from('bid_opening_results')
        .insert(result)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['bid-results', data.tender_id] })
      queryClient.invalidateQueries({ queryKey: ['tenders', companyId] })
      toast.success('Bid opening result added successfully')
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })
}

export function useDeleteBidOpeningResult() {
  const queryClient = useQueryClient()
  const companyId = useCurrentCompanyId()
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({ id, tenderId }: { id: string; tenderId: string }) => {
      const { error } = await supabase
        .from('bid_opening_results')
        .delete()
        .eq('id', id)

      if (error) throw error
      return tenderId
    },
    onSuccess: (tenderId) => {
      queryClient.invalidateQueries({ queryKey: ['bid-results', tenderId] })
      queryClient.invalidateQueries({ queryKey: ['tenders', companyId] })
      toast.success('Bid opening result deleted')
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })
}
