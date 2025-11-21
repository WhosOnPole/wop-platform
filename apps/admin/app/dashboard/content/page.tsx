import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { NewsStoriesTab } from '@/components/content/news-stories-tab'
import { PollsTab } from '@/components/content/polls-tab'
import { HotTakesTab } from '@/components/content/hot-takes-tab'
import { ArticlesTab } from '@/components/content/articles-tab'
import { SponsorsTab } from '@/components/content/sponsors-tab'

export default function ContentPage() {
  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold text-gray-900">Content Creation</h1>
      <p className="mb-8 text-gray-600">
        Create and manage news stories, polls, hot takes, articles, and sponsors.
      </p>

      <Tabs defaultValue="news" className="w-full">
        <TabsList>
          <TabsTrigger value="news">News Stories</TabsTrigger>
          <TabsTrigger value="polls">Polls</TabsTrigger>
          <TabsTrigger value="hot-takes">Hot Takes</TabsTrigger>
          <TabsTrigger value="articles">Articles</TabsTrigger>
          <TabsTrigger value="sponsors">Sponsors</TabsTrigger>
        </TabsList>

        <TabsContent value="news">
          <NewsStoriesTab />
        </TabsContent>

        <TabsContent value="polls">
          <PollsTab />
        </TabsContent>

        <TabsContent value="hot-takes">
          <HotTakesTab />
        </TabsContent>

        <TabsContent value="articles">
          <ArticlesTab />
        </TabsContent>

        <TabsContent value="sponsors">
          <SponsorsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}

