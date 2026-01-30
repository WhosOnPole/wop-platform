'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@/utils/supabase-client'
import { Power, PowerOff } from 'lucide-react'

interface AdminChatControlProps {
  trackId: string
  initialChatEnabled?: boolean
}

export function AdminChatControl({
  trackId,
  initialChatEnabled = true,
}: AdminChatControlProps) {
  const supabase = createClientComponentClient()
  const [chatEnabled, setChatEnabled] = useState(initialChatEnabled)
  const [isToggling, setIsToggling] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleToggle() {
    setIsToggling(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/chat/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trackId,
          enabled: !chatEnabled,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to toggle chat')
      }

      const data = await response.json()
      setChatEnabled(data.enabled)
    } catch (err: any) {
      console.error('Error toggling chat:', err)
      setError(err.message || 'Failed to toggle chat')
    } finally {
      setIsToggling(false)
    }
  }

  return (
    <div className="rounded-lg border border-white/10 bg-black/30 backdrop-blur-sm p-4 shadow">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Admin Controls</h3>
          <p className="mt-1 text-xs">
            {chatEnabled
              ? 'Chat is currently enabled'
              : 'Chat is currently disabled'}
          </p>
          {error && (
            <p className="mt-1 text-xs text-red-600">{error}</p>
          )}
        </div>
        <button
          onClick={handleToggle}
          disabled={isToggling}
          className={`flex items-center space-x-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            chatEnabled
              ? 'bg-red-600 text-white hover:bg-red-700'
              : 'bg-green-600 text-white hover:bg-green-700'
          } disabled:opacity-50`}
        >
          {chatEnabled ? (
            <>
              <PowerOff className="h-4 w-4" />
              <span>{isToggling ? 'Disabling...' : 'Disable Chat'}</span>
            </>
          ) : (
            <>
              <Power className="h-4 w-4" />
              <span>{isToggling ? 'Enabling...' : 'Enable Chat'}</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
