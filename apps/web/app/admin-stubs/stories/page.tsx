'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@/utils/supabase-client'
import { Star, Loader2 } from 'lucide-react'

interface NewsStory {
  id: string
  title: string
  image_url: string | null
  content: string
  is_featured: boolean
  created_at: string
}

export default function AdminStoriesStubPage() {
  const supabase = createClientComponentClient()
  const [stories, setStories] = useState<NewsStory[]>([])
  const [loading, setLoading] = useState(true)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  useEffect(() => {
    loadStories()
  }, [])

  async function loadStories() {
    setLoading(true)
    const { data, error } = await supabase
      .from('news_stories')
      .select('id, title, image_url, content, is_featured, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading stories:', error)
    } else {
      setStories(data ?? [])
    }
    setLoading(false)
  }

  async function handleToggleFeatured(story: NewsStory) {
    const nextFeatured = !story.is_featured
    setTogglingId(story.id)

    if (nextFeatured) {
      await supabase
        .from('news_stories')
        .update({ is_featured: false })
        .neq('id', story.id)
    }

    const { error } = await supabase
      .from('news_stories')
      .update({ is_featured: nextFeatured })
      .eq('id', story.id)

    setTogglingId(null)
    if (error) {
      console.error('Error updating featured:', error)
    } else {
      loadStories()
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4 px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-gray-900">Admin: User Stories (Stub)</h1>
      <p className="text-gray-600">
        Stories submitted via the Create menu can be managed here. Use Feature to show a story in
        the feed banner; only one story is featured at a time.
      </p>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : (
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
                {stories.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-500">
                      No stories yet.
                    </td>
                  </tr>
                ) : (
                  stories.map((story) => (
                    <tr key={story.id}>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{story.title}</div>
                      </td>
                      <td className="px-6 py-4">
                        {story.is_featured ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-xs text-amber-800">
                            <Star className="h-3 w-3 fill-current" />
                            Featured
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(story.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        <button
                          type="button"
                          onClick={() => handleToggleFeatured(story)}
                          disabled={togglingId !== null}
                          className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                        >
                          {togglingId === story.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Star
                              className={`h-3.5 w-3.5 ${story.is_featured ? 'fill-amber-500 text-amber-500' : ''}`}
                            />
                          )}
                          {story.is_featured ? 'Unfeature' : 'Feature'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
