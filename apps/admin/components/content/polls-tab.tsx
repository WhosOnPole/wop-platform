'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Plus, Edit, Trash2, Loader2 } from 'lucide-react'
import { PollModal } from './poll-modal'
import { Poll } from './content.types'

export function PollsTab() {
  const supabase = createClientComponentClient()
  const [polls, setPolls] = useState<Poll[]>([])
  const [loading, setLoading] = useState(true)
  const [editingPoll, setEditingPoll] = useState<Poll | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    loadPolls()
  }, [])

  async function loadPolls() {
    setLoading(true)
    const { data, error } = await supabase
      .from('polls')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading polls:', error)
    } else {
      setPolls(data || [])
    }
    setLoading(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this poll?')) return

    const { error } = await supabase.from('polls').delete().eq('id', id)

    if (error) {
      console.error('Error deleting poll:', error)
      toast.error('Failed to delete poll')
    } else {
      loadPolls()
    }
  }

  if (loading) {
    return (
      <div className="admin-table-card flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    )
  }

  const featuredPollExpired =
    polls.some(
      (p) =>
        p.is_featured_podium &&
        p.ends_at != null &&
        p.ends_at !== '' &&
        new Date(p.ends_at) < new Date()
    )

  return (
    <>
      {featuredPollExpired && (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800">
          <p className="text-sm font-medium">
            Your featured poll has expired. Create a new featured poll to keep it visible on Spotlight.
          </p>
        </div>
      )}

      <div className="mb-4 flex justify-end">
        <button
          onClick={() => setIsCreating(true)}
          className="admin-button-primary"
        >
          <Plus className="h-4 w-4" />
          <span>Create Poll</span>
        </button>
      </div>

      <div className="admin-table-card">
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Question</th>
                <th>Options</th>
                <th>Active Until</th>
                <th>Featured</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {polls.map((poll) => (
                <tr key={poll.id}>
                  <td>
                    <div className="text-md text-slate-900">{poll.question}</div>
                  </td>
                  <td>
                    <div className="text-sm text-slate-500">
                      {Array.isArray(poll.options) ? poll.options.length : 0} options
                    </div>
                  </td>
                  <td>
                    {poll.ends_at ? new Date(poll.ends_at).toLocaleString() : 'No end date'}
                  </td>
                  <td>
                    {poll.is_featured_podium && (
                      <span className="admin-status-review">
                        Featured
                      </span>
                    )}
                  </td>
                  <td>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setEditingPoll(poll)}
                        className="rounded-lg p-1.5 text-teal-600 transition hover:bg-teal-50"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(poll.id)}
                        className="rounded-lg p-1.5 text-red-600 transition hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {(isCreating || editingPoll) && (
        <PollModal
          poll={editingPoll}
          onClose={() => {
            setIsCreating(false)
            setEditingPoll(null)
            loadPolls()
          }}
        />
      )}
    </>
  )
}

