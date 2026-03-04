'use client'

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
      alert('Failed to delete hot take')
    } else {
      loadHotTakes()
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
          <span>Create Hot Take</span>
        </button>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white shadow">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Content
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Active Window
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {hotTakes.map((hotTake) => (
                <tr key={hotTake.id}>
                  <td className="px-6 py-4">
                    <div className="max-w-md truncate text-sm text-gray-900">
                      {hotTake.content_text}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
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
                        <div className="text-xs text-gray-500">
                          Legacy active_date: {new Date(hotTake.active_date).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setEditingHotTake(hotTake)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(hotTake.id)}
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

