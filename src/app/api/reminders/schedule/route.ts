import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { subDays, isAfter, startOfDay } from 'date-fns'
import type { ReminderType } from '@/types/database'

// POST /api/reminders/schedule - Auto-schedule reminders for a tender
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { tender_id } = body as { tender_id: string }

    if (!tender_id) {
      return NextResponse.json({ error: 'tender_id is required' }, { status: 400 })
    }

    // Fetch the tender to get the due date
    const { data: tender, error: tenderError } = await supabase
      .from('tenders')
      .select('id, title, due_date, status')
      .eq('id', tender_id)
      .single()

    if (tenderError || !tender) {
      return NextResponse.json(
        { error: tenderError?.message || 'Tender not found' },
        { status: 404 }
      )
    }

    // Don't schedule reminders for completed/abandoned tenders
    if (['won', 'lost', 'abandoned'].includes(tender.status)) {
      return NextResponse.json(
        { error: 'Cannot schedule reminders for completed or abandoned tenders' },
        { status: 400 }
      )
    }

    const dueDate = new Date(tender.due_date)
    const today = startOfDay(new Date())

    // Get existing reminders for this tender
    const { data: existingReminders } = await supabase
      .from('reminders')
      .select('reminder_type')
      .eq('tender_id', tender_id)

    const existingTypes = new Set(existingReminders?.map(r => r.reminder_type) || [])

    // Define reminder schedule
    const reminderSchedule: { type: ReminderType; daysBeforeDue: number }[] = [
      { type: 'deadline_7days', daysBeforeDue: 7 },
      { type: 'deadline_3days', daysBeforeDue: 3 },
      { type: 'deadline_1day', daysBeforeDue: 1 },
    ]

    const remindersToCreate: { reminder_type: ReminderType; scheduled_date: string }[] = []

    for (const schedule of reminderSchedule) {
      // Skip if reminder already exists
      if (existingTypes.has(schedule.type)) {
        continue
      }

      const scheduledDate = subDays(dueDate, schedule.daysBeforeDue)

      // Only create if the scheduled date is in the future
      if (isAfter(scheduledDate, today)) {
        remindersToCreate.push({
          reminder_type: schedule.type,
          scheduled_date: scheduledDate.toISOString(),
        })
      }
    }

    if (remindersToCreate.length === 0) {
      return NextResponse.json({
        message: 'No new reminders to schedule',
        scheduled: 0,
      })
    }

    // Create the reminders
    const { data: createdReminders, error: insertError } = await supabase
      .from('reminders')
      .insert(
        remindersToCreate.map(r => ({
          tender_id,
          reminder_type: r.reminder_type,
          scheduled_date: r.scheduled_date,
          sent: false,
        }))
      )
      .select()

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Reminders scheduled successfully',
      scheduled: createdReminders?.length || 0,
      reminders: createdReminders,
    })
  } catch (error) {
    console.error('Error scheduling reminders:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/reminders/schedule - Remove all pending reminders for a tender
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { searchParams } = new URL(request.url)
    const tenderId = searchParams.get('tender_id')

    if (!tenderId) {
      return NextResponse.json({ error: 'tender_id is required' }, { status: 400 })
    }

    // Delete all unsent reminders for this tender
    const { data, error } = await supabase
      .from('reminders')
      .delete()
      .eq('tender_id', tenderId)
      .eq('sent', false)
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Pending reminders deleted',
      deleted: data?.length || 0,
    })
  } catch (error) {
    console.error('Error deleting reminders:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
