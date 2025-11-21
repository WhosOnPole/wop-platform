import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import { Calendar, BookOpen } from 'lucide-react'

interface PageProps {
  params: {
    slug: string
  }
}

export default async function ArticlePage({ params }: PageProps) {
  const { slug } = params
  const supabase = createServerComponentClient({ cookies })

  const { data: article } = await supabase
    .from('articles')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (!article) {
    notFound()
  }

  const categoryLabels: Record<string, string> = {
    FEATURE_FAN: "Fan Feature",
    FEATURE_WOMEN: "Women in F1",
    FEATURE_INTERVIEW: "Interview",
    BEGINNER_GUIDE: "Beginner's Guide",
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <article className="rounded-lg border border-gray-200 bg-white shadow-lg">
        {article.header_image_url && (
          <div className="relative h-64 w-full md:h-96">
            <img
              src={article.header_image_url}
              alt={article.title}
              className="h-full w-full object-cover"
            />
          </div>
        )}

        <div className="p-8">
          <div className="mb-4 flex items-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <BookOpen className="h-4 w-4" />
              <span>{categoryLabels[article.category] || article.category}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Calendar className="h-4 w-4" />
              <span>{new Date(article.created_at).toLocaleDateString()}</span>
            </div>
          </div>

          <h1 className="mb-6 text-4xl font-bold text-gray-900">{article.title}</h1>

          <div className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-blue-600 prose-strong:text-gray-900 prose-code:text-gray-800 prose-pre:bg-gray-100">
            <ReactMarkdown>{article.content}</ReactMarkdown>
          </div>
        </div>
      </article>
    </div>
  )
}

