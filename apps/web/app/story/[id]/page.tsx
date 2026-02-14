import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import Image from 'next/image'

export const runtime = 'nodejs'
export const revalidate = 3600

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function StoryPage({ params }: PageProps) {
  const { id } = await params
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    notFound()
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  const [newsResult, userStoryResult] = await Promise.all([
    supabase.from('news_stories').select('*').eq('id', id).single(),
    supabase.from('user_story_submissions').select('*').eq('id', id).eq('status', 'approved').single(),
  ])

  const newsStory = newsResult.data
  const userStory = userStoryResult.data

  const story = newsStory ?? userStory
  if (!story) notFound()

  const content = 'summary' in story && story.summary
    ? `${story.summary}\n\n${story.content}`
    : story.content

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <article className="rounded-lg border border-white/10 bg-black/40 shadow-lg backdrop-blur-sm">
        {story.image_url && (
          <div className="relative h-64 w-full md:h-96">
            <Image
              src={story.image_url}
              alt={story.title}
              fill
              sizes="(max-width: 768px) 100vw, 896px"
              className="object-cover"
            />
          </div>
        )}
        <div className="p-6 md:p-8">
          <div className="mb-4 text-sm text-white/70">
            {new Date(story.created_at).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </div>
          <h1 className="mb-6 text-3xl font-bold text-white md:text-4xl">{story.title}</h1>
          <div className="prose prose-invert max-w-none">
            <p className="whitespace-pre-wrap text-white/90">{content}</p>
          </div>
        </div>
      </article>
    </div>
  )
}
