import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export interface SendEmailOptions {
  to: string | string[]
  subject: string
  html: string
  text?: string
}

export async function sendEmail({ to, subject, html, text }: SendEmailOptions) {
  const from = process.env.RESEND_FROM_EMAIL || 'noreply@example.com'

  try {
    const { data, error } = await resend.emails.send({
      from,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text,
    })

    if (error) {
      console.error('Failed to send email:', error)
      throw new Error(error.message)
    }

    return data
  } catch (error) {
    console.error('Email sending error:', error)
    throw error
  }
}

export interface ReminderEmailData {
  tenderTitle: string
  organizationName: string
  dueDate: string
  daysRemaining: number
  reminderType: 'deadline_7days' | 'deadline_3days' | 'deadline_1day' | 'check_bid_opening'
  tenderUrl?: string
}

export function generateReminderEmailHtml(data: ReminderEmailData): string {
  const { tenderTitle, organizationName, dueDate, daysRemaining, reminderType, tenderUrl } = data

  const urgencyColor = daysRemaining <= 1 ? '#dc2626' : daysRemaining <= 3 ? '#ea580c' : '#ca8a04'
  const urgencyText = daysRemaining <= 1 ? 'URGENT' : daysRemaining <= 3 ? 'Important' : 'Reminder'

  let messageBody = ''
  switch (reminderType) {
    case 'deadline_1day':
      messageBody = `<p>This is an <strong style="color: ${urgencyColor};">urgent reminder</strong> that the following tender is due <strong>tomorrow</strong>:</p>`
      break
    case 'deadline_3days':
      messageBody = `<p>This is a reminder that the following tender is due in <strong>3 days</strong>:</p>`
      break
    case 'deadline_7days':
      messageBody = `<p>This is a reminder that the following tender is due in <strong>7 days</strong>:</p>`
      break
    case 'check_bid_opening':
      messageBody = `<p>Please check the <strong>bid opening results</strong> for the following tender:</p>`
      break
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tender Reminder</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Tender ${urgencyText}</h1>
  </div>

  <div style="background: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
    ${messageBody}

    <div style="background: white; padding: 16px; border-radius: 8px; border: 1px solid #e5e7eb; margin: 16px 0;">
      <h2 style="margin: 0 0 12px 0; font-size: 18px; color: #111827;">${tenderTitle}</h2>
      <p style="margin: 8px 0; color: #6b7280;">
        <strong>Organization:</strong> ${organizationName}
      </p>
      <p style="margin: 8px 0; color: #6b7280;">
        <strong>Due Date:</strong> <span style="color: ${urgencyColor}; font-weight: bold;">${dueDate}</span>
      </p>
      ${daysRemaining > 0 ? `
      <p style="margin: 8px 0; color: ${urgencyColor}; font-weight: bold;">
        ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining
      </p>
      ` : ''}
    </div>

    ${tenderUrl ? `
    <p>
      <a href="${tenderUrl}" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
        View Tender Details
      </a>
    </p>
    ` : ''}

    <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
      Please take appropriate action to ensure timely submission.
    </p>
  </div>

  <div style="background: #f3f4f6; padding: 16px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; border-top: none;">
    <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">
      This is an automated reminder from TrackTender.
    </p>
  </div>
</body>
</html>
`
}

export function generateReminderEmailText(data: ReminderEmailData): string {
  const { tenderTitle, organizationName, dueDate, daysRemaining, reminderType, tenderUrl } = data

  let message = ''
  switch (reminderType) {
    case 'deadline_1day':
      message = 'URGENT: This tender is due tomorrow!'
      break
    case 'deadline_3days':
      message = 'Reminder: This tender is due in 3 days.'
      break
    case 'deadline_7days':
      message = 'Reminder: This tender is due in 7 days.'
      break
    case 'check_bid_opening':
      message = 'Please check the bid opening results for this tender.'
      break
  }

  return `
${message}

Tender: ${tenderTitle}
Organization: ${organizationName}
Due Date: ${dueDate}
${daysRemaining > 0 ? `Days Remaining: ${daysRemaining}` : ''}

${tenderUrl ? `View details: ${tenderUrl}` : ''}

Please take appropriate action to ensure timely submission.

---
This is an automated reminder from TrackTender.
`.trim()
}
