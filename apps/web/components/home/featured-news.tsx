import Link from 'next/link'
import Image from 'next/image'

interface NewsStory {
  id: string
  title: string
  image_url: string | null
  content: string
  created_at: string
}

interface FeaturedNewsProps {
  newsStory: NewsStory
}

export function FeaturedNews({ newsStory }: FeaturedNewsProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
      {newsStory.image_url && (
        <div className="relative h-64 w-full">
          <img
            src={newsStory.image_url}
            alt={newsStory.title}
            className="h-full w-full object-cover"
          />
        </div>
      )}
      <div className="p-6">
        <h3 className="mb-2 text-2xl font-bold text-gray-900">{newsStory.title}</h3>
        <p className="mb-4 text-gray-600 line-clamp-3">
          {newsStory.content.substring(0, 200)}...
        </p>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">
            {new Date(newsStory.created_at).toLocaleDateString()}
          </span>
          <Link
            href={`/news/${newsStory.id}`}
            className="text-bright-teal hover:text-racing-orange font-medium"
          >
            Read more →
          </Link>
        </div>
      </div>
    </div>
  )
}

