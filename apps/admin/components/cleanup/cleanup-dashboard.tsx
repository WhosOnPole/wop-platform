'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Trash2, Play, Settings } from 'lucide-react'

interface CleanupDashboardProps {
  initialConfigs: Array<{
    id: string
    cleanup_type: string
    retention_days: number
    enabled: boolean
    last_run_at: string | null
    items_cleaned_last_run: number
  }>
}

export function CleanupDashboard({ initialConfigs }: CleanupDashboardProps) {
  const supabase = createClientComponentClient()
  const [configs, setConfigs] = useState(initialConfigs)
  const [running, setRunning] = useState<string | null>(null)

  async function handleRunCleanup(cleanupType: string) {
    setRunning(cleanupType)
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      if (!supabaseUrl) {
        throw new Error('Supabase URL not configured')
      }

      const response = await fetch(
        `${supabaseUrl}/functions/v1/cleanup-data`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error('Failed to run cleanup')
      }

      window.location.reload()
    } catch (error: any) {
      console.error('Failed to run cleanup:', error)
      alert(`Failed to run cleanup: ${error.message}`)
    } finally {
      setRunning(null)
    }
  }

  async function toggleEnabled(id: string, enabled: boolean) {
    try {
      const { error } = await supabase
        .from('cleanup_config')
        .update({ enabled: !enabled })
        .eq('id', id)

      if (error) throw error

      setConfigs(configs.map(c => c.id === id ? { ...c, enabled: !enabled } : c))
    } catch (error: any) {
      console.error('Failed to toggle:', error)
      alert(`Failed to toggle: ${error.message}`)
    }
  }

  return (
    <div className="space-y-4">
      {configs.map((config) => (
        <div key={config.id} className="rounded-lg border border-gray-200 bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <Trash2 className="h-5 w-5 text-gray-500" />
                <h3 className="text-lg font-semibold text-gray-900">
                  {config.cleanup_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </h3>
              </div>
              <p className="mt-2 text-sm text-gray-600">
                Retention: {config.retention_days} days
              </p>
              {config.last_run_at && (
                <p className="mt-1 text-xs text-gray-500">
                  Last run: {new Date(config.last_run_at).toLocaleString()} 
                  {config.items_cleaned_last_run > 0 && (
                    <span> • Cleaned {config.items_cleaned_last_run} items</span>
                  )}
                </p>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={config.enabled}
                  onChange={() => toggleEnabled(config.id, config.enabled)}
                  className="peer sr-only"
                />
                <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
              </label>
              <button
                onClick={() => handleRunCleanup(config.cleanup_type)}
                disabled={running === config.cleanup_type}
                className="flex items-center space-x-2 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                <Play className="h-4 w-4" />
                <span>{running === config.cleanup_type ? 'Running...' : 'Run Now'}</span>
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

