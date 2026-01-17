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

export async function sendWhatsAppMessage({ to, message }: SendWhatsAppOptions) {
  // 1. Validate phone number (should be in E.164 format, e.g., 27...)
  const formattedTo = to.replace(/[^0-9]/g, '')
  
  console.log(`[WhatsApp] Preparing to send via Clickatell to ${formattedTo}`)

  // 2. Check for Clickatell API configuration
  const apiKey = process.env.CLICKATELL_API_KEY

  if (!apiKey) {
    console.warn('[WhatsApp] Clickatell API Key not configured. Message logged but not sent.')
    return { success: false, error: 'API_NOT_CONFIGURED', message: 'API Key missing' }
  }

  try {
    const response = await fetch(
      `https://platform.clickatell.com/v1/message`,
      {
        method: 'POST',
        headers: {
          'Authorization': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          messages: [
            {
              channel: 'whatsapp',
              to: formattedTo,
              content: message
            }
          ]
        })
      }
    )

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.messages?.[0]?.errorDescription || 'Clickatell API error')
    }

    console.log(`[WhatsApp] Message sent successfully via Clickatell`)
    return { success: true, sid: result.messages?.[0]?.apiMessageId }

  } catch (error: any) {
    console.error('[WhatsApp] Clickatell Error:', error.message)
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
