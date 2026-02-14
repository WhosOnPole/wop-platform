import Link from 'next/link'
import { BarChart3, Check } from 'lucide-react'

interface Poll {
  id: string
  question: string
  options?: unknown[]
}

interface BannerPollCardProps {
  poll: Poll
  userResponse?: string
}

export function BannerPollCard({ poll, userResponse }: BannerPollCardProps) {
  const hasVoted = !!userResponse

  return (
    <Link
      href={`/podiums?poll=${poll.id}`}
      className="flex h-full min-h-[140px] w-full flex-col justify-center rounded-lg border border-white/10 bg-black/40 p-4 shadow backdrop-blur-sm transition-colors hover:bg-white/5"
    >
      <div className="flex items-center gap-2 text-sm font-medium text-white/90">
        <BarChart3 className="h-4 w-4 shrink-0" />
        <span>Featured Poll</span>
        {hasVoted && (
          <span className="flex items-center gap-1 rounded bg-white/10 px-1.5 py-0.5 text-xs">
            <Check className="h-3 w-3" />
            Voted
          </span>
        )}
      </div>
      <p className="mt-2 line-clamp-3 text-sm font-medium text-white">
        {poll.question}
      </p>
      <span className="mt-2 text-xs text-[#25B4B1]">
        {hasVoted ? 'View results →' : 'Vote now →'}
      </span>
    </Link>
  )
}
