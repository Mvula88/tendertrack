import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { TenderComplianceReport } from '@/types/database'
import { toast } from 'sonner'

export function useCompliance(tenderId?: string) {
  const queryClient = useQueryClient()
  const supabase = createClient()

  const { data: report, isLoading } = useQuery({
    queryKey: ['compliance', tenderId],
    queryFn: async () => {
      if (!tenderId) return null
      const { data, error } = await supabase
        .from('tender_compliance_reports')
        .select('*')
        .eq('tender_id', tenderId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      return data as TenderComplianceReport | null
    },
    enabled: !!tenderId,
  })

  const analyzeMutation = useMutation({
    mutationFn: async ({ documentUrl }: { documentUrl: string }) => {
      const response = await fetch('/api/tenders/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenderId, documentUrl }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to analyze tender')
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compliance', tenderId] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] }) // refresh credits
      toast.success('AI Analysis complete!')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  return {
    report,
    isLoading,
    analyze: analyzeMutation.mutate,
    isAnalyzing: analyzeMutation.isPending,
  }
}
