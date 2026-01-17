import { createClient } from '@/lib/supabase/server'
import { sendWhatsAppMessage, WHATSAPP_TEMPLATES } from '@/lib/whatsapp'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const { phone, companyName } = await request.json()

    if (!phone) {
      return new NextResponse('Missing phone number', { status: 400 })
    }

    const message = WHATSAPP_TEMPLATES.WELCOME(companyName || 'Your Company')
    
    const result = await sendWhatsAppMessage({
      to: phone,
      message: message
    })

    if (!result.success) {
      return NextResponse.json(result, { status: result.error === 'API_NOT_CONFIGURED' ? 503 : 500 })
    }

    return NextResponse.json({ success: true, sid: result.sid })
  } catch (error: any) {
    console.error('Error sending test WhatsApp:', error)
    return new NextResponse(error.message, { status: 500 })
  }
}
