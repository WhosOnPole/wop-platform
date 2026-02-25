import { cache } from 'react'
import { cookies } from 'next/headers'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowLeft } from 'lucide-react'
import { getAvatarUrl } from '@/utils/avatar'

export const runtime = 'nodejs'
export const revalidate = 3600

interface PageProps {
  params: Promise<{ id: string }>
}

const getStory = cache(async (id: string) => {
  const cookieStore = await cookies()
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  if (!supabaseUrl || !supabaseKey) return null

  const supabase = createServerComponentClient(
    { cookies: () => cookieStore as any },
    { supabaseUrl, supabaseKey }
  )

  const [newsResult, userStoryResult] = await Promise.all([
    supabase.from('news_stories').select('*').eq('id', id).maybeSingle(),
    supabase
      .from('user_story_submissions')
      .select(
        `
        *,
        author:profiles!user_id (
          id,
          username,
          profile_image_url
        )
      `
      )
      .eq('id', id)
      .eq('status', 'approved')
      .maybeSingle(),
  ])

  return newsResult.data ?? userStoryResult.data ?? null
})

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const story = await getStory(id)
  if (!story) return { title: 'Story not found' }
  const title = story.title ?? 'Story'
  const rawDesc =
    ('summary' in story && typeof story.summary === 'string' && story.summary) ||
    (typeof story.content === 'string' && story.content) ||
    ''
  const description = rawDesc.length > 160 ? `${rawDesc.slice(0, 157)}...` : rawDesc || undefined
  return {
    title: `${title} | Who's on Pole?`,
    description,
    openGraph: { title, description },
  }
}

export default async function StoryPage({ params }: PageProps) {
  const { id } = await params
  const story = await getStory(id)
  if (!story) notFound()

  const content = 'summary' in story && story.summary
    ? `${story.summary}\n\n${story.content}`
    : story.content

  type AuthorRow = { id: string; username: string; profile_image_url: string | null }
  const rawAuthor =
    'author' in story && story.author != null
      ? Array.isArray(story.author)
        ? (story.author as AuthorRow[])[0]
        : (story.author as AuthorRow)
      : null

  const isUserStory =
    'user_id' in story &&
    'is_anonymous' in story &&
    !story.is_anonymous &&
    rawAuthor &&
    typeof rawAuthor.username === 'string'

  const author = isUserStory ? rawAuthor : null

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/podiums?tab=stories"
        className="mb-6 inline-flex items-center gap-2 text-sm text-white/80 transition-colors hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Spotlight · Stories
      </Link>
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
            {author && (
              <div className="mt-6 flex items-center justify-end gap-2">
                <span className="text-white/70">—</span>
                <Link
                  href={`/u/${author.username}`}
                  className="flex items-center gap-2 text-white/90 transition-colors hover:text-white"
                >
                  <span className="font-medium">{author.username}</span>
                  <span className="relative block h-8 w-8 shrink-0 overflow-hidden rounded-full bg-white/10">
                    <Image
                      src={getAvatarUrl(author.profile_image_url)}
                      alt={author.username}
                      fill
                      sizes="32px"
                      className="object-cover"
                    />
                  </span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </article>
    </div>
  )
}
