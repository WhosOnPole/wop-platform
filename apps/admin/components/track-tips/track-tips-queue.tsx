'use client'

import { useState } from 'react'
import Image from 'next/image'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Check, X, Loader2, Pencil } from 'lucide-react'
import { sanitizeTipContent } from '@/utils/sanitize'
import { toast } from 'sonner'

type TrackTipType = 'tips' | 'stays' | 'meetups' | 'transit'

interface TrackTip {
  id: string
  user_id: string
  track_id: string
  tip_content: string
  status: string
  type?: TrackTipType
  created_at: string
  image_url?: string | null
  user?: {
    id: string
    username: string
  }
  track?: {
    id: string
    name: string
  }
}

const TIP_TYPE_OPTIONS: { value: TrackTipType; label: string }[] = [
  { value: 'tips', label: 'General tips' },
  { value: 'stays', label: 'Stay tips' },
  { value: 'transit', label: 'Transit tips' },
  { value: 'meetups', label: 'Meetups' },
]

interface TrackTipsQueueProps {
  initialTips: TrackTip[]
}

export function TrackTipsQueue({ initialTips }: TrackTipsQueueProps) {
  const supabase = createClientComponentClient()
  const [tips, setTips] = useState<TrackTip[]>(initialTips)
  const [processing, setProcessing] = useState<string | null>(null)
  const [editingTipId, setEditingTipId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState('')

  async function handleTypeChange(tipId: string, newType: TrackTipType) {
    setProcessing(tipId)
    const { error } = await supabase
      .from('track_tips')
      .update({ type: newType })
      .eq('id', tipId)

    if (error) {
      console.error('Error updating tip type:', error)
      toast.error('Failed to update tip type')
    } else {
      setTips(tips.map((t) => (t.id === tipId ? { ...t, type: newType } : t)))
    }
    setProcessing(null)
  }

  async function handleApprove(tipId: string) {
    setProcessing(tipId)
    const { error } = await supabase
      .from('track_tips')
      .update({ status: 'approved' })
      .eq('id', tipId)

    if (error) {
      console.error('Error approving tip:', error)
      toast.error('Failed to approve tip')
    } else {
      setTips(tips.filter((t) => t.id !== tipId))
    }
    setProcessing(null)
  }

  function startEditing(tip: TrackTip) {
    setEditingTipId(tip.id)
    setEditDraft(tip.tip_content)
  }

  function cancelEditing() {
    setEditingTipId(null)
    setEditDraft('')
  }

  async function handleSaveEdit(tipId: string) {
    const result = sanitizeTipContent(editDraft)
    if (!result.ok) {
      toast.error(result.error)
      return
    }

    setProcessing(tipId)
    const { error } = await supabase
      .from('track_tips')
      .update({ tip_content: result.value })
      .eq('id', tipId)

    if (error) {
      console.error('Error updating tip content:', error)
      toast.error('Failed to update tip content')
    } else {
      setTips(tips.map((t) => (t.id === tipId ? { ...t, tip_content: result.value } : t)))
      cancelEditing()
    }
    setProcessing(null)
  }

  async function handleReject(tipId: string) {
    if (
      !confirm(
        'Reject this track tip? The submitter will be notified and will not receive points. They can try again or reach out for appeal.'
      )
    )
      return

    setProcessing(tipId)
    const { error } = await supabase
      .from('track_tips')
      .update({ status: 'rejected' })
      .eq('id', tipId)

    if (error) {
      console.error('Error rejecting tip:', error)
      toast.error('Failed to reject tip')
    } else {
      setTips(tips.filter((t) => t.id !== tipId))
    }
    setProcessing(null)
  }

  if (tips.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
        <p className="font-bold text-slate-900">No pending track tips</p>
        <p className="mt-1 text-sm text-slate-500">All caught up.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {tips.map((tip) => (
        <div key={tip.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-md">
          <div className="mb-4">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="admin-status-active">
                {tip.track?.name || 'Unknown Track'}
              </span>
              <span className="text-sm font-medium text-slate-500">
                by {tip.user?.username || 'Unknown User'}
              </span>
            </div>
            <div className="mb-3">
              <label className="admin-form-label mb-1">Tip type</label>
              <select
                value={tip.type ?? 'tips'}
                onChange={(e) => handleTypeChange(tip.id, e.target.value as TrackTipType)}
                disabled={processing === tip.id}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 disabled:opacity-50"
              >
                {TIP_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-[#F8F9FB] p-4">
              {editingTipId === tip.id ? (
                <div className="space-y-2">
                  <textarea
                    value={editDraft}
                    onChange={(e) => setEditDraft(e.target.value)}
                    rows={4}
                    maxLength={2000}
                    className="admin-form-input"
                    placeholder="Tip content..."
                  />
                  <p className="text-xs text-slate-500">{editDraft.length}/2000</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSaveEdit(tip.id)}
                      disabled={processing === tip.id}
                      className="admin-button-primary px-3 py-1.5"
                    >
                      {processing === tip.id ? (
                        <Loader2 className="inline h-4 w-4 animate-spin" />
                      ) : (
                        'Save'
                      )}
                    </button>
                    <button
                      onClick={cancelEditing}
                      disabled={processing === tip.id}
                      className="admin-button-secondary px-3 py-1.5"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-2">
                  <p className="flex-1 text-sm leading-6 text-slate-900">{tip.tip_content}</p>
                  <button
                    onClick={() => startEditing(tip)}
                    disabled={processing === tip.id}
                    className="shrink-0 rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-200 hover:text-slate-700 disabled:opacity-50"
                    aria-label="Edit tip content"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
            {tip.image_url && (
              <div className="mt-3">
                <span className="admin-form-label mb-1">Submitted image</span>
                <a
                  href={tip.image_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block overflow-hidden rounded-2xl border border-slate-200 bg-slate-50"
                >
                  <Image
                    src={tip.image_url}
                    alt="Tip attachment"
                    width={320}
                    height={240}
                    className="h-auto max-h-60 w-full max-w-sm object-contain"
                    style={{ width: 'auto', height: 'auto' }}
                  />
                </a>
              </div>
            )}
            <div className="mt-2 text-xs font-medium text-slate-500">
              Submitted on {new Date(tip.created_at).toLocaleString()}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => handleReject(tip.id)}
              disabled={processing === tip.id}
              className="admin-button-secondary"
            >
              {processing === tip.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <X className="h-4 w-4" />
              )}
              <span>Deny</span>
            </button>
            <button
              onClick={() => handleApprove(tip.id)}
              disabled={processing === tip.id}
              className="admin-button-primary"
            >
              {processing === tip.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              <span>Approve (+2 points)</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

