'use client'

import { useState } from 'react'
import Image from 'next/image'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Check, X, Loader2 } from 'lucide-react'

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

  async function handleTypeChange(tipId: string, newType: TrackTipType) {
    setProcessing(tipId)
    const { error } = await supabase
      .from('track_tips')
      .update({ type: newType })
      .eq('id', tipId)

    if (error) {
      console.error('Error updating tip type:', error)
      alert('Failed to update tip type')
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
      alert('Failed to approve tip')
    } else {
      setTips(tips.filter((t) => t.id !== tipId))
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
      alert('Failed to reject tip')
    } else {
      setTips(tips.filter((t) => t.id !== tipId))
    }
    setProcessing(null)
  }

  if (tips.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-12 text-center shadow">
        <p className="text-gray-500">No pending track tips. All caught up! 🎉</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {tips.map((tip) => (
        <div key={tip.id} className="rounded-lg border border-gray-200 bg-white p-6 shadow">
          <div className="mb-4">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                {tip.track?.name || 'Unknown Track'}
              </span>
              <span className="text-sm text-gray-500">
                by {tip.user?.username || 'Unknown User'}
              </span>
            </div>
            <div className="mb-3">
              <label className="mb-1 block text-xs font-medium text-gray-500">Tip type</label>
              <select
                value={tip.type ?? 'tips'}
                onChange={(e) => handleTypeChange(tip.id, e.target.value as TrackTipType)}
                disabled={processing === tip.id}
                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 disabled:opacity-50"
              >
                {TIP_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="rounded-md bg-gray-50 p-4">
              <p className="text-sm text-gray-900">{tip.tip_content}</p>
            </div>
            {tip.image_url && (
              <div className="mt-3">
                <span className="mb-1 block text-xs font-medium text-gray-500">Submitted image</span>
                <a
                  href={tip.image_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block overflow-hidden rounded-lg border border-gray-200 bg-gray-50"
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
            <div className="mt-2 text-xs text-gray-500">
              Submitted on {new Date(tip.created_at).toLocaleString()}
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={() => handleReject(tip.id)}
              disabled={processing === tip.id}
              className="flex items-center space-x-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50"
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
              className="flex items-center space-x-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 disabled:opacity-50"
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

