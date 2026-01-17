/**
 * WhatsApp Integration Utility
 * This utility handles sending WhatsApp notifications to users.
 * It is designed to work with Twilio or Meta WhatsApp Business API.
 */

interface SendWhatsAppOptions {
  to: string
  message: string
  templateName?: string
  templateVars?: Record<string, string>
}

export async function sendWhatsAppMessage({ to, message, templateName, templateVars }: SendWhatsAppOptions) {
  // 1. Validate phone number (should be in E.164 format, e.g., +27...)
  const formattedTo = to.startsWith('+') ? to : `+${to}`
  
  console.log(`[WhatsApp] Preparing to send message to ${formattedTo}`)

  // 2. Check for API configuration
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const fromNumber = process.env.TWILIO_WHATSAPP_FROM // e.g., whatsapp:+14155238886

  if (!accountSid || !authToken || !fromNumber) {
    console.warn('[WhatsApp] API credentials not configured. Message logged but not sent.')
    return { success: false, error: 'API_NOT_CONFIGURED', message: 'Credentials missing' }
  }

  try {
    // Note: In a production environment with twilio installed, you would use:
    // const client = require('twilio')(accountSid, authToken);
    // await client.messages.create({ from: fromNumber, to: `whatsapp:${formattedTo}`, body: message });

    // Using fetch to stay dependency-light for now
    const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64')
    
    const params = new URLSearchParams()
    params.append('To', `whatsapp:${formattedTo}`)
    params.append('From', fromNumber)
    params.append('Body', message)

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params.toString()
      }
    )

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.message || 'Twilio API error')
    }

    console.log(`[WhatsApp] Message sent successfully: ${result.sid}`)
    return { success: true, sid: result.sid }

  } catch (error: any) {
    console.error('[WhatsApp] Failed to send message:', error.message)
    return { success: false, error: 'SEND_FAILED', message: error.message }
  }
}

/**
 * Pre-defined Notification Templates
 */
export const WHATSAPP_TEMPLATES = {
  DEADLINE_REMINDER: (tenderTitle: string, daysLeft: number) => 
    `🚨 *Tender Alert*: Your bid for "${tenderTitle}" is due in ${daysLeft} ${daysLeft === 1 ? 'day' : 'days'}. Ensure all documents are uploaded to TenderTrack.`,
  
  BID_OPENING_REMINDER: (tenderTitle: string) =>
    `📊 *Bid Opening*: The results for "${tenderTitle}" are being announced today. Log in to TenderTrack to record the outcome.`,
  
  WELCOME: (companyName: string) =>
    `✅ *Welcome to TenderTrack!* Your company "${companyName}" is now set up for WhatsApp alerts. We'll keep you updated on your most urgent deadlines.`
}
