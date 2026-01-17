import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { ProcurementOpportunity } from '@/types/database'

export function useOpportunities(planId?: string) {
  return useQuery({
    queryKey: ['opportunities', planId],
    queryFn: async () => {
      if (!planId) return []
      
      const supabase = createClient()
      const { data, error } = await supabase
        .from('procurement_opportunities')
        .select('*')
        .eq('plan_id', planId)
        .order('closing_date', { ascending: true })

      if (error) throw error
      return data as ProcurementOpportunity[]
    },
    enabled: !!planId,
  })
}

export function useAllOpportunities() {
  return useQuery({
    queryKey: ['opportunities', 'all'],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('procurement_opportunities')
        .select(`
          *,
          plan:procurement_plans!inner(
            id,
            organization:organizations!inner(
              id,
              name,
              type
            )
          )
        `)
        .order('closing_date', { ascending: true })

      if (error) throw error
      return data
    },
  })
}
