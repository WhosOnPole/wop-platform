'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Plus, Edit, Trash2, Loader2 } from 'lucide-react'
import { ArticleModal } from './article-modal'
import { Article } from './content.types'

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
      toast.error('Failed to delete article')
    } else {
      loadArticles()
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
          <span>Create Article</span>
        </button>
      </div>

      <div className="admin-table-card">
        <div className="overflow-x-auto">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {articles.map((article) => (
                <tr key={article.id}>
                  <td>
                    <div className="text-sm font-bold text-slate-900">{article.title}</div>
                    <div className="text-xs text-slate-500">{article.slug}</div>
                  </td>
                  <td>{article.category}</td>
                  <td>
                    <span
                      className={
                        article.status === 'published'
                          ? 'admin-status-active'
                          : 'admin-status-pending'
                      }
                    >
                      {article.status}
                    </span>
                  </td>
                  <td>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setEditingArticle(article)}
                        className="rounded-lg p-1.5 text-teal-600 transition hover:bg-teal-50"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(article.id)}
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

