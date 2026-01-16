import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
})

export const PLANS = {
  free: {
    name: 'Free',
    description: 'Perfect for getting started',
    features: {
      maxTenders: 3,
      maxUsers: 1,
      export: false,
      analytics: false,
      competitorTracking: false,
      procurementPlans: false,
    },
  },
  pro: {
    name: 'Pro',
    description: 'For serious tender hunters',
    features: {
      maxTenders: -1, // unlimited
      maxUsers: 3,
      export: true,
      analytics: true,
      competitorTracking: true,
      procurementPlans: true,
    },
    stripePriceIds: {
      monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
      annual: process.env.STRIPE_PRO_ANNUAL_PRICE_ID,
    },
  },
  team: {
    name: 'Team',
    description: 'For growing companies',
    features: {
      maxTenders: -1,
      maxUsers: 10,
      export: true,
      analytics: true,
      competitorTracking: true,
      procurementPlans: true,
      apiAccess: true,
      auditLogs: true,
    },
    stripePriceIds: {
      monthly: process.env.STRIPE_TEAM_MONTHLY_PRICE_ID,
      annual: process.env.STRIPE_TEAM_ANNUAL_PRICE_ID,
    },
  },
} as const

export type PlanType = keyof typeof PLANS

export function getPlanFromPriceId(priceId: string): PlanType {
  if (
    priceId === process.env.STRIPE_PRO_MONTHLY_PRICE_ID ||
    priceId === process.env.STRIPE_PRO_ANNUAL_PRICE_ID
  ) {
    return 'pro'
  }
  if (
    priceId === process.env.STRIPE_TEAM_MONTHLY_PRICE_ID ||
    priceId === process.env.STRIPE_TEAM_ANNUAL_PRICE_ID
  ) {
    return 'team'
  }
  return 'free'
}
