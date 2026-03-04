import Link from 'next/link'
import { Check } from 'lucide-react'

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
      className="flex h-full min-h-[140px] w-full flex-col justify-start rounded-lg border border-white/10 bg-black/40 p-4 shadow backdrop-blur-sm transition-colors hover:bg-white/5"
    >
      <div className="flex h-full flex-col">
        <div className="flex shrink-0 items-start justify-between gap-2">
          <h2 className="text-xl font-bold text-white leading-snug line-clamp-3 min-h-0 flex-1">
            {poll.question}
          </h2>
          {hasVoted && (
            <span className="flex shrink-0 items-center gap-1 rounded bg-white/10 px-1.5 py-0.5 text-xs">
              <Check className="h-3 w-3" />
              Voted
            </span>
          )}
        </div>
        <span className="mt-auto shrink-0 text-xs text-[#25B4B1] text-right">
          {hasVoted ? 'View results →' : 'Vote now →'}
        </span>
      </div>
    </Link>
  )
}
