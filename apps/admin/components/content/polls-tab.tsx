'use client'

import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Plus, Edit, Trash2, Loader2, Star } from 'lucide-react'
import { PollModal } from './poll-modal'
import { Poll } from './content.types'

function PollTable({
  polls,
  showFeatured,
  onEdit,
  onDelete,
  onSetFeatured,
  emptyMessage,
}: {
  polls: Poll[]
  showFeatured?: boolean
  onEdit?: (poll: Poll) => void
  onDelete: (id: string) => void
  onSetFeatured?: (id: string) => void
  emptyMessage: string
}) {
  if (polls.length === 0) {
    return (
      <div className="px-6 py-10 text-center text-sm text-slate-500">{emptyMessage}</div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Question</th>
            <th>Options</th>
            {showFeatured ? <th>Featured</th> : <th>Created</th>}
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
              <td className="px-6 py-4">
                {showFeatured ? (
                  poll.is_featured_podium ? (
                    <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800">
                      Featured
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
                  )
                ) : (
                  <div className="text-sm text-slate-500">
                    {poll.created_at
                      ? new Date(poll.created_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : '—'}
                  </div>
                )}
              </td>
              <td>
                <div className="flex space-x-2">
                  {showFeatured && onSetFeatured && !poll.is_featured_podium && (
                    <button
                      type="button"
                      onClick={() => onSetFeatured(poll.id)}
                      className="rounded-lg p-1.5 text-amber-600 transition hover:bg-amber-50"
                      title="Set as featured"
                      aria-label="Set as featured"
                    >
                      <Star className="h-4 w-4" />
                    </button>
                  )}
                  {onEdit && (
                    <button
                      type="button"
                      onClick={() => onEdit(poll)}
                      className="rounded-lg p-1.5 text-teal-600 transition hover:bg-teal-50"
                      aria-label="Edit poll"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => onDelete(poll.id)}
                    className="rounded-lg p-1.5 text-red-600 transition hover:bg-red-50"
                    aria-label="Delete poll"
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
  )
}

export function PollsTab() {
  const supabase = createClientComponentClient()
  const [polls, setPolls] = useState<Poll[]>([])
  const [loading, setLoading] = useState(true)
  const [editingPoll, setEditingPoll] = useState<Poll | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [featuringId, setFeaturingId] = useState<string | null>(null)

  useEffect(() => {
    loadPolls()
  }, [])

  const adminPolls = useMemo(
    () => polls.filter((poll) => poll.admin_id != null),
    [polls]
  )
  const communityPolls = useMemo(
    () => polls.filter((poll) => poll.admin_id == null),
    [polls]
  )

  async function loadPolls() {
    setLoading(true)
    const { data, error } = await supabase
      .from('polls')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading polls:', error)
      toast.error('Failed to load polls')
    } else {
      setPolls(data || [])
    }
    setLoading(false)
  }

  async function unfeatureAllExcept(pollId: string) {
    const { error } = await supabase
      .from('polls')
      .update({ is_featured_podium: false })
      .neq('id', pollId)

    if (error) throw error
  }

  async function setFeaturedPoll(pollId: string) {
    const target = polls.find((poll) => poll.id === pollId)
    if (!target?.admin_id) {
      toast.error('Only admin polls can be featured')
      return
    }

    setFeaturingId(pollId)
    try {
      await unfeatureAllExcept(pollId)
      const { error } = await supabase
        .from('polls')
        .update({ is_featured_podium: true })
        .eq('id', pollId)

      if (error) throw error
      toast.success('Featured poll updated')
      loadPolls()
    } catch (error) {
      console.error('Error setting featured poll:', error)
      toast.error('Failed to update featured poll')
    } finally {
      setFeaturingId(null)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this poll?')) return

    const poll = polls.find((p) => p.id === id)
    const { error } = await supabase.from('polls').delete().eq('id', id)

    if (error) {
      console.error('Error deleting poll:', error)
      toast.error('Failed to delete poll')
      return
    }

    if (poll?.is_featured_podium && poll.admin_id) {
      const nextFeatured = polls
        .filter((p) => p.id !== id && p.admin_id != null)
        .sort(
          (a, b) =>
            new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()
        )[0]

      if (nextFeatured) {
        await setFeaturedPoll(nextFeatured.id)
      }
    }

    loadPolls()
  }

  if (loading) {
    return (
      <div className="admin-table-card flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-4">
        <p className="text-sm text-slate-600">
          Only one poll can be featured at a time. New admin polls are featured automatically.
        </p>
        <button onClick={() => setIsCreating(true)} className="admin-button-primary shrink-0">
          <Plus className="h-4 w-4" />
          <span>Create Admin Poll</span>
        </button>
      </div>

      <section className="mb-8 space-y-3">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-lg font-semibold text-slate-900">Admin polls</h3>
          <span className="text-sm text-slate-500">{adminPolls.length} total</span>
        </div>
        <div className="admin-table-card">
          <PollTable
            polls={adminPolls}
            showFeatured
            onEdit={setEditingPoll}
            onDelete={handleDelete}
            onSetFeatured={setFeaturedPoll}
            emptyMessage="No admin polls yet. Create one to feature it on the Feed banner."
          />
        </div>
        {featuringId && (
          <p className="text-xs text-slate-500">Updating featured poll…</p>
        )}
      </section>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-lg font-semibold text-slate-900">Community polls</h3>
          <span className="text-sm text-slate-500">{communityPolls.length} total</span>
        </div>
        <div className="admin-table-card">
          <PollTable
            polls={communityPolls}
            onDelete={handleDelete}
            emptyMessage="No community polls yet."
          />
        </div>
      </section>

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
