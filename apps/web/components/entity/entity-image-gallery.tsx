'use client'

import Image from 'next/image'

interface EntityImageGalleryProps {
  images: string[]
}

export function EntityImageGallery({ images }: EntityImageGalleryProps) {
  if (images.length === 0) return null

  return (
    <div className="relative z-10 px-4 py-6">
      <div className="flex gap-4 overflow-x-auto pb-2 [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {images.map((imageUrl, index) => (
          <div
            key={index}
            className="relative h-32 w-32 flex-none overflow-hidden rounded-lg border-2 border-white/20 bg-white/10"
          >
            <Image
              src={imageUrl}
              alt={`Gallery image ${index + 1}`}
              fill
              sizes="128px"
              className="object-cover"
            />
          </div>
        ))}
      </div>
    </div>
  )
}
