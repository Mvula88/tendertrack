import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { ReminderType } from '@/types/database'

// GET /api/reminders - Get pending reminders
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { searchParams } = new URL(request.url)
    const tenderId = searchParams.get('tender_id')
    const pending = searchParams.get('pending') === 'true'

    let query = supabase
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
      .order('scheduled_date', { ascending: true })

    if (tenderId) {
      query = query.eq('tender_id', tenderId)
    }

    if (pending) {
      query = query.eq('sent', false).lte('scheduled_date', new Date().toISOString())
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ reminders: data })
  } catch (error) {
    console.error('Error fetching reminders:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/reminders - Create a new reminder
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { tender_id, reminder_type, scheduled_date } = body as {
      tender_id: string
      reminder_type: ReminderType
      scheduled_date: string
    }

    if (!tender_id || !reminder_type || !scheduled_date) {
      return NextResponse.json(
        { error: 'tender_id, reminder_type, and scheduled_date are required' },
        { status: 400 }
      )
    }

    // Validate reminder_type
    const validTypes: ReminderType[] = ['deadline_7days', 'deadline_3days', 'deadline_1day', 'check_bid_opening']
    if (!validTypes.includes(reminder_type)) {
      return NextResponse.json(
        { error: 'Invalid reminder_type' },
        { status: 400 }
      )
    }

    // Check if reminder already exists for this tender and type
    const { data: existing } = await supabase
      .from('reminders')
      .select('id')
      .eq('tender_id', tender_id)
      .eq('reminder_type', reminder_type)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'Reminder already exists for this tender and type' },
        { status: 409 }
      )
    }

    const { data, error } = await supabase
      .from('reminders')
      .insert({
        tender_id,
        reminder_type,
        scheduled_date,
        sent: false,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ reminder: data }, { status: 201 })
  } catch (error) {
    console.error('Error creating reminder:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/reminders - Delete a reminder
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('reminders')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting reminder:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
