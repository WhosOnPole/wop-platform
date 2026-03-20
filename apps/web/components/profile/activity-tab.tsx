import Link from 'next/link'
import { MessageSquare, MapPin, Grid3x3 } from 'lucide-react'
import { getViewGridLabel } from '@/utils/grid-labels'
import { formatTimeAgo } from '@/utils/date-utils'

interface ActivityItem {
  id: string
  type: 'post' | 'comment' | 'checkin' | 'like' | 'grid_update' | 'grid_comment'
  content?: string
  created_at: string
  target_id?: string
  target_type?: string
  target_name?: string
  /** Post ID for post/comment items; used to deep-link to discussion */
  post_id?: string
  /** Grid comment: grid id and slot position */
  grid_id?: string
  rank_index?: number
  user?: {
    id: string
    username: string
    profile_image_url: string | null
  } | null
}

interface ActivityTabProps {
  activities: ActivityItem[]
  profileUsername: string
}

export function ActivityTab({
  activities,
  profileUsername,
}: ActivityTabProps) {
  const filteredActivities = activities.filter((item) => item.type !== 'like')

  function getActivityIcon(item: ActivityItem) {
    switch (item.type) {
      case 'post':
      case 'comment':
        return <MessageSquare className="h-4 w-4 text-[#25B4B1]" />
      case 'checkin':
        return <MapPin className="h-4 w-4 text-emerald-400" />
      case 'grid_update':
      case 'grid_comment':
        return <Grid3x3 className="h-4 w-4 text-white/80" />
      default:
        return null
    }
  }

  function getActivityLabel(item: ActivityItem) {
    switch (item.type) {
      case 'post':
        return 'Posted'
      case 'comment':
        return 'Commented'
      case 'checkin':
        return 'Checked in at'
      case 'grid_update':
        return 'Updated grid'
      case 'grid_comment':
        return 'Grid comment'
      default:
        return 'Activity'
    }
  }

  function getActivityLink(item: ActivityItem): string | null {
    if (item.type === 'grid_comment' && item.grid_id) {
      return `/grid/${item.grid_id}`
    }
    if (item.type === 'grid_update') {
      const tab =
        item.target_type === 'driver'
          ? 'drivers'
          : item.target_type === 'team'
            ? 'teams'
            : item.target_type === 'track'
              ? 'tracks'
              : 'drivers'
      return `/u/${profileUsername}?tab=${tab}`
    }
    if (item.target_id && item.target_type) {
      if (item.target_type === 'poll' || item.target_type === 'hot_take') {
        if ((item.type === 'post' || item.type === 'comment') && item.post_id) {
          return `/feed?post=${encodeURIComponent(item.post_id)}`
        }
        return '/feed'
      }
      const slug =
        item.target_type === 'profile'
          ? (item.target_name ?? '').replace(/^@/, '')
          : (item.target_name ?? '').toLowerCase().trim().replace(/\s+/g, '-')
      if (!slug) return null
      let path: string | null = null
      if (item.target_type === 'driver') path = `/drivers/${slug}`
      else if (item.target_type === 'team') path = `/teams/${slug}`
      else if (item.target_type === 'track') path = `/tracks/${slug}`
      else if (item.target_type === 'profile') path = `/u/${slug}`
      if (path && (item.type === 'post' || item.type === 'comment') && item.post_id) {
        const sep = path.includes('?') ? '&' : '?'
        const tabPart = item.target_type === 'profile' ? 'tab=activity&' : ''
        return `${path}${sep}${tabPart}post=${encodeURIComponent(item.post_id)}`
      }
      return path
    }
    return null
  }

  return (
    <div className="flex min-h-0 flex-col gap-4">
      <div className="flex-1 min-h-0 overflow-y-auto pr-1">
        {filteredActivities.length === 0 ? (
          <div className="py-12 text-center rounded-lg border border-white/10 bg-black/40 shadow backdrop-blur-sm">
            <p className="text-white/60">No activity yet</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredActivities.map((item) => {
              const link = getActivityLink(item)
              const cardClassName = `rounded-lg border border-white/10 bg-black/40 p-6 shadow backdrop-blur-sm ${
                link ? 'hover:bg-black/50 transition-colors cursor-pointer block' : 'block'
              }`

              const isGridComment = item.type === 'grid_comment'
              const gridTypeLabel =
                item.target_type === 'driver'
                  ? 'Drivers'
                  : item.target_type === 'team'
                    ? 'Teams'
                    : item.target_type === 'track'
                      ? 'Tracks'
                      : 'Grid'

              const headerSection = (
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs text-white/70">
                      {formatTimeAgo(item.created_at)}
                    </p>
                  </div>
                  <div className="flex-shrink-0">{getActivityIcon(item)}</div>
                </div>
              )

              const content = isGridComment ? (
                <>
                  {headerSection}
                  <div id={item.post_id ? `post-${item.post_id}` : undefined} className="flex flex-1 min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-white">
                        {gridTypeLabel} Grid Comments Updated!
                      </p>
                      <p className="mt-1 text-sm text-white/80">
                        Position #{item.rank_index ?? 0}: &quot;{item.content ?? ''}&quot;
                      </p>
                    </div>
                    {link && (
                      <span className="shrink-0 text-sm font-medium text-[#25B4B1] hover:text-[#25B4B1]/90">
                        {getViewGridLabel(item.target_type)} →
                      </span>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {headerSection}
                  <div id={item.post_id ? `post-${item.post_id}` : undefined} className="flex-1 min-w-0">
                    {(item.type === 'post' || item.type === 'comment') && item.target_name && (
                      <p className="mb-2 text-xs text-white/70">
                        {item.type === 'post' && item.target_type === 'poll'
                          ? 'Reposted poll: '
                          : item.type === 'comment'
                            ? `${getActivityLabel(item)} on `
                            : 'Discussion on '}
                        {link ? (
                          <Link
                            href={link}
                            className="text-[#25B4B1] hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {item.target_type === 'profile' ? '@' : ''}
                            {item.target_type === 'poll'
                              ? `"${item.target_name.length > 60 ? item.target_name.slice(0, 60) + '…' : item.target_name}"`
                              : item.target_type === 'hot_take'
                                ? `Hot take: "${item.target_name.length > 50 ? item.target_name.slice(0, 50) + '…' : item.target_name}"`
                                : item.target_name}
                          </Link>
                        ) : (
                          <span>
                            {item.target_type === 'profile' ? '@' : ''}
                            {item.target_type === 'poll'
                              ? `"${item.target_name.length > 60 ? item.target_name.slice(0, 60) + '…' : item.target_name}"`
                              : item.target_type === 'hot_take'
                                ? `Hot take: "${item.target_name.length > 50 ? item.target_name.slice(0, 50) + '…' : item.target_name}"`
                                : item.target_name}
                          </span>
                        )}
                      </p>
                    )}
                    {item.type === 'checkin' && item.target_name && (
                      <p className="mb-2 text-xs text-white/70">
                        {getActivityLabel(item)}{' '}
                        {link ? (
                          <Link
                            href={link}
                            className="text-[#25B4B1] hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {item.target_name}
                          </Link>
                        ) : (
                          item.target_name
                        )}
                      </p>
                    )}

                    {item.content && (
                      <p className="text-white/90">{item.content}</p>
                    )}

                    {item.type === 'grid_update' && item.target_type && (
                      <p className="mt-1 text-xs text-white/60">
                        Updated their {item.target_type} grid
                      </p>
                    )}
                  </div>
                </>
              )

              if (link) {
                return (
                  <Link key={item.id} href={link} className={cardClassName}>
                    {content}
                  </Link>
                )
              }

              return (
                <div key={item.id} className={cardClassName}>
                  {content}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
