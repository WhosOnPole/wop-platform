import { DiscussionSection } from '@/components/dtt/discussion-section'

interface DiscussionTabProps {
  posts: Array<{
    id: string
    content: string
    created_at: string
    like_count: number
    user: {
      id: string
      username: string
      profile_image_url: string | null
    } | null
  }>
  parentPageType: 'driver' | 'team'
  parentPageId: string
}

export function DiscussionTab({ posts, parentPageType, parentPageId }: DiscussionTabProps) {
  return (
    <DiscussionSection
      posts={posts}
      parentPageType={parentPageType}
      parentPageId={parentPageId}
      variant="dark"
    />
  )
}
