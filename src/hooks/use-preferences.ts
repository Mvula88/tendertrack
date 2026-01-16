'use client'

import { useState, useEffect, useCallback } from 'react'

export interface NotificationPreferences {
  deadlineReminders: boolean
  bidOpeningReminders: boolean
  weeklySummary: boolean
  newTenderAlerts: boolean
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  deadlineReminders: true,
  bidOpeningReminders: true,
  weeklySummary: false,
  newTenderAlerts: false,
}

const STORAGE_KEY = 'tender-notification-preferences'

export function useNotificationPreferences() {
  const [preferences, setPreferencesState] = useState<NotificationPreferences>(DEFAULT_PREFERENCES)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load preferences from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        setPreferencesState({ ...DEFAULT_PREFERENCES, ...parsed })
      }
    } catch (error) {
      console.error('Failed to load preferences:', error)
    }
    setIsLoaded(true)
  }, [])

  // Save a single preference
  const setPreference = useCallback(<K extends keyof NotificationPreferences>(
    key: K,
    value: NotificationPreferences[K]
  ) => {
    setPreferencesState((prev) => {
      const updated = { ...prev, [key]: value }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      } catch (error) {
        console.error('Failed to save preferences:', error)
      }
      return updated
    })
  }, [])

  // Save all preferences at once
  const setPreferences = useCallback((newPreferences: Partial<NotificationPreferences>) => {
    setPreferencesState((prev) => {
      const updated = { ...prev, ...newPreferences }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      } catch (error) {
        console.error('Failed to save preferences:', error)
      }
      return updated
    })
  }, [])

  return {
    preferences,
    setPreference,
    setPreferences,
    isLoaded,
  }
}
