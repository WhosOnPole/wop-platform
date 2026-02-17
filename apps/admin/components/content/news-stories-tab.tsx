'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Plus, Edit, Trash2, Loader2 } from 'lucide-react'
import { NewsStoryModal } from './news-story-modal'
import { NewsStory } from './content.types'

export function NewsStoriesTab() {
  const supabase = createClientComponentClient()
  const [stories, setStories] = useState<NewsStory[]>([])
  const [loading, setLoading] = useState(true)
  const [editingStory, setEditingStory] = useState<NewsStory | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    loadStories()
  }, [])

  async function loadStories() {
    setLoading(true)
    const { data, error } = await supabase
      .from('news_stories')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading news stories:', error)
    } else {
      setStories(data || [])
    }
    setLoading(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this news story?')) return

    const { error } = await supabase.from('news_stories').delete().eq('id', id)

    if (error) {
      console.error('Error deleting news story:', error)
      alert('Failed to delete news story')
    } else {
      loadStories()
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
          <span>Create News Story</span>
        </button>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white shadow">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Featured
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {stories.map((story) => (
                <tr key={story.id}>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{story.title}</div>
                  </td>
                  <td className="px-6 py-4">
                    {story.is_featured && (
                      <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs text-yellow-800">
                        Featured
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(story.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setEditingStory(story)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(story.id)}
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

      {(isCreating || editingStory) && (
        <NewsStoryModal
          story={editingStory}
          onClose={() => {
            setIsCreating(false)
            setEditingStory(null)
            loadStories()
          }}
        />
      )}
    </>
  )
}

