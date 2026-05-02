'use client'

import { toast } from 'sonner'
import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Plus, Edit, Trash2, Loader2 } from 'lucide-react'
import { HotTakeModal } from './hot-take-modal'
import { HotTake } from './content.types'

export function HotTakesTab() {
  const supabase = createClientComponentClient()
  const [hotTakes, setHotTakes] = useState<HotTake[]>([])
  const [loading, setLoading] = useState(true)
  const [editingHotTake, setEditingHotTake] = useState<HotTake | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    loadHotTakes()
  }, [])

  async function loadHotTakes() {
    setLoading(true)
    const { data, error } = await supabase
      .from('hot_takes')
      .select('*')
      .order('active_date', { ascending: false })

    if (error) {
      console.error('Error loading hot takes:', error)
    } else {
      setHotTakes(data || [])
    }
    setLoading(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this hot take?')) return

    const { error } = await supabase.from('hot_takes').delete().eq('id', id)

    if (error) {
      console.error('Error deleting hot take:', error)
      toast.error('Failed to delete hot take')
    } else {
      loadHotTakes()
    }
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
      <div className="mb-4 flex justify-end">
        <button
          onClick={() => setIsCreating(true)}
          className="admin-button-primary"
        >
          <Plus className="h-4 w-4" />
          <span>Create Hot Take</span>
        </button>
      </div>

      <div className="admin-table-card">
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Content</th>
                <th>Active Window</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {hotTakes.map((hotTake) => (
                <tr key={hotTake.id}>
                  <td>
                    <div className="max-w-md truncate text-md text-slate-900">
                      {hotTake.content_text}
                    </div>
                  </td>
                  <td>
                    <div className="space-y-1">
                      <div>
                        <span className="font-medium">Start: </span>
                        {hotTake.starts_at ? new Date(hotTake.starts_at).toLocaleString() : '—'}
                      </div>
                      <div>
                        <span className="font-medium">End: </span>
                        {hotTake.ends_at ? new Date(hotTake.ends_at).toLocaleString() : '—'}
                      </div>
                      {hotTake.active_date && (
                        <div className="text-xs text-slate-500">
                          Legacy active_date: {new Date(hotTake.active_date).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setEditingHotTake(hotTake)}
                        className="rounded-lg p-1.5 text-teal-600 transition hover:bg-teal-50"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(hotTake.id)}
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

      {(isCreating || editingHotTake) && (
        <HotTakeModal
          hotTake={editingHotTake}
          onClose={() => {
            setIsCreating(false)
            setEditingHotTake(null)
            loadHotTakes()
          }}
        />
      )}
    </>
  )
}

