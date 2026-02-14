import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { NewsStoriesTab } from '@/components/content/news-stories-tab'
import { UserStoriesTab } from '@/components/content/user-stories-tab'
import { PollsTab } from '@/components/content/polls-tab'
import { HotTakesTab } from '@/components/content/hot-takes-tab'
import { ArticlesTab } from '@/components/content/articles-tab'
import { SponsorsTab } from '@/components/content/sponsors-tab'
import { ContentTabs } from './content-tabs'

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
        Create and manage news stories, user submissions, polls, hot takes, articles, and sponsors.
      </p>

      <ContentTabs defaultTab={defaultTab as 'news' | 'stories'} />
    </div>
  )
}

