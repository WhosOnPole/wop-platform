import Link from 'next/link'
import { Trophy } from 'lucide-react'
import { getAvatarUrl } from '@/utils/avatar'

interface User {
  id: string
  username: string
  profile_image_url: string | null
  points: number
}

interface WinnersPodiumProps {
  users: User[] | null | undefined
}

export function WinnersPodium({ users }: WinnersPodiumProps) {
  if (!users || users.length === 0) return null

  // Sort users by points (descending)
  const sortedUsers = [...users].sort((a, b) => b.points - a.points)
  const [first, second, third] = sortedUsers

  return (
    <div className="flex items-end justify-center space-x-4">
      {/* Second Place */}
      {second && (
        <div className="flex flex-col items-center">
          <Link
            href={`/u/${second.username}`}
            className="group flex flex-col items-center space-y-2"
          >
            <div className="relative">
              <img
                src={getAvatarUrl(second.profile_image_url)}
                alt={second.username}
                className="h-20 w-20 rounded-full object-cover ring-4 ring-bright-teal group-hover:ring-bright-teal/80 transition-all"
              />
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-bright-teal p-1">
                <Trophy className="h-4 w-4 text-white" />
              </div>
            </div>
            <div className="mt-4 rounded-lg bg-bright-teal/10 px-4 py-3 text-center">
              <p className="font-semibold text-background-text">{second.username}</p>
              <p className="text-sm text-bright-teal font-medium">{second.points} points</p>
            </div>
          </Link>
        </div>
      )}

      {/* First Place */}
      {first && (
        <div className="flex flex-col items-center">
          <Link
            href={`/u/${first.username}`}
            className="group flex flex-col items-center space-y-2"
          >
            <div className="relative">
              <img
                src={getAvatarUrl(first.profile_image_url)}
                alt={first.username}
                className="h-32 w-32 rounded-full object-cover ring-4 ring-racing-orange group-hover:ring-racing-orange/80 transition-all"
              />
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-racing-orange p-1">
                <Trophy className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="mt-6 rounded-lg bg-racing-orange/10 px-6 py-4 text-center">
              <p className="text-lg font-bold text-background-text">{first.username}</p>
              <p className="text-sm font-semibold text-racing-orange font-medium">{first.points} points</p>
            </div>
          </Link>
        </div>
      )}

      {/* Third Place */}
      {third && (
        <div className="flex flex-col items-center">
          <Link
            href={`/u/${third.username}`}
            className="group flex flex-col items-center space-y-2"
          >
            <div className="relative">
              <img
                src={getAvatarUrl(third.profile_image_url)}
                alt={third.username}
                className="h-16 w-16 rounded-full object-cover ring-4 ring-bright-teal group-hover:ring-bright-teal/80 transition-all"
              />
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-bright-teal p-1">
                <Trophy className="h-3 w-3 text-white" />
              </div>
            </div>
            <div className="mt-2 rounded-lg bg-bright-teal/10 px-3 py-2 text-center">
              <p className="font-semibold text-background-text">{third.username}</p>
              <p className="text-xs text-bright-teal font-medium">{third.points} points</p>
            </div>
          </Link>
        </div>
      )}
    </div>
  )
}

