import { EntityImageGallery } from '@/components/entity/entity-image-gallery'
import { getRecentInstagramMedia } from '@/services/instagram'
import { getInstagramUsernameFromEmbed } from '@/utils/instagram'

interface EntityImageGallerySectionProps {
  images: string[]
  instagramEmbedHtml?: string | null
  enableInstagram?: boolean
}

export async function EntityImageGallerySection({
  images,
  instagramEmbedHtml,
  enableInstagram = false,
}: EntityImageGallerySectionProps) {
  const galleryImages = [...images]

  if (!enableInstagram || !instagramEmbedHtml) {
    return <EntityImageGallery images={galleryImages} />
  }

  const parsed = getInstagramUsernameFromEmbed({ embedHtml: instagramEmbedHtml })
  if (!parsed?.username) {
    return <EntityImageGallery images={galleryImages} />
  }

  try {
    const instagramPosts = await getRecentInstagramMedia({
      username: parsed.username,
      limit: 20,
    })
    const instagramImages = instagramPosts.map((p) => p.imageUrl)
    galleryImages.push(...instagramImages)
  } catch (err) {
    console.error('Failed to load Instagram posts', err)
  }

  return <EntityImageGallery images={galleryImages} />
}
