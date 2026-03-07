import { Suspense } from 'react'
import { FeedPageContent } from './feed-page-content'
import FeedLoading from './loading'

export const revalidate = 60
export const runtime = 'nodejs'

export default function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  return (
    <Suspense fallback={<FeedLoading />}>
      <FeedPageContent searchParams={searchParams} />
    </Suspense>
  )
}
