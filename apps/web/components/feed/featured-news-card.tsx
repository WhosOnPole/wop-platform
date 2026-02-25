import Link from 'next/link'
import Image from 'next/image'

interface NewsStory {
  id: string
  title: string
  image_url: string | null
  content: string
  created_at: string
  href?: string
  is_featured?: boolean
}

interface FeaturedNewsCardProps {
  newsStory: NewsStory
}

export function FeaturedNewsCard({ newsStory }: FeaturedNewsCardProps) {
  const href = newsStory.href ?? `/story/${newsStory.id}`
  return (
    <Link
      href={href}
      className="flex h-full w-full flex-col overflow-hidden"
    >
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
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <h3 className="text-lg font-bold text-white line-clamp-2">{newsStory.title}</h3>
          {newsStory.is_featured && (
            <span className="shrink-0 rounded-full bg-[#25B4B1]/20 px-2 py-0.5 text-xs font-medium text-[#25B4B1]">
              Featured
            </span>
          )}
        </div>
        <p className="min-h-0 shrink overflow-hidden text-sm text-white/90 line-clamp-3">
          {newsStory.content}
        </p>
        <div className="mt-auto shrink-0 flex items-center justify-between pt-3">
          <span className="text-xs text-white/70">
            {new Date(newsStory.created_at).toLocaleDateString()}
          </span>
          <span className="text-sm font-medium text-[#25B4B1] hover:text-[#25B4B1]/90">
            Read more →
          </span>
        </div>
      </div>
    </Link>
  )
}
