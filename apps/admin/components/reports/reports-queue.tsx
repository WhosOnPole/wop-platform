'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Check, X, Loader2, Eye } from 'lucide-react'

interface Report {
  id: number
  reporter_id: string
  target_id: string
  target_type: 'post' | 'grid' | 'profile' | 'comment'
  reason: string
  status: string
  created_at: string
  reporter?: {
    id: string
    username: string
  }
}

interface ReportsQueueProps {
  initialReports: Report[]
}

export function ReportsQueue({ initialReports }: ReportsQueueProps) {
  const supabase = createClientComponentClient()
  const [reports, setReports] = useState<Report[]>(initialReports)
  const [processing, setProcessing] = useState<number | null>(null)

  async function handleIgnore(reportId: number) {
    if (!confirm('Ignore this report? The content will remain visible.')) return

    setProcessing(reportId)
    const { error } = await supabase
      .from('reports')
      .update({ status: 'resolved_ignored' })
      .eq('id', reportId)

    if (error) {
      console.error('Error ignoring report:', error)
      alert('Failed to ignore report')
    } else {
      setReports(reports.filter((r) => r.id !== reportId))
    }
    setProcessing(null)
  }

  async function handleRemove(reportId: number, targetType: string, targetId: string) {
    if (
      !confirm(
        'Remove this content? This will deduct 5 points and add 1 strike to the content owner.'
      )
    )
      return

    setProcessing(reportId)

    try {
      // Delete the offending content based on target_type
      let deleteError = null
      if (targetType === 'post') {
        const { error } = await supabase.from('posts').delete().eq('id', targetId)
        deleteError = error
      } else if (targetType === 'comment') {
        const { error } = await supabase.from('comments').delete().eq('id', targetId)
        deleteError = error
      } else if (targetType === 'grid') {
        const { error } = await supabase.from('grids').delete().eq('id', targetId)
        deleteError = error
      } else if (targetType === 'profile') {
        // For profiles, we can't delete the profile, but we could ban the user
        // For now, just mark as resolved
        console.warn('Profile reports cannot delete the profile')
      }

      if (deleteError) {
        throw deleteError
      }

      // Update report status to resolved_removed (this triggers the points/strikes penalty)
      const { error: updateError } = await supabase
        .from('reports')
        .update({ status: 'resolved_removed' })
        .eq('id', reportId)

      if (updateError) throw updateError

      setReports(reports.filter((r) => r.id !== reportId))
    } catch (error: any) {
      console.error('Error removing content:', error)
      alert('Failed to remove content: ' + error.message)
    } finally {
      setProcessing(null)
    }
  }

  function getTargetTypeLabel(type: string) {
    return type.charAt(0).toUpperCase() + type.slice(1)
  }

  if (reports.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-12 text-center shadow">
        <p className="text-gray-500">No pending reports. All clear! 🎉</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {reports.map((report) => (
        <div
          key={report.id}
          className="rounded-lg border border-gray-200 bg-white p-6 shadow"
        >
          <div className="mb-4 flex items-start justify-between">
            <div>
              <div className="mb-2">
                <span className="inline-block rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800">
                  {getTargetTypeLabel(report.target_type)}
                </span>
                <span className="ml-2 text-sm text-gray-500">
                  Reported by {report.reporter?.username || 'Unknown'}
                </span>
              </div>
              <div className="text-sm text-gray-600">
                <strong>Target ID:</strong> {report.target_id}
              </div>
              <div className="mt-2 text-sm text-gray-900">
                <strong>Reason:</strong> {report.reason}
              </div>
              <div className="mt-1 text-xs text-gray-500">
                Reported on {new Date(report.created_at).toLocaleString()}
              </div>
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={() => handleIgnore(report.id)}
              disabled={processing === report.id}
              className="flex items-center space-x-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50"
            >
              {processing === report.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <X className="h-4 w-4" />
              )}
              <span>Ignore</span>
            </button>
            <button
              onClick={() => handleRemove(report.id, report.target_type, report.target_id)}
              disabled={processing === report.id}
              className="flex items-center space-x-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 disabled:opacity-50"
            >
              {processing === report.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              <span>Remove Content</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

