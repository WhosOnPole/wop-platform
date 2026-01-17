'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Plus, Edit, Trash2, Loader2 } from 'lucide-react'
import { PollModal } from './poll-modal'

interface Poll {
  id: string
  question: string
  options: string[]
  is_featured_podium: boolean
  created_at: string
  ends_at?: string | null
}

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
      alert('Failed to delete poll')
    } else {
      loadPolls()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <>
      <div className="mb-4 flex justify-end">
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center space-x-2 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          <span>Create Poll</span>
        </button>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white shadow">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Question
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Options
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Active Until
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Featured
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {polls.map((poll) => (
                <tr key={poll.id}>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{poll.question}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500">
                      {Array.isArray(poll.options) ? poll.options.length : 0} options
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {poll.ends_at ? new Date(poll.ends_at).toLocaleString() : 'No end date'}
                  </td>
                  <td className="px-6 py-4">
                    {poll.is_featured_podium && (
                      <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs text-yellow-800">
                        Featured
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setEditingPoll(poll)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(poll.id)}
                        className="text-red-600 hover:text-red-900"
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

