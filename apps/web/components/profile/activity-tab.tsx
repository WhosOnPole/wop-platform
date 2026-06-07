import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BarChart3, Grid3x3, MessageSquare } from 'lucide-react'
import { formatTimeAgo } from '@/utils/date-utils'
import { LikeButton } from '@/components/discussion/like-button'
import { FeedPostCommentSection } from '@/components/feed/feed-post-comment-section'
import { PollCard } from '@/components/polls/poll-card'

interface ActivityItem {
  id: string
  type: 'post' | 'comment' | 'reply' | 'checkin' | 'like' | 'grid_update'
  content?: string
  image_url?: string | null
  created_at: string
  target_id?: string
  target_type?: string
  target_name?: string
  post_id?: string
  comment_id?: string
  parent_comment_id?: string
  reply_to_username?: string
  reply_to_content?: string
  grid_id?: string
  rank_index?: number
  grid_snapshot?: {
    id: string
    type: 'driver' | 'team' | 'track'
    ranked_items: Array<{ id: string; name: string }>
  } | null
  like_count?: number
  comment_count?: number
  is_liked?: boolean
}

interface ActivityTabProps {
  activities: ActivityItem[]
  profileUsername: string
  pollsById?: Record<
    string,
    { id: string; question: string; options?: unknown[]; is_featured_podium?: boolean; created_at: string }
  >
  pollUserResponses?: Record<string, string>
  pollVoteCounts?: Record<string, Record<string, number>>
}

function toEntitySlug(name: string) {
  return name.toLowerCase().trim().replace(/\s+/g, '-')
}

function withParams(path: string, params: URLSearchParams) {
  const qs = params.toString()
  return qs ? `${path}?${qs}` : path
}

function truncateText(text: string, maxLength = 90) {
  const normalized = text.trim()
  if (normalized.length <= maxLength) return normalized
  return `${normalized.slice(0, maxLength)}…`
}

function getActivityLink(item: ActivityItem, profileUsername: string): string | null {
  const params = new URLSearchParams()
  if (item.post_id) params.set('post', item.post_id)
  if (item.comment_id) params.set('comment', item.comment_id)

  if (item.type === 'grid_update' && item.grid_id) {
    return `/grid/${item.grid_id}`
  }

  if (item.target_type === 'poll' && item.target_id) {
    params.set('poll', item.target_id)
    params.set('open', 'poll-discussion')
    return `/podiums?${params.toString()}`
  }

  if (item.target_type === 'hot_take' && item.target_id) {
    params.set('hot_take', item.target_id)
    params.set('open', 'hot-take-discussion')
    return `/feed?${params.toString()}`
  }

  if (!item.target_type || !item.target_name) {
    return item.post_id ? `/u/${profileUsername}?tab=activity&${params.toString()}` : null
  }

  if (item.target_type === 'profile') {
    const username = item.target_name.replace(/^@/, '')
    if (!username) return null
    params.set('tab', 'activity')
    return withParams(`/u/${username}`, params)
  }

  const slug = toEntitySlug(item.target_name)
  if (!slug) return null
  if (item.target_type === 'driver') return withParams(`/drivers/${slug}`, params)
  if (item.target_type === 'team') return withParams(`/teams/${slug}`, params)
  if (item.target_type === 'track') return withParams(`/tracks/${slug}`, params)
  return null
}

export function ActivityTab({
  activities,
  profileUsername,
  pollsById = {},
  pollUserResponses = {},
  pollVoteCounts = {},
}: ActivityTabProps) {
  const router = useRouter()
  const filteredActivities = activities.filter((item) => item.type !== 'like')

  if (filteredActivities.length === 0) {
    return (
      <div className="py-12 text-center rounded-lg border border-white/10 bg-black/40 shadow backdrop-blur-sm">
        <p className="text-white/60">No activity yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {filteredActivities.map((item) => {
        const link = getActivityLink(item, profileUsername)
        const gridTypeLabel =
          item.target_type === 'driver'
            ? 'Drivers'
            : item.target_type === 'team'
              ? 'Teams'
              : item.target_type === 'track'
                ? 'Tracks'
                : 'Grid'

        const rootClasses = `rounded-lg border border-white/20 bg-white/10 p-6 shadow backdrop-blur-sm ${
          link ? 'block cursor-pointer transition-colors hover:bg-black/50' : 'block'
        }`

        const anchorIds: string[] = []
        if (item.post_id) anchorIds.push(`post-${item.post_id}`)
        if (item.comment_id) anchorIds.push(`comment-${item.comment_id}`)
        if (item.type === 'grid_update') anchorIds.push(`grid-update-${item.id}`)
        const isReplyActivity =
          item.type === 'reply' ||
          !!item.parent_comment_id ||
          !!item.reply_to_username ||
          !!item.reply_to_content
        const isCommentActivity = item.type === 'comment' || isReplyActivity
        const contextLabel =
          item.type === 'grid_update'
            ? 'Grid Update'
            : isCommentActivity
              ? item.target_type === 'poll'
                ? 'Poll Comment'
                : item.target_type === 'hot_take'
                  ? 'Hot Take Comment'
                  : 'Post Comment'
              : item.target_type === 'poll'
                ? 'Poll'
                : item.type === 'checkin'
                  ? 'Story'
                  : 'Post'
        const subjectLine = isReplyActivity
          ? item.reply_to_content
            ? `Reply to "${truncateText(item.reply_to_content)}"`
            : item.reply_to_username
              ? `Reply to @${item.reply_to_username}`
              : item.target_name ?? null
          : item.target_name
            ? `${item.target_type === 'profile' ? '@' : ''}${item.target_name}`
            : null

        const content = (
          <>
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="min-w-0 truncate text-xs font-medium text-white/70">
                {contextLabel}
              </p>
              <div className="flex items-center gap-2">
                <p className="text-xs text-white/70">{formatTimeAgo(item.created_at)}</p>
                {item.type === 'grid_update' ? (
                  <Grid3x3 className="h-4 w-4 text-white/80" />
                ) : item.type === 'post' && item.target_type === 'poll' ? (
                  <BarChart3 className="h-4 w-4 text-[#25B4B1]" />
                ) : (
                  <MessageSquare className="h-4 w-4 text-[#25B4B1]" />
                )}
              </div>
            </div>

            {item.type === 'grid_update' ? (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-white/70">Updated Top {gridTypeLabel} grid</p>
                  {!!item.content && (
                    <p className="mt-2 text-white/90">
                      Position #{item.rank_index ?? 0}: &quot;{item.content}&quot;
                    </p>
                  )}
                </div>
                {item.grid_snapshot && item.grid_snapshot.ranked_items.length > 0 && (
                  <div className="rounded-md border border-white/10 bg-black/30 p-4">
                    <p className="mb-2 text-xs uppercase tracking-wide text-white/60">Grid Snapshot</p>
                    <ol className="space-y-1 text-sm text-white/85">
                      {item.grid_snapshot.ranked_items.slice(0, 5).map((gridItem, idx) => (
                        <li key={`${item.id}-${gridItem.id}`} className="truncate">
                          {idx + 1}. {gridItem.name}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {subjectLine && <p className="text-xs text-[#25B4B1]">{subjectLine}</p>}
                {item.content &&
                  (item.target_type !== 'poll' ||
                    !item.target_id ||
                    !pollsById[item.target_id] ||
                    String(item.content).trim() !== String(pollsById[item.target_id].question ?? '').trim()) && (
                    <p className="text-white/90">{item.content}</p>
                  )}
                {item.type === 'post' &&
                  item.target_type === 'poll' &&
                  item.target_id &&
                  pollsById[item.target_id] && (
                    <div className="mt-4 rounded-md  [&_h2]:text-sm">
                      <p className="text-xs font-medium uppercase tracking-wide text-white/60">
                        {pollsById[item.target_id].is_featured_podium ? 'Admin Poll' : 'User Poll'}
                      </p>
                      <div className="mt-2">
                        <PollCard
                          poll={{
                            ...pollsById[item.target_id],
                            options: Array.isArray(pollsById[item.target_id].options)
                              ? (pollsById[item.target_id].options as any[])
                              : ([] as any[]),
                            is_featured_podium: !!pollsById[item.target_id].is_featured_podium,
                          }}
                          userResponse={pollUserResponses[item.target_id]}
                          voteCounts={pollVoteCounts[item.target_id] ?? {}}
                          onVote={() => router.refresh()}
                          variant="dark"
                          className="min-h-0 border-0 bg-transparent p-0"
                          compact
                          showRepost={false}
                        />
                      </div>
                    </div>
                  )}
                {item.type === 'post' && item.image_url && (
                  <div className="mt-3 overflow-hidden rounded-lg">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.image_url}
                      alt=""
                      className="max-h-96 w-full object-contain"
                    />
                  </div>
                )}
                {item.type === 'post' && item.post_id && (
                  <>
                    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-white/90 justify-end">
                      <LikeButton
                        targetId={item.post_id}
                        targetType="post"
                        initialLikeCount={item.like_count ?? 0}
                        initialIsLiked={item.is_liked ?? false}
                        variant="dark"
                      />
                      <FeedPostCommentSection
                        postId={item.post_id}
                        initialCommentCount={item.comment_count ?? 0}
                        panelTargetId={`comments-${item.post_id}`}
                      />
                    </div>
                    <div id={`comments-${item.post_id}`} className="mt-3" aria-live="polite" />
                  </>
                )}
              </div>
            )}
          </>
        )

        const extraAnchors = anchorIds.slice(1)

        if (!link || item.type === 'post') {
          return (
            <div key={item.id} className={rootClasses} id={anchorIds[0]}>
              {extraAnchors.map((anchorId) => (
                <div key={anchorId} id={anchorId} className="sr-only" />
              ))}
              {content}
            </div>
          )
        }

        return (
          <Link key={item.id} href={link} className={rootClasses} id={anchorIds[0]}>
            {extraAnchors.map((anchorId) => (
              <div key={anchorId} id={anchorId} className="sr-only" />
            ))}
            {content}
          </Link>
        )
      })}
    </div>
  )
}
