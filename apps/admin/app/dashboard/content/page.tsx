import { ContentTabs } from './content-tabs'
import { AdminPageHeader } from '@/components/admin/page-header'

export const dynamic = 'force-dynamic'

export default async function ContentPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const params = await searchParams
  const defaultTab = params.tab === 'stories' ? 'stories' : 'news'

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Content Studio"
        title="Content Creation"
        description="Create and manage news stories, user submissions, polls, hot takes, and endorsements."
      />
      <ContentTabs defaultTab={defaultTab as 'news' | 'stories'} />
      <p className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-500 shadow-sm">
        Notes: Featured stories will be displayed on the home page.
      </p>
    </div>
  )
}

