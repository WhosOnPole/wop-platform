'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Loader2, Calendar } from 'lucide-react'

interface Race {
  id: string
  name: string
  start_date: string | null
}

interface ChatMessage {
  id: number
  message: string
  created_at: string
  user: {
    id: string
    username: string
    profile_image_url: string | null
  }
}

interface ChatLogsViewerProps {
  races: Race[]
}

export function ChatLogsViewer({ races }: ChatLogsViewerProps) {
  const supabase = createClientComponentClient()
  const [selectedRaceId, setSelectedRaceId] = useState<string>('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (selectedRaceId) {
      loadMessages(selectedRaceId)
    } else {
      setMessages([])
    }
  }, [selectedRaceId])

  async function loadMessages(raceId: string) {
    setLoading(true)
    const { data, error } = await supabase
      .from('live_chat_messages')
      .select(
        `
        *,
        user:profiles!user_id (
          id,
          username,
          profile_image_url
        )
      `
      )
      .eq('track_id', raceId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error loading messages:', error)
    } else {
      setMessages(data || [])
    }
    setLoading(false)
  }

  const selectedRace = races.find((r) => r.id === selectedRaceId)

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Race
        </label>
        <select
          value={selectedRaceId}
          onChange={(e) => setSelectedRaceId(e.target.value)}
          className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
        >
          <option value="">-- Select a race --</option>
          {races.map((race) => (
            <option key={race.id} value={race.id}>
              {race.name} - {race.start_date ? new Date(race.start_date).toLocaleDateString() : 'TBD'}
            </option>
          ))}
        </select>
      </div>

      {selectedRace && (
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow">
          <div className="mb-4 flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-gray-400" />
            <div>
              <h3 className="font-semibold text-gray-900">{selectedRace.name}</h3>
              {selectedRace.start_date && (
                <p className="text-sm text-gray-500">
                  {new Date(selectedRace.start_date).toLocaleString()}
                </p>
              )}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : messages.length === 0 ? (
            <p className="py-8 text-center text-gray-500">No messages for this race.</p>
          ) : (
            <div className="max-h-96 space-y-3 overflow-y-auto">
              {messages.map((message) => (
                <div key={message.id} className="flex items-start space-x-3 rounded-md bg-gray-50 p-3">
                  {message.user?.profile_image_url && (
                    <img
                      src={message.user.profile_image_url}
                      alt={message.user.username}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900">
                        {message.user?.username || 'Unknown'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(message.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-700">{message.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!selectedRaceId && (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center shadow">
          <p className="text-gray-500">Select a race to view its chat logs</p>
        </div>
      )}
    </div>
  )
}

