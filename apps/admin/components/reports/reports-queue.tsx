'use client'

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Check, X, Loader2, Eye } from 'lucide-react'
import { toast } from 'sonner'

interface Report {
  id: number
  reporter_id: string
  target_id: string
  target_type: 'post' | 'grid' | 'profile' | 'comment' | 'grid_slot_comment' | 'chat_message'
  reason: string
  status: string
  created_at: string
  reporter?: {
    id: string
    username: string
  }
  targetPreview?: {
    type: string
    content?: string | null
    username?: string | null
    image?: string | null
    parent_page_type?: string | null
    parent_page_id?: string | null
    parent_name?: string | null
  } | null
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
      toast.error('Failed to ignore report')
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
      const res = await fetch('/api/reports/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId, targetType, targetId }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        const msg = data?.error || res.statusText || 'Failed to remove content'
        console.error('Remove content error:', res.status, msg, data)
        throw new Error(msg)
      }

      setReports(reports.filter((r) => r.id !== reportId))
    } catch (error: any) {
      console.error('Error removing content:', error)
      toast.error('Failed to remove content: ' + (error?.message || 'Unknown error'))
    } finally {
      setProcessing(null)
    }
  }

  function getTargetTypeLabel(type: string) {
    if (type === 'grid_slot_comment') return 'Grid slot comment'
    if (type === 'chat_message') return 'Chat message'
    return type.charAt(0).toUpperCase() + type.slice(1)
  }

  if (reports.length === 0) {
    return (
      <div className="admin-table-card flex flex-col items-center p-12 text-center">
        <div className="mb-3 rounded-full bg-teal-50 p-3 text-teal-600">
          <Check className="h-7 w-7" />
        </div>
        <p className="text-lg font-bold text-slate-900">No pending reports</p>
        <p className="mt-1 text-sm text-slate-500">Moderation queue is clear.</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {reports.map((report) => (
        <div
          key={report.id}
          className="rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-md"
        >
          <div className="border-b border-slate-200 p-5">
            <div>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="admin-status-disabled">
                  {getTargetTypeLabel(report.target_type)}
                </span>
                <span className="text-sm font-medium text-slate-500">
                  Reported by {report.reporter?.username || 'Unknown'}
                </span>
              </div>
              <h3 className="text-lg font-bold tracking-tight text-slate-900">
                {report.reason || 'No reason provided'}
              </h3>
              <div className="mt-2 text-xs font-medium text-slate-500">
                Reported on {new Date(report.created_at).toLocaleString()}
              </div>
            </div>
          </div>

          <div className="p-5">
              {report.targetPreview ? (
                <div className="rounded-2xl border border-slate-200 bg-[#F8F9FB] p-4 text-sm text-slate-800">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="font-bold text-slate-900">
                      Reported{' '}
                      {report.targetPreview.type === 'comment' ||
                      report.targetPreview.type === 'grid_slot_comment'
                        ? 'Comment'
                        : report.targetPreview.type === 'chat_message'
                          ? 'Message'
                          : 'Content'}
                    </span>
                    {report.targetPreview.username && (
                      <span className="text-xs font-medium text-slate-500">by {report.targetPreview.username}</span>
                    )}
                  </div>
                  {report.targetPreview.image ? (
                    <img
                      src={report.targetPreview.image}
                      alt="Reported item"
                      className="max-h-56 w-full rounded-xl border border-slate-200 object-cover"
                    />
                  ) : (
                    <p className="whitespace-pre-line border-l-4 border-teal-500 bg-white p-3 text-sm leading-6 text-slate-700">
                      {report.targetPreview.content || 'No preview available'}
                    </p>
                  )}
                  {report.targetPreview.parent_page_type && report.targetPreview.parent_page_id && (
                    <p className="mt-3 text-xs font-medium text-slate-500">
                      {report.targetPreview.parent_name
                        ? `${getTargetTypeLabel(report.targetPreview.parent_page_type)}: ${report.targetPreview.parent_name}`
                        : `${report.targetPreview.parent_page_type} (${report.targetPreview.parent_page_id})`}
                    </p>
                  )}
                </div>
              ) : (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-800">
                  Content no longer available (may have been deleted)
                </div>
              )}

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Target ID</p>
                  <p className="mt-1 break-all font-mono text-xs text-slate-700">{report.target_id}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Reporter ID</p>
                  <p className="mt-1 break-all font-mono text-xs text-slate-700">{report.reporter_id}</p>
                </div>
              </div>
          </div>

          <div className="flex gap-3 border-t border-slate-200 bg-slate-50 p-5">
            <button
              onClick={() => handleIgnore(report.id)}
              disabled={processing === report.id}
              className="admin-button-secondary flex-1"
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
              className="admin-button-danger flex-1"
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

