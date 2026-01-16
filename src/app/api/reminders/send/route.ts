import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { format, differenceInDays } from 'date-fns'
import {
  sendEmail,
  generateReminderEmailHtml,
  generateReminderEmailText,
  type ReminderEmailData,
} from '@/lib/email'
import type { ReminderType } from '@/types/database'

interface TenderWithRelations {
  id: string
  title: string
  due_date: string
  organization: { name: string } | null
  user_company: { contact_email: string } | null
}

interface ReminderWithTender {
  id: string
  tender_id: string
  reminder_type: ReminderType
  scheduled_date: string
  sent: boolean
  tender: TenderWithRelations | null
}

// POST /api/reminders/send - Process and send pending reminders
export async function POST() {
  try {
    const supabase = await createClient()
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // Get pending reminders that are due
    const { data: reminders, error: fetchError } = await supabase
      .from('reminders')
      .select(`
        *,
        tender:tenders(
          id,
          title,
          due_date,
          organization:organizations(name),
          user_company:user_companies(contact_email)
        )
      `)
      .eq('sent', false)
      .lte('scheduled_date', new Date().toISOString())

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    if (!reminders || reminders.length === 0) {
      return NextResponse.json({ message: 'No pending reminders', sent: 0 })
    }

    const results: {
      success: string[]
      failed: { id: string; error: string }[]
    } = {
      success: [],
      failed: [],
    }

    for (const reminder of reminders as ReminderWithTender[]) {
      if (!reminder.tender) {
        results.failed.push({
          id: reminder.id,
          error: 'Tender not found',
        })
        continue
      }

      const { tender } = reminder
      const recipientEmail = tender.user_company?.contact_email

      if (!recipientEmail) {
        results.failed.push({
          id: reminder.id,
          error: 'No recipient email found',
        })
        continue
      }

      try {
        const daysRemaining = differenceInDays(new Date(tender.due_date), new Date())

        const emailData: ReminderEmailData = {
          tenderTitle: tender.title,
          organizationName: tender.organization?.name || 'Unknown Organization',
          dueDate: format(new Date(tender.due_date), 'MMMM d, yyyy'),
          daysRemaining: Math.max(0, daysRemaining),
          reminderType: reminder.reminder_type,
          tenderUrl: `${appUrl}/tenders/${tender.id}`,
        }

        const subject = getEmailSubject(reminder.reminder_type, tender.title)

        await sendEmail({
          to: recipientEmail,
          subject,
          html: generateReminderEmailHtml(emailData),
          text: generateReminderEmailText(emailData),
        })

        // Mark reminder as sent
        const { error: updateError } = await supabase
          .from('reminders')
          .update({
            sent: true,
            sent_at: new Date().toISOString(),
          })
          .eq('id', reminder.id)

        if (updateError) {
          results.failed.push({
            id: reminder.id,
            error: `Email sent but failed to update status: ${updateError.message}`,
          })
        } else {
          results.success.push(reminder.id)
        }
      } catch (emailError) {
        results.failed.push({
          id: reminder.id,
          error: emailError instanceof Error ? emailError.message : 'Failed to send email',
        })
      }
    }

    return NextResponse.json({
      message: 'Reminder processing complete',
      sent: results.success.length,
      failed: results.failed.length,
      details: results,
    })
  } catch (error) {
    console.error('Error processing reminders:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function getEmailSubject(type: ReminderType, tenderTitle: string): string {
  const shortTitle = tenderTitle.length > 40 ? tenderTitle.slice(0, 40) + '...' : tenderTitle

  switch (type) {
    case 'deadline_1day':
      return `URGENT: Tender Due Tomorrow - ${shortTitle}`
    case 'deadline_3days':
      return `Reminder: Tender Due in 3 Days - ${shortTitle}`
    case 'deadline_7days':
      return `Reminder: Tender Due in 7 Days - ${shortTitle}`
    case 'check_bid_opening':
      return `Check Bid Opening Results - ${shortTitle}`
    default:
      return `Tender Reminder - ${shortTitle}`
  }
}
