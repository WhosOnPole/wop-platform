'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Check, X, Loader2, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { UserStoryEditModal } from './user-story-edit-modal'

interface UserStorySubmission {
  id: string
  user_id: string
  title: string
  summary: string | null
  content: string
  image_url: string | null
  status: string
  created_at: string
  user?: {
    id: string
    username: string
  }
}

export function UserStoriesTab() {
  const supabase = createClientComponentClient()
  const [submissions, setSubmissions] = useState<UserStorySubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [editingSubmission, setEditingSubmission] = useState<UserStorySubmission | null>(null)

  useEffect(() => {
    loadSubmissions()
  }, [])

  async function loadSubmissions() {
    setLoading(true)
    const { data, error } = await supabase
      .from('user_story_submissions')
      .select(
        `
        *,
        user:profiles!user_id (
          id,
          username
        )
      `
      )
      .eq('status', 'pending_approval')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading story submissions:', error)
    } else {
      setSubmissions(data || [])
    }
    setLoading(false)
  }

  async function handleApprove(id: string) {
    setProcessing(id)
    const sub = submissions.find((s) => s.id === id)
    if (!sub) return

    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) {
      toast.error('Session expired. Please log in again.')
      setProcessing(null)
      return
    }

    const { error } = await supabase
      .from('user_story_submissions')
      .update({ status: 'approved', updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      console.error('Error approving story:', error)
      toast.error('Failed to approve story')
      setProcessing(null)
      return
    }

    const { error: insertError } = await supabase.from('news_stories').insert({
      title: sub.title,
      content: sub.summary ? `${sub.summary}\n\n${sub.content}` : sub.content,
      image_url: sub.image_url,
      admin_id: session.user.id,
      submitter_id: sub.user_id,
      is_featured: false,
    })

    if (insertError) {
      console.error('Error promoting to news story:', insertError)
      toast.error('Story approved but failed to add to feed. You can create it manually from News Stories.')
    }

    setSubmissions(submissions.filter((s) => s.id !== id))
    setProcessing(null)
  }

  async function handleReject(id: string) {
    if (!confirm('Reject this story submission? The submitter can submit again if they wish.'))
      return

    setProcessing(id)
    const { error } = await supabase
      .from('user_story_submissions')
      .update({ status: 'rejected', updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      console.error('Error rejecting story:', error)
      toast.error('Failed to reject story')
    } else {
      setSubmissions(submissions.filter((s) => s.id !== id))
    }
    setProcessing(null)
  }

  if (loading) {
    return (
      <div className="admin-table-card flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {submissions.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <p className="font-bold text-slate-900">No pending story submissions</p>
          <p className="mt-1 text-sm text-slate-500">All caught up.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {submissions.map((sub) => (
            <div
              key={sub.id}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="mb-4">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="text-lg font-bold text-slate-900">{sub.title}</span>
                  <span className="admin-status-pending">
                    by {sub.user?.username || 'Unknown User'}
                  </span>
                </div>
                {sub.summary && (
                  <p className="mb-2 text-sm text-slate-600">{sub.summary}</p>
                )}
                <div className="rounded-2xl border border-slate-200 bg-[#F8F9FB] p-4">
                  <p className="whitespace-pre-wrap text-sm leading-6 text-slate-900">{sub.content}</p>
                </div>
                {sub.image_url && (
                  <div className="mt-3">
                    <img
                      src={sub.image_url}
                      alt="Story"
                      className="max-h-48 rounded-2xl border border-slate-200 object-cover"
                    />
                  </div>
                )}
                <div className="mt-2 text-xs font-medium text-slate-500">
                  Submitted on {new Date(sub.created_at).toLocaleString()}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setEditingSubmission(sub)}
                  className="admin-button-secondary"
                >
                  <Pencil className="h-4 w-4" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => handleReject(sub.id)}
                  disabled={processing === sub.id}
                  className="admin-button-secondary"
                >
                  {processing === sub.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <X className="h-4 w-4" />
                  )}
                  <span>Reject</span>
                </button>
                <button
                  onClick={() => handleApprove(sub.id)}
                  disabled={processing === sub.id}
                  className="admin-button-primary"
                >
                  {processing === sub.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  <span>Approve</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editingSubmission && (
        <UserStoryEditModal
          submission={editingSubmission}
          onClose={() => setEditingSubmission(null)}
          onSaved={() => loadSubmissions()}
        />
      )}
    </div>
  )
}
