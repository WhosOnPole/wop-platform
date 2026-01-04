'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Plus, Edit, Trash2, Loader2 } from 'lucide-react'
import { ArticleModal } from './article-modal'

interface Article {
  id: string
  title: string
  slug: string
  content: string
  category: string
  header_image_url: string | null
  status: string
  created_at: string
}

export function ArticlesTab() {
  const supabase = createClientComponentClient()
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [editingArticle, setEditingArticle] = useState<Article | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    loadArticles()
  }, [])

  async function loadArticles() {
    setLoading(true)
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading articles:', error)
    } else {
      setArticles(data || [])
    }
    setLoading(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this article?')) return

    const { error } = await supabase.from('articles').delete().eq('id', id)

    if (error) {
      console.error('Error deleting article:', error)
      alert('Failed to delete article')
    } else {
      loadArticles()
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
          <span>Create Article</span>
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
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {articles.map((article) => (
                <tr key={article.id}>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{article.title}</div>
                    <div className="text-xs text-gray-500">{article.slug}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{article.category}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`rounded-full px-2 py-1 text-xs ${
                        article.status === 'published'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {article.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setEditingArticle(article)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(article.id)}
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

      {(isCreating || editingArticle) && (
        <ArticleModal
          article={editingArticle}
          onClose={() => {
            setIsCreating(false)
            setEditingArticle(null)
            loadArticles()
          }}
        />
      )}
    </>
  )
}

