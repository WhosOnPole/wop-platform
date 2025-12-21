'use client'

import { useState, useEffect } from 'react'
import { RefreshCw, AlertTriangle, CheckCircle2, Clock } from 'lucide-react'

interface RefreshStatus {
  lastRefresh: string | null
  status: 'success' | 'error' | null
  canRefresh: boolean
  hoursRemaining: number
  hoursSinceRefresh: number
}

export function OpenF1RefreshButton() {
  const [status, setStatus] = useState<RefreshStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [countdown, setCountdown] = useState<number | null>(null)

  // Fetch refresh status on mount
  useEffect(() => {
    fetchStatus()
  }, [])

  // Update countdown timer
  useEffect(() => {
    if (status && !status.canRefresh && status.hoursRemaining > 0) {
      const interval = setInterval(() => {
        const now = Date.now()
        const lastRefreshTime = status.lastRefresh ? new Date(status.lastRefresh).getTime() : 0
        const hoursSinceRefresh = (now - lastRefreshTime) / (1000 * 60 * 60)
        const hoursRemaining = Math.max(0, 24 - hoursSinceRefresh)
        
        if (hoursRemaining <= 0) {
          setStatus((prev) => prev ? { ...prev, canRefresh: true, hoursRemaining: 0 } : null)
          setCountdown(null)
          clearInterval(interval)
        } else {
          setCountdown(hoursRemaining)
        }
      }, 60000) // Update every minute

      return () => clearInterval(interval)
    }
  }, [status])

  async function fetchStatus() {
    try {
      const response = await fetch('/api/openf1/refresh')
      if (response.ok) {
        const data = await response.json()
        setStatus(data)
        if (!data.canRefresh) {
          setCountdown(data.hoursRemaining)
        }
      }
    } catch (error) {
      console.error('Error fetching refresh status:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleRefresh() {
    if (!status?.canRefresh) {
      return
    }

    setRefreshing(true)
    setMessage(null)

    try {
      const response = await fetch('/api/openf1/refresh', {
        method: 'POST',
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({
          type: 'success',
          text: 'OpenF1 data refresh initiated successfully!',
        })
        // Refresh status after a short delay
        setTimeout(() => {
          fetchStatus()
        }, 1000)
      } else {
        setMessage({
          type: 'error',
          text: data.message || 'Failed to refresh data. Please try again later.',
        })
        // Update status if cooldown error
        if (response.status === 429) {
          fetchStatus()
        }
      }
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.message || 'An error occurred while refreshing data.',
      })
    } finally {
      setRefreshing(false)
    }
  }

  const hoursRemaining = countdown !== null ? countdown : (status?.hoursRemaining || 0)
  const canRefresh = status?.canRefresh ?? false

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          OpenF1 Data Refresh
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Manually trigger a refresh of F1 data from the OpenF1 API. This will update drivers, teams, and race schedules.
        </p>
      </div>

      {/* Warning Box */}
      <div className="mb-4 rounded-md bg-yellow-50 border border-yellow-200 p-4">
        <div className="flex items-start">
          <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
          <div className="text-sm text-yellow-800">
            <p className="font-semibold mb-1">Important:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Please wait at least 24 hours between refreshes</li>
              <li>If you need to refresh more frequently, contact the developer</li>
              <li>Automatic monthly refresh runs on the last day of each month</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Status Display */}
      {loading ? (
        <div className="text-sm text-gray-500">Loading status...</div>
      ) : (
        <div className="space-y-3">
          {status?.lastRefresh && (
            <div className="flex items-center text-sm text-gray-600">
              <Clock className="h-4 w-4 mr-2" />
              <span>
                Last refresh: {new Date(status.lastRefresh).toLocaleString()}
                {status.status && (
                  <span className={`ml-2 ${status.status === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                    ({status.status === 'success' ? 'Success' : 'Error'})
                  </span>
                )}
              </span>
            </div>
          )}

          {!canRefresh && hoursRemaining > 0 && (
            <div className="flex items-center text-sm text-orange-600 bg-orange-50 border border-orange-200 rounded-md p-3">
              <AlertTriangle className="h-4 w-4 mr-2" />
              <span>
                Cooldown active: {hoursRemaining.toFixed(1)} hours remaining before next refresh
              </span>
            </div>
          )}

          {/* Success/Error Messages */}
          {message && (
            <div
              className={`flex items-center text-sm rounded-md p-3 ${
                message.type === 'success'
                  ? 'bg-green-50 border border-green-200 text-green-800'
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              ) : (
                <AlertTriangle className="h-4 w-4 mr-2" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={!canRefresh || refreshing}
            className={`w-full flex items-center justify-center px-4 py-2 rounded-md font-medium transition-colors ${
              canRefresh && !refreshing
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {refreshing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Refreshing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh OpenF1 Data
              </>
            )}
          </button>

          {!canRefresh && (
            <p className="text-xs text-gray-500 text-center">
              Button disabled during cooldown period
            </p>
          )}
        </div>
      )}
    </div>
  )
}

