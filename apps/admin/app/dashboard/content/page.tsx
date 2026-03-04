import { ContentTabs } from './content-tabs'

export const dynamic = 'force-dynamic'

export default async function ContentPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const params = await searchParams
  const defaultTab = params.tab === 'stories' ? 'stories' : 'news'

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold text-gray-900">Content Creation</h1>
      <p className="mb-8 text-gray-600">
        Create and manage news stories, user submissions, polls, hot takes, and endorsements.
        
      </p>

      <ContentTabs defaultTab={defaultTab as 'news' | 'stories'} />
      <p className="text-sm text-gray-500 mt-16">
        Notes: Featured stories will be displayed on the home page.
      </p>
      
    </div>
  )
}

