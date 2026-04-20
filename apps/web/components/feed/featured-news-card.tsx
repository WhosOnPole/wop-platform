import Link from 'next/link'
import Image from 'next/image'
import { Trophy } from 'lucide-react'
import { getAvatarUrl } from '@/utils/avatar'

interface NewsStory {
  id: string
  title: string
  image_url: string | null
  content: string
  created_at: string
  href?: string
  is_featured?: boolean
  username?: string | null
  profile_image_url?: string | null
}

interface FeaturedNewsCardProps {
  newsStory: NewsStory
  /** spotlight: image + content for Stories tab; compact: default; carousel: gradient border, matches mobile carousel */
  variant?: 'spotlight' | 'compact' | 'carousel'
}

export function FeaturedNewsCard({ newsStory, variant = 'compact' }: FeaturedNewsCardProps) {
  const href = newsStory.href ?? `/story/${newsStory.id}`

  if (variant === 'carousel') {
    const firstLine = (() => {
      const c = newsStory.content?.trim() || ''
      const lines = c.split(/\r?\n/).filter((l) => l.trim())
      if (lines.length > 0) return lines[0].trim()
      return c.length > 50 ? c.slice(0, 50).trim() + '…' : c
    })()
    const showAuthorAvatar = !(newsStory as { is_anonymous?: boolean }).is_anonymous && newsStory.profile_image_url
    const avatarSrc = showAuthorAvatar ? getAvatarUrl(newsStory.profile_image_url!) : '/images/seal_white.png'
    const gradientStyle = { background: 'linear-gradient(90deg, #EC6D00 0%, #FF006F 50%, #25B4B1 100%)' }
    return (
      <div className="h-full rounded-lg p-[2px]" style={gradientStyle}>
        <Link
          href={href}
          className="relative flex h-full min-h-0 flex-col rounded-[6px] bg-black p-6 text-left shadow transition-colors hover:bg-gradient-to-r hover:from-[#EC6D00] hover:via-[#FF006F] hover:to-[#25B4B1] cursor-pointer"
        >
          <div className="absolute right-4 top-4 z-10 h-10 w-10 shrink-0 overflow-hidden rounded-full border-2 border-white/30">
            <div className="relative h-full w-full">
              <Image
                src={avatarSrc}
                alt=""
                fill
                sizes="40px"
                className="object-cover"
                unoptimized
              />
            </div>
          </div>
          <div className="flex flex-1 flex-col min-h-0">
            <span className="text-[0.6em] uppercase tracking-widest text-white/60 align-super">
              Featured Story
            </span>
            <h2 className="text-xl font-bold text-white leading-snug line-clamp-3 my-0.5">
              {newsStory.title || 'Story'}
            </h2>
            {newsStory.username && (
              <p className="mt-1 text-sm text-white/70">by @{newsStory.username}</p>
            )}
          </div>
          <p className="mt-auto shrink-0 text-sm text-white/70 text-right">
            Read more →
          </p>
        </Link>
      </div>
    )
  }

  if (variant === 'spotlight') {
    return (
      <Link href={href} className="flex h-full w-full flex-col overflow-hidden">
        {newsStory.image_url && (
          <div className="relative h-32 w-full flex-shrink-0">
            <Image
              src={newsStory.image_url}
              alt={newsStory.title}
              fill
              sizes="100vw"
              className="object-cover"
            />
          </div>
        )}
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="my-3 flex items-center justify-between gap-2">
            <h3 className="min-w-0 flex-1 text-lg font-bold text-white line-clamp-2">{newsStory.title}</h3>
            {newsStory.is_featured && (
              <div className="flex shrink-0 items-center space-x-1 rounded-full bg-sunset-gradient px-3 py-1">
                <Trophy className="h-4 w-4 text-white" />
                <span className="text-xs font-medium text-white">Featured</span>
              </div>
            )}
          </div>
          <p className="min-h-0 shrink overflow-hidden text-sm text-white/90 line-clamp-3">
            {newsStory.content}
          </p>
          <div className="mt-auto shrink-0 flex items-center justify-between pt-3">
            <span className="text-xs text-white/70">
              {new Date(newsStory.created_at).toLocaleDateString()}
            </span>
            <span className="text-sm font-medium text-white hover:text-[#25B4B1]/90">
              Read more →
            </span>
          </div>
        </div>
      </Link>
    )
  }

  return (
    <Link
      href={href}
      className="relative flex h-full w-full min-h-[140px] flex-col overflow-hidden transition-colors hover:opacity-90"
    >
      {newsStory.profile_image_url && (
        <div className="absolute right-4 top-4 z-10 h-10 w-10 shrink-0 overflow-hidden rounded-full border-2 border-white/30">
          <Image
            src={getAvatarUrl(newsStory.profile_image_url)}
            alt=""
            fill
            sizes="40px"
            className="object-cover"
            unoptimized
          />
        </div>
      )}
      <div className="flex min-h-0 flex-1 flex-col">
        {newsStory.is_featured && (
          <span className="text-[0.6em] uppercase tracking-widest text-white/60 align-super">
            Featured Story
          </span>
        )}
        <h3 className="mt-0.5 min-w-0 flex-1 text-lg font-bold text-white line-clamp-2">
          {newsStory.title}
        </h3>
        {newsStory.username && (
          <p className="mt-1 text-sm text-white/70">by @{newsStory.username}</p>
        )}
      </div>
      <p className="mt-auto shrink-0 pt-3 text-right text-sm font-medium text-white hover:text-[#25B4B1]/90">
        Read more →
      </p>
    </Link>
  )
}
