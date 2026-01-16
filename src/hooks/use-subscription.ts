'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from './use-auth'
import { PLANS, PlanType } from '@/lib/stripe'

export interface Subscription {
  id: string
  user_id: string
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  stripe_price_id: string | null
  plan: PlanType
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete'
  current_period_start: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean
  created_at: string
  updated_at: string
}

export function useSubscription() {
  const supabase = createClient()
  const { user } = useAuth()

  return useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: async (): Promise<Subscription | null> => {
      if (!user) return null

      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error) {
        // No subscription found - return default free plan
        if (error.code === 'PGRST116') {
          return {
            id: '',
            user_id: user.id,
            stripe_customer_id: null,
            stripe_subscription_id: null,
            stripe_price_id: null,
            plan: 'free' as PlanType,
            status: 'active',
            current_period_start: null,
            current_period_end: null,
            cancel_at_period_end: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        }
        throw error
      }

      return data
    },
    enabled: !!user,
  })
}

export function usePlanFeatures() {
  const { data: subscription } = useSubscription()
  const plan = subscription?.plan || 'free'
  return PLANS[plan].features
}

export function usePlanLimits() {
  const { data: subscription } = useSubscription()
  const plan = subscription?.plan || 'free'
  const features = PLANS[plan].features

  return {
    plan,
    maxTenders: features.maxTenders,
    maxUsers: features.maxUsers,
    canExport: features.export,
    hasAnalytics: features.analytics,
    hasCompetitorTracking: features.competitorTracking,
    hasProcurementPlans: features.procurementPlans,
    hasApiAccess: 'apiAccess' in features ? features.apiAccess : false,
    hasAuditLogs: 'auditLogs' in features ? features.auditLogs : false,
    isUnlimited: features.maxTenders === -1,
  }
}
