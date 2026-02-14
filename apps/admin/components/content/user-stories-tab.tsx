'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Check, X, Loader2, Trash2 } from 'lucide-react'

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
  const [filter, setFilter] = useState<'pending' | 'all'>('pending')

  useEffect(() => {
    loadSubmissions()
  }, [filter])

  async function loadSubmissions() {
    setLoading(true)
    let query = supabase
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
      .order('created_at', { ascending: false })

    if (filter === 'pending') {
      query = query.eq('status', 'pending_approval')
    }

    const { data, error } = await query

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
      alert('Session expired. Please log in again.')
      setProcessing(null)
      return
    }

    const { error } = await supabase
      .from('user_story_submissions')
      .update({ status: 'approved', updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      console.error('Error approving story:', error)
      alert('Failed to approve story')
      setProcessing(null)
      return
    }

    const { error: insertError } = await supabase.from('news_stories').insert({
      title: sub.title,
      content: sub.summary ? `${sub.summary}\n\n${sub.content}` : sub.content,
      image_url: sub.image_url,
      admin_id: session.user.id,
      is_featured: false,
    })

    if (insertError) {
      console.error('Error promoting to news story:', insertError)
      alert('Story approved but failed to add to feed. You can create it manually from News Stories.')
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
      alert('Failed to reject story')
    } else {
      setSubmissions(submissions.filter((s) => s.id !== id))
    }
    setProcessing(null)
  }

  async function handleDelete(id: string) {
    if (
      !confirm(
        'Delete this story submission? This removes it from the submissions queue. If it was approved, the news story in the feed will remain.'
      )
    )
      return

    setProcessing(id)
    const { error } = await supabase.from('user_story_submissions').delete().eq('id', id)

    if (error) {
      console.error('Error deleting story submission:', error)
      alert('Failed to delete story submission')
    } else {
      setSubmissions(submissions.filter((s) => s.id !== id))
    }
    setProcessing(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('pending')}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              filter === 'pending'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
        </div>
      </div>

      {submissions.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center shadow">
          <p className="text-gray-500">
            {filter === 'pending'
              ? 'No pending story submissions. All caught up! 🎉'
              : 'No story submissions yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {submissions.map((sub) => (
            <div
              key={sub.id}
              className="rounded-lg border border-gray-200 bg-white p-6 shadow"
            >
              <div className="mb-4">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="text-lg font-semibold text-gray-900">{sub.title}</span>
                  <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                    by {sub.user?.username || 'Unknown User'}
                  </span>
                  {sub.status !== 'pending_approval' && (
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        sub.status === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {sub.status}
                    </span>
                  )}
                </div>
                {sub.summary && (
                  <p className="mb-2 text-sm text-gray-600">{sub.summary}</p>
                )}
                <div className="rounded-md bg-gray-50 p-4">
                  <p className="whitespace-pre-wrap text-sm text-gray-900">{sub.content}</p>
                </div>
                {sub.image_url && (
                  <div className="mt-3">
                    <img
                      src={sub.image_url}
                      alt="Story"
                      className="max-h-48 rounded-lg object-cover"
                    />
                  </div>
                )}
                <div className="mt-2 text-xs text-gray-500">
                  Submitted on {new Date(sub.created_at).toLocaleString()}
                </div>
              </div>

              {sub.status === 'pending_approval' ? (
                <div className="flex space-x-3">
                  <button
                    onClick={() => handleReject(sub.id)}
                    disabled={processing === sub.id}
                    className="flex items-center space-x-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50"
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
                    className="flex items-center space-x-2 rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 disabled:opacity-50"
                  >
                    {processing === sub.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                    <span>Approve</span>
                  </button>
                </div>
              ) : (
                <div className="flex space-x-3">
                  <button
                    onClick={() => handleDelete(sub.id)}
                    disabled={processing === sub.id}
                    className="flex items-center space-x-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-red-600 shadow-sm hover:bg-red-50 disabled:opacity-50"
                  >
                    {processing === sub.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    <span>Delete</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
