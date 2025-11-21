import Link from 'next/link'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { FileText } from 'lucide-react'

export default async function FeaturesPage() {
  const supabase = createServerComponentClient({ cookies })

  // Fetch all published feature articles
  const { data: articles } = await supabase
    .from('articles')
    .select('*')
    .in('category', ['FEATURE_FAN', 'FEATURE_WOMEN', 'FEATURE_INTERVIEW'])
    .eq('status', 'published')
    .order('created_at', { ascending: false })

  const fanFeatures = articles?.filter((a) => a.category === 'FEATURE_FAN') || []
  const womenInF1 = articles?.filter((a) => a.category === 'FEATURE_WOMEN') || []
  const interviews = articles?.filter((a) => a.category === 'FEATURE_INTERVIEW') || []

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Features</h1>
        <p className="mt-2 text-gray-600">
          Stories, interviews, and highlights from the F1 community
        </p>
      </div>

      <div className="space-y-12">
        {/* Fan Features */}
        <section>
          <div className="mb-6 flex items-center space-x-2">
            <FileText className="h-5 w-5 text-blue-500" />
            <h2 className="text-2xl font-semibold text-gray-900">Fan Features</h2>
          </div>
          {fanFeatures.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {fanFeatures.map((article) => (
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
            <p className="text-gray-500">No fan features available yet.</p>
          )}
        </section>

        {/* Women in F1 */}
        <section>
          <div className="mb-6 flex items-center space-x-2">
            <FileText className="h-5 w-5 text-pink-500" />
            <h2 className="text-2xl font-semibold text-gray-900">Women in F1</h2>
          </div>
          {womenInF1.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {womenInF1.map((article) => (
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
            <p className="text-gray-500">No articles available yet.</p>
          )}
        </section>

        {/* Interviews */}
        <section>
          <div className="mb-6 flex items-center space-x-2">
            <FileText className="h-5 w-5 text-green-500" />
            <h2 className="text-2xl font-semibold text-gray-900">Interviews</h2>
          </div>
          {interviews.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {interviews.map((article) => (
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
            <p className="text-gray-500">No interviews available yet.</p>
          )}
        </section>
      </div>
    </div>
  )
}

