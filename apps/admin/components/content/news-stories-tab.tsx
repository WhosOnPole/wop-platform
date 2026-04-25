'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
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
      toast.error('Failed to delete news story')
    } else {
      loadStories()
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
          <span>Create New Story</span>
        </button>
      </div>

      <div className="admin-table-card">
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Featured</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {stories.map((story) => (
                <tr key={story.id}>
                  <td>
                    <div className="text-md text-slate-900">{story.title}</div>
                  </td>
                  <td>
                    {story.is_featured && (
                      <span className="admin-status-review">
                        Featured
                      </span>
                    )}
                  </td>
                  <td>
                    {new Date(story.created_at).toLocaleDateString()}
                  </td>
                  <td>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setEditingStory(story)}
                        className="rounded-lg p-1.5 text-teal-600 transition hover:bg-teal-50"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(story.id)}
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

