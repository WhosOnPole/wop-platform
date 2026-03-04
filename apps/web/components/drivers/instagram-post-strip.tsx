import Image from 'next/image'
import Link from 'next/link'

interface InstagramPost {
  id: string
  href: string
  imageUrl: string
}

interface InstagramPostStripProps {
  posts: InstagramPost[]
}

export function InstagramPostStrip({ posts }: InstagramPostStripProps) {
  if (!posts.length) return null

  return (
    <div className="mt-4 flex gap-3 overflow-x-auto pb-2 [-webkit-overflow-scrolling:touch]">
      {posts.map((post) => (
        <Link
          key={post.id}
          href={post.href}
          target="_blank"
          rel="noreferrer"
          className="relative h-24 w-24 flex-none overflow-hidden rounded-md border bg-gray-100"
        >
          <Image
            src={post.imageUrl}
            alt="Instagram post"
            fill
            sizes="96px"
            className="object-cover"
          />
        </Link>
      ))}
    </div>
  )
}
