import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe-server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const { amount } = await request.json()

  if (!amount || amount !== 10) {
    return new NextResponse('Invalid top-up amount', { status: 400 })
  }

  try {
    const { data: membership } = await supabase
      .from('user_company_members')
      .select('user_company_id')
      .eq('user_id', user.id)
      .single()

    if (!membership) {
      return new NextResponse('No company found', { status: 404 })
    }

    const priceId = process.env.STRIPE_CREDITS_10_PRICE_ID
    if (!priceId) {
      throw new Error('STRIPE_CREDITS_10_PRICE_ID is not configured')
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?success=true&tab=billing`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings?canceled=true&tab=billing`,
      customer_email: user.email,
      metadata: {
        userId: user.id,
        companyId: membership.user_company_id,
        type: 'credit_topup',
        credits: amount.toString(),
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error('Stripe error:', error)
    return new NextResponse(error.message, { status: 500 })
  }
}
