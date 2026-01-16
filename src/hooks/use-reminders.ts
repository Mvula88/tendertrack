'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Reminder, ReminderType } from '@/types/database'
import { toast } from 'sonner'

interface ReminderWithTender extends Reminder {
  tender: {
    id: string
    title: string
    due_date: string
    organization: { name: string } | null
    user_company: { contact_email: string } | null
  } | null
}

interface ScheduleResponse {
  message: string
  scheduled: number
  reminders?: Reminder[]
}

export function useReminders(tenderId?: string) {
  return useQuery({
    queryKey: ['reminders', tenderId],
    queryFn: async () => {
      const url = new URL('/api/reminders', window.location.origin)
      if (tenderId) {
        url.searchParams.set('tender_id', tenderId)
      }

      const response = await fetch(url.toString())
      if (!response.ok) {
        throw new Error('Failed to fetch reminders')
      }

      const data = await response.json()
      return data.reminders as ReminderWithTender[]
    },
  })
}

export function usePendingReminders() {
  return useQuery({
    queryKey: ['reminders', 'pending'],
    queryFn: async () => {
      const url = new URL('/api/reminders', window.location.origin)
      url.searchParams.set('pending', 'true')

      const response = await fetch(url.toString())
      if (!response.ok) {
        throw new Error('Failed to fetch pending reminders')
      }

      const data = await response.json()
      return data.reminders as ReminderWithTender[]
    },
  })
}

export function useCreateReminder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      tender_id: string
      reminder_type: ReminderType
      scheduled_date: string
    }) => {
      const response = await fetch('/api/reminders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create reminder')
      }

      return response.json()
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] })
      queryClient.invalidateQueries({ queryKey: ['reminders', variables.tender_id] })
      toast.success('Reminder created successfully')
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })
}

export function useDeleteReminder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/reminders?id=${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete reminder')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] })
      toast.success('Reminder deleted successfully')
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })
}

export function useScheduleReminders() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (tenderId: string) => {
      const response = await fetch('/api/reminders/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tender_id: tenderId }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to schedule reminders')
      }

      return response.json() as Promise<ScheduleResponse>
    },
    onSuccess: (data, tenderId) => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] })
      queryClient.invalidateQueries({ queryKey: ['reminders', tenderId] })
      if (data.scheduled > 0) {
        toast.success(`${data.scheduled} reminder${data.scheduled > 1 ? 's' : ''} scheduled`)
      } else {
        toast.info('No new reminders to schedule')
      }
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })
}

export function useClearReminders() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (tenderId: string) => {
      const response = await fetch(`/api/reminders/schedule?tender_id=${tenderId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to clear reminders')
      }

      return response.json()
    },
    onSuccess: (_, tenderId) => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] })
      queryClient.invalidateQueries({ queryKey: ['reminders', tenderId] })
      toast.success('Pending reminders cleared')
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })
}

export function useSendPendingReminders() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/reminders/send', {
        method: 'POST',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to send reminders')
      }

      return response.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['reminders'] })
      if (data.sent > 0) {
        toast.success(`${data.sent} reminder${data.sent > 1 ? 's' : ''} sent`)
      } else {
        toast.info('No pending reminders to send')
      }
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })
}
