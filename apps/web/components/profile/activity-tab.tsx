import Link from 'next/link'
import { MessageSquare, Heart, MapPin, Grid3x3 } from 'lucide-react'

interface ActivityItem {
  id: string
  type: 'post' | 'comment' | 'checkin' | 'like' | 'grid_update'
  content?: string
  created_at: string
  target_id?: string
  target_type?: string
  target_name?: string
  user?: {
    id: string
    username: string
    profile_image_url: string | null
  } | null
}

interface ActivityTabProps {
  activities: ActivityItem[]
  profileUsername: string
  followerCount?: number
  followingCount?: number
}

export function ActivityTab({
  activities,
  profileUsername,
  followerCount = 0,
  followingCount = 0,
}: ActivityTabProps) {
  function getActivityIcon(item: ActivityItem) {
    switch (item.type) {
      case 'post':
      case 'comment':
        return <MessageSquare className="h-4 w-4 text-blue-500" />
      case 'like':
        return <Heart className="h-4 w-4 text-red-500 fill-red-500" />
      case 'checkin':
        // TODO: Implement check-in system to track user check-ins on race starts (not race day start, the race's general start) on track pages when button is enabled
        return <MapPin className="h-4 w-4 text-green-500" />
      case 'grid_update':
        return <Grid3x3 className="h-4 w-4 text-purple-500" />
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
      case 'like':
        return 'Liked'
      case 'checkin':
        return 'Checked in at'
      case 'grid_update':
        return 'Updated grid'
      default:
        return 'Activity'
    }
  }

  function getActivityLink(item: ActivityItem): string | null {
    if (item.target_id && item.target_type) {
      const slug = item.target_name?.toLowerCase().replace(/\s+/g, '-') || ''
      if (item.target_type === 'driver') return `/drivers/${slug}`
      if (item.target_type === 'team') return `/teams/${slug}`
      if (item.target_type === 'track') return `/tracks/${slug}`
      if (item.target_type === 'profile') return `/u/${slug}`
    }
    return null
  }

  return (
    <div className="space-y-4">
      {/* Followers / Following at top */}
      <div className="flex items-center gap-6 rounded-lg border border-gray-200 bg-white p-4">
        <Link
          href={`/u/${profileUsername}/followers`}
          className="flex flex-col items-center gap-0.5 text-gray-700 hover:text-gray-900 transition-colors"
        >
          <span className="text-lg font-semibold tabular-nums">{followerCount}</span>
          <span className="text-xs font-medium uppercase tracking-wide text-gray-500">Followers</span>
        </Link>
        <Link
          href={`/u/${profileUsername}/following`}
          className="flex flex-col items-center gap-0.5 text-gray-700 hover:text-gray-900 transition-colors"
        >
          <span className="text-lg font-semibold tabular-nums">{followingCount}</span>
          <span className="text-xs font-medium uppercase tracking-wide text-gray-500">Following</span>
        </Link>
      </div>

      {activities.length === 0 ? (
        <div className="py-12 text-center rounded-lg border border-gray-200 bg-white">
          <p className="text-gray-500">No activity yet</p>
        </div>
      ) : (
    <div className="space-y-4">
      {activities.map((item) => {
        const link = getActivityLink(item)
        const className = `flex items-start gap-4 rounded-lg border border-gray-200 bg-white p-4 ${
          link ? 'hover:shadow-md transition-shadow cursor-pointer' : ''
        }`

        const content = (
          <>
            {/* Icon */}
            <div className="flex-shrink-0">{getActivityIcon(item)}</div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-sm">
                <span className="font-medium text-gray-900">{getActivityLabel(item)}</span>
                {item.target_name && (
                  <span className="text-gray-600">
                    {item.target_type === 'profile' ? '@' : ''}
                    {item.target_name}
                  </span>
                )}
              </div>

              {item.content && (
                <p className="mt-1 text-sm text-gray-700 line-clamp-2">{item.content}</p>
              )}

              {item.type === 'grid_update' && (
                <p className="mt-1 text-xs text-gray-500">
                  Updated their {item.target_type} grid
                </p>
              )}

              <p className="mt-2 text-xs text-gray-500">
                {new Date(item.created_at).toLocaleString()}
              </p>
            </div>
          </>
        )

        return link ? (
          <Link key={item.id} href={link} className={className}>
            {content}
          </Link>
        ) : (
          <div key={item.id} className={className}>
            {content}
          </div>
        )
      })}
    </div>
      )}
    </div>
  )
}
