import Link from 'next/link'
import Image from 'next/image'

interface NewsStory {
  id: string
  title: string
  image_url: string | null
  content: string
  created_at: string
}

interface FeaturedNewsCardProps {
  newsStory: NewsStory
}

export function FeaturedNewsCard({ newsStory }: FeaturedNewsCardProps) {
  return (
    <Link
      href={`/news/${newsStory.id}`}
      className="flex h-full w-full flex-col overflow-hidden rounded-lg border border-white/10 bg-black/40 shadow backdrop-blur-sm transition-shadow hover:shadow-lg"
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
      <div className="flex flex-1 flex-col p-6">
        <h3 className="mb-2 text-lg font-bold text-white line-clamp-2">{newsStory.title}</h3>
        <p className="mb-4 flex-1 text-sm text-white/90 line-clamp-3">
          {newsStory.content}
        </p>
        <div className="mt-auto flex items-center justify-between">
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
