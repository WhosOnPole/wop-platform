import type { SupabaseClient } from '@supabase/supabase-js'
import type { StoryProfileRow } from '@/utils/story-byline-profile'

type MinimalNewsRow = {
  title?: string | null
  admin_id?: string | null
  submitter_id?: string | null
}

type SubmissionRow = {
  user_id?: string
  title?: string | null
  author?: StoryProfileRow | StoryProfileRow[] | null
}

function pickSubmissionForTitle(rows: SubmissionRow[] | null, normalizedTitle: string, adminId: string | null) {
  if (!rows?.length) return null
  const sameTitle = rows.filter(
    (r) => typeof r.title === 'string' && r.title.trim().toLowerCase() === normalizedTitle
  )
  if (!sameTitle.length) return null
  const pick =
    (adminId ? sameTitle.find((r) => r.user_id && r.user_id !== adminId) : null) ?? sameTitle[0]
  const rel = pick.author
  const profile = Array.isArray(rel) ? rel[0] : rel
  return profile?.username ? profile : null
}

/**
 * For a news_stories row, resolve the community member to credit as "Story by".
 * 1) profiles row for submitter_id when set (no relationship embed required)
 * 2) Else match an approved user_story_submissions row by title (legacy / missing submitter_id)
 */
export async function resolveNewsStorySubmitterProfile(
  supabase: SupabaseClient,
  news: MinimalNewsRow
): Promise<StoryProfileRow | null> {
  const sid = news.submitter_id
  if (typeof sid === 'string' && sid.length > 0) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, username, profile_image_url')
      .eq('id', sid)
      .maybeSingle()
    if (profile?.username) return profile as StoryProfileRow
  }

  const rawTitle = typeof news.title === 'string' ? news.title.trim() : ''
  if (!rawTitle) return null

  const adminId = news.admin_id ?? null
  const normalizedTitle = rawTitle.toLowerCase()

  const exactSelect = `
      id,
      title,
      user_id,
      updated_at,
      author:profiles!user_id (
        id,
        username,
        profile_image_url
      )
    `

  const { data: exactRows } = await supabase
    .from('user_story_submissions')
    .select(exactSelect)
    .eq('status', 'approved')
    .eq('title', rawTitle)
    .order('updated_at', { ascending: false })
    .limit(8)

  const fromExact = pickSubmissionForTitle(exactRows as SubmissionRow[] | null, normalizedTitle, adminId)
  if (fromExact) return fromExact

  const { data: recentRows } = await supabase
    .from('user_story_submissions')
    .select(exactSelect)
    .eq('status', 'approved')
    .order('updated_at', { ascending: false })
    .limit(250)

  return pickSubmissionForTitle(recentRows as SubmissionRow[] | null, normalizedTitle, adminId)
}
