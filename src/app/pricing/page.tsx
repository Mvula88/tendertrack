'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Check, Zap, Building2, Users, ArrowRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'

const plans = [
  {
    name: 'Free',
    description: 'Perfect for getting started',
    price: { monthly: 0, annual: 0 },
    currency: 'R',
    features: [
      '3 active tenders',
      '1 user',
      'Basic tender tracking',
      'Email reminders',
      'Mobile friendly',
    ],
    limitations: [
      'No export',
      'No analytics',
      'No competitor tracking',
    ],
    cta: 'Get Started',
    popular: false,
    priceId: null,
  },
  {
    name: 'Pro',
    description: 'For serious tender hunters',
    price: { monthly: 149, annual: 1199 },
    currency: 'R',
    features: [
      'Unlimited tenders',
      '3 team members',
      'Procurement plan tracking',
      'Competitor intelligence',
      'CSV & Excel export',
      'Priority email reminders',
      'Document uploads',
      'Full analytics',
    ],
    limitations: [],
    cta: 'Start Pro Trial',
    popular: true,
    priceId: {
      monthly: process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID,
      annual: process.env.NEXT_PUBLIC_STRIPE_PRO_ANNUAL_PRICE_ID,
    },
  },
  {
    name: 'Team',
    description: 'For growing companies',
    price: { monthly: 349, annual: 2999 },
    currency: 'R',
    features: [
      'Everything in Pro',
      '10 team members',
      'Advanced analytics',
      'Custom categories',
      'API access',
      'Priority support',
      'Team permissions',
      'Audit logs',
    ],
    limitations: [],
    cta: 'Start Team Trial',
    popular: false,
    priceId: {
      monthly: process.env.NEXT_PUBLIC_STRIPE_TEAM_MONTHLY_PRICE_ID,
      annual: process.env.NEXT_PUBLIC_STRIPE_TEAM_ANNUAL_PRICE_ID,
    },
  },
]

export default function PricingPage() {
  const [annual, setAnnual] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)
  const { user } = useAuth()
  const router = useRouter()

  const handleSubscribe = async (plan: typeof plans[0]) => {
    if (plan.name === 'Free') {
      if (user) {
        router.push('/dashboard')
      } else {
        router.push('/signup')
      }
      return
    }

    if (!user) {
      router.push('/signup?plan=' + plan.name.toLowerCase())
      return
    }

    setLoading(plan.name)
    try {
      const priceId = annual ? plan.priceId?.annual : plan.priceId?.monthly

      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      })

      const { url, error } = await response.json()

      if (error) {
        toast.error(error)
        return
      }

      if (url) {
        window.location.href = url
      }
    } catch (error) {
      toast.error('Failed to start checkout')
    } finally {
      setLoading(null)
    }
  }

  const savings = (plan: typeof plans[0]) => {
    if (plan.price.monthly === 0) return 0
    const monthlyCost = plan.price.monthly * 12
    const annualCost = plan.price.annual
    return Math.round(((monthlyCost - annualCost) / monthlyCost) * 100)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center">
            <Image
              src="/logo.png"
              alt="TrackTender"
              width={120}
              height={32}
              className="h-8 w-auto dark:invert"
              priority
            />
          </Link>
          <div className="flex items-center gap-4">
            {user ? (
              <Button asChild>
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button asChild>
                  <Link href="/signup">Get Started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 md:py-24">
        <div className="container text-center">
          <Badge variant="secondary" className="mb-4">
            Simple, transparent pricing
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Win more tenders,{' '}
            <span className="text-primary">pay less</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Start free, upgrade when you're ready. Cancel anytime.
            One tender win pays for years of TrackTender.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-12">
            <span className={annual ? 'text-muted-foreground' : 'font-medium'}>
              Monthly
            </span>
            <Switch checked={annual} onCheckedChange={setAnnual} />
            <span className={annual ? 'font-medium' : 'text-muted-foreground'}>
              Annual
            </span>
            {annual && (
              <Badge variant="default" className="bg-green-500">
                Save up to 33%
              </Badge>
            )}
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <Card
                key={plan.name}
                className={`relative flex flex-col ${
                  plan.popular
                    ? 'border-primary shadow-lg scale-105 z-10'
                    : 'border-border'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary">Most Popular</Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>

                <CardContent className="flex-1">
                  <div className="text-center mb-6">
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-4xl font-bold">
                        {plan.currency}
                        {annual ? Math.round(plan.price.annual / 12) : plan.price.monthly}
                      </span>
                      <span className="text-muted-foreground">/month</span>
                    </div>
                    {annual && plan.price.monthly > 0 && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {plan.currency}{plan.price.annual} billed annually
                        <span className="text-green-600 ml-2">
                          (Save {savings(plan)}%)
                        </span>
                      </p>
                    )}
                    {!annual && plan.price.monthly > 0 && (
                      <p className="text-sm text-muted-foreground mt-1">
                        or {plan.currency}{plan.price.annual}/year (save {savings(plan)}%)
                      </p>
                    )}
                  </div>

                  <ul className="space-y-3 text-left">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                    {plan.limitations.map((limitation) => (
                      <li key={limitation} className="flex items-start gap-3 text-muted-foreground">
                        <span className="h-5 w-5 flex items-center justify-center shrink-0">—</span>
                        <span className="text-sm">{limitation}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter>
                  <Button
                    className="w-full"
                    variant={plan.popular ? 'default' : 'outline'}
                    size="lg"
                    onClick={() => handleSubscribe(plan)}
                    disabled={loading === plan.name}
                  >
                    {loading === plan.name ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : plan.popular ? (
                      <Zap className="h-4 w-4 mr-2" />
                    ) : null}
                    {plan.cta}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-16 border-t bg-white dark:bg-slate-900">
        <div className="container text-center">
          <h2 className="text-2xl font-bold mb-2">Trusted by tender hunters across Southern Africa</h2>
          <p className="text-muted-foreground mb-8">
            Join companies winning government and private sector contracts
          </p>
          <div className="flex flex-wrap justify-center gap-8 text-muted-foreground">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              <span>Construction</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <span>IT Services</span>
            </div>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              <span>Consulting</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              <span>Security</span>
            </div>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              <span>Cleaning</span>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16">
        <div className="container max-w-3xl">
          <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">Can I cancel anytime?</h3>
              <p className="text-muted-foreground">
                Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your billing period.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">What payment methods do you accept?</h3>
              <p className="text-muted-foreground">
                We accept all major credit cards (Visa, Mastercard, Amex) and debit cards through our secure payment processor, Stripe.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Is there a free trial?</h3>
              <p className="text-muted-foreground">
                Yes! Our Free plan lets you try TrackTender with up to 3 active tenders. No credit card required.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Can I upgrade or downgrade later?</h3>
              <p className="text-muted-foreground">
                Absolutely. You can change your plan at any time. Upgrades take effect immediately, and downgrades take effect at your next billing date.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Do you offer discounts for annual billing?</h3>
              <p className="text-muted-foreground">
                Yes! Save up to 33% when you choose annual billing. That's like getting 4 months free.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to win more tenders?</h2>
          <p className="text-xl opacity-90 mb-8 max-w-xl mx-auto">
            Start free today. One tender win pays for years of TrackTender.
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link href="/signup">
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t">
        <div className="container flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="TrackTender"
              width={100}
              height={26}
              className="h-6 w-auto dark:invert"
            />
            <span className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} All rights reserved.
            </span>
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link href="/terms" className="hover:text-foreground">Terms</Link>
            <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link href="/contact" className="hover:text-foreground">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
