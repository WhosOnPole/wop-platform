import Link from 'next/link'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { BookOpen } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function BeginnersGuidePage() {
  const supabase = createServerComponentClient({ cookies })

  // Fetch all published beginner's guide articles
  const { data: articles } = await supabase
    .from('articles')
    .select('*')
    .eq('category', 'BEGINNER_GUIDE')
    .eq('status', 'published')
    .order('created_at', { ascending: false })

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Beginner&apos;s Guide</h1>
        <p className="mt-2 text-gray-600">
          Everything you need to know to get started with Formula 1
        </p>
      </div>

      {articles && articles.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <Link
              key={article.id}
              href={`/article/${article.slug}`}
              className="group overflow-hidden rounded-lg border border-gray-200 bg-white shadow hover:shadow-lg transition-shadow"
            >
              {article.header_image_url && (
                <img
                  src={article.header_image_url}
                  alt={article.title}
                  className="h-48 w-full object-cover"
                />
              )}
              <div className="p-6">
                <div className="mb-2 flex items-center space-x-2">
                  <BookOpen className="h-4 w-4 text-blue-500" />
                  <span className="text-xs font-medium text-blue-600">Beginner&apos;s Guide</span>
                </div>
                <h3 className="mb-2 text-lg font-semibold text-gray-900 group-hover:text-blue-600">
                  {article.title}
                </h3>
                <p className="text-sm text-gray-500">
                  {new Date(article.created_at).toLocaleDateString()}
                </p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center shadow">
          <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-4 text-gray-500">No beginner&apos;s guide articles available yet.</p>
        </div>
      )}
    </div>
  )
}

