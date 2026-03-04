'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClientComponentClient } from '@/utils/supabase-client'

interface NotificationPreferences {
  user_id: string
  email_likes: boolean
  email_comments: boolean
  email_follows: boolean
  email_mentions: boolean
  email_poll_votes: boolean
  push_enabled: boolean
  created_at: string
  updated_at: string
}

interface UpdatePreferencesInput {
  email_likes?: boolean
  email_comments?: boolean
  email_follows?: boolean
  email_mentions?: boolean
  email_poll_votes?: boolean
  push_enabled?: boolean
}

export function useNotificationPreferences() {
  const supabase = createClientComponentClient()
  const queryClient = useQueryClient()

  // Fetch preferences
  const {
    data: preferences,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['notification-preferences'],
    queryFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        throw new Error('Not authenticated')
      }

      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', session.user.id)
        .single()

      if (error) {
        // If no preferences exist, create default ones
        if (error.code === 'PGRST116') {
          const { data: newPrefs, error: insertError } = await supabase
            .from('notification_preferences')
            .insert({
              user_id: session.user.id,
              email_likes: true,
              email_comments: true,
              email_follows: true,
              email_mentions: true,
              email_poll_votes: false,
              push_enabled: false,
            })
            .select()
            .single()

          if (insertError) {
            throw new Error(`Failed to create preferences: ${insertError.message}`)
          }

          return newPrefs as NotificationPreferences
        }

        throw new Error(`Failed to fetch preferences: ${error.message}`)
      }

      return data as NotificationPreferences
    },
  })

  // Update preferences
  const updateMutation = useMutation({
    mutationFn: async (updates: UpdatePreferencesInput) => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        throw new Error('Not authenticated')
      }

      const { error } = await supabase
        .from('notification_preferences')
        .update(updates)
        .eq('user_id', session.user.id)

      if (error) {
        throw new Error(`Failed to update preferences: ${error.message}`)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] })
    },
  })

  return {
    preferences,
    isLoading,
    error,
    updatePreferences: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
  }
}

