import { cache } from 'react'
import { cookies } from 'next/headers'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowLeft, PenLine } from 'lucide-react'
import { getAvatarUrl } from '@/utils/avatar'
import { DiscussionSection } from '@/components/dtt/discussion-section'

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
    supabase
      .from('news_stories')
      .select(
        `
        *,
        author:profiles!admin_id (
          id,
          username,
          profile_image_url
        )
      `
      )
      .eq('id', id)
      .maybeSingle(),
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

  const cookieStore = await cookies()
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  let storyPosts: Array<{
    id: string
    content: string
    created_at: string
    like_count: number
    user: { id: string; username: string; profile_image_url: string | null } | null
  }> = []

  if (supabaseUrl && supabaseKey) {
    const supabase = createServerComponentClient(
      { cookies: () => cookieStore as any },
      { supabaseUrl, supabaseKey }
    )
    const { data: posts } = await supabase
      .from('posts')
      .select(
        `
        *,
        like_count,
        user:profiles!user_id (
          id,
          username,
          profile_image_url
        )
      `
      )
      .eq('parent_page_type', 'story')
      .eq('parent_page_id', story.id)
      .order('created_at', { ascending: false })

    storyPosts = (posts || []).map((p: Record<string, unknown>) => ({
      id: p.id as string,
      content: p.content as string,
      created_at: p.created_at as string,
      like_count: (p.like_count as number) ?? 0,
      user: p.user as { id: string; username: string; profile_image_url: string | null } | null,
    }))
  }

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

  const author =
    rawAuthor &&
    typeof rawAuthor.username === 'string' &&
    !(story as { is_anonymous?: boolean }).is_anonymous
      ? rawAuthor
      : null

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
          </div>
        </div>
      </article>

      {author && (
        <Link
          href={`/u/${author.username}`}
          className="mt-8 flex items-center gap-6 rounded-xl border border-white/20 bg-white/5 p-6 transition-colors hover:bg-white/10"
        >
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border-2 border-white/20 bg-white/10">
            <Image
              src={getAvatarUrl(author.profile_image_url)}
              alt={author.username}
              fill
              sizes="80px"
              className="object-cover"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-[0.6em] uppercase tracking-widest text-white/60 align-super">
              Story By:
            </span>
            <span className="font-display text-2xl font-semibold text-white">@{author.username}</span>
          </div>
        </Link>
      )}

      <div className="mt-8 rounded-xl border border-white/20 bg-white/5 p-6">
        <DiscussionSection
          posts={storyPosts}
          parentPageType="story"
          parentPageId={story.id}
          variant="dark"
          compact={false}
        />
      </div>

      <div className="mt-8 rounded-xl border border-white/20 bg-white/5 p-6 text-center">
        <p className="mb-4 text-white/90">Have a story? Submit it for our team to consider.</p>
        <Link
          href="/submit-story"
          className="inline-flex items-center gap-2 rounded-lg bg-[#25B4B1] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#25B4B1]/90"
        >
          <PenLine className="h-4 w-4" />
          Submit a story
        </Link>
      </div>
    </div>
  )
}
