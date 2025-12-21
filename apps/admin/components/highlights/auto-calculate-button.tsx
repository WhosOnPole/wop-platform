'use client'

import { useState } from 'react'
import { Loader2, Sparkles } from 'lucide-react'

interface AutoCalculateButtonProps {
  weekStart: string
}

export function AutoCalculateButton({ weekStart }: AutoCalculateButtonProps) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleAutoCalculate() {
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      if (!supabaseUrl) {
        throw new Error('Supabase URL not configured')
      }

      const response = await fetch(
        `${supabaseUrl}/functions/v1/calculate-weekly-highlights`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({}),
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to calculate highlights')
      }

      const data = await response.json()
      setSuccess(true)
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (err: any) {
      setError(err.message || 'Failed to calculate highlights')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-end space-y-2">
      <button
        onClick={handleAutoCalculate}
        disabled={loading}
        className="flex items-center space-x-2 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Calculating...</span>
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            <span>Auto-Calculate</span>
          </>
        )}
      </button>
      {success && (
        <p className="text-xs text-green-600">Highlights calculated successfully!</p>
      )}
      {error && (
        <p className="text-xs text-red-600">{error}</p>
      )}
    </div>
  )
}

