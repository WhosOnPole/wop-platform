import Link from 'next/link'
import { MessageSquare, MapPin, Grid3x3 } from 'lucide-react'

interface ActivityItem {
  id: string
  type: 'post' | 'comment' | 'checkin' | 'like' | 'grid_update'
  content?: string
  created_at: string
  target_id?: string
  target_type?: string
  target_name?: string
  /** Post ID for post/comment items; used to deep-link to discussion */
  post_id?: string
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
      default:
        return 'Activity'
    }
  }

  function getActivityLink(item: ActivityItem): string | null {
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
        return `${path}?post=${encodeURIComponent(item.post_id)}`
      }
      return path
    }
    return null
  }

  return (
    <div className="flex min-h-0 flex-col gap-4">
      <div className="flex-1 min-h-0 overflow-y-auto pr-1">
        {filteredActivities.length === 0 ? (
          <div className="py-12 text-center rounded-lg border border-white/10 bg-white/5">
            <p className="text-white/60">No activity yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredActivities.map((item) => {
              const link = getActivityLink(item)
              const className = `flex items-start gap-4 rounded-lg border border-white/10 bg-white/5 p-4 ${
                link ? 'hover:bg-white/10 transition-colors cursor-pointer active:bg-white/15' : ''
              }`

              const content = (
                <>
                  <div className="flex-shrink-0">{getActivityIcon(item)}</div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium text-white">{getActivityLabel(item)}</span>
                      {item.target_name && (
                        <span className="text-white/80">
                          {item.target_type === 'profile' ? '@' : ''}
                          {item.target_name}
                        </span>
                      )}
                    </div>

                    {item.content && (
                      <p className="mt-1 text-sm text-white/80 line-clamp-2">{item.content}</p>
                    )}

                    {item.type === 'grid_update' && item.target_type && (
                      <p className="mt-1 text-xs text-white/60">
                        Updated their {item.target_type} grid
                      </p>
                    )}

                    <p className="mt-2 text-xs text-white/50">
                      {new Date(item.created_at).toLocaleString()}
                    </p>
                  </div>
                </>
              )

              if (link) {
                return (
                  <Link key={item.id} href={link} className={className}>
                    {content}
                  </Link>
                )
              }

              return (
                <div key={item.id} className={className}>
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
