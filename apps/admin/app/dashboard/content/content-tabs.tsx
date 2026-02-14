'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { NewsStoriesTab } from '@/components/content/news-stories-tab'
import { UserStoriesTab } from '@/components/content/user-stories-tab'
import { PollsTab } from '@/components/content/polls-tab'
import { HotTakesTab } from '@/components/content/hot-takes-tab'
import { ArticlesTab } from '@/components/content/articles-tab'
import { SponsorsTab } from '@/components/content/sponsors-tab'

interface ContentTabsProps {
  defaultTab?: 'news' | 'stories' | 'polls' | 'hot-takes' | 'articles' | 'sponsors'
}

export function ContentTabs({ defaultTab = 'news' }: ContentTabsProps) {
  return (
    <Tabs defaultValue={defaultTab} className="w-full">
      <TabsList>
        <TabsTrigger value="news">News Stories</TabsTrigger>
        <TabsTrigger value="stories">Submitted Stories</TabsTrigger>
        <TabsTrigger value="polls">Polls</TabsTrigger>
        <TabsTrigger value="hot-takes">Hot Takes</TabsTrigger>
        <TabsTrigger value="articles">Articles</TabsTrigger>
        <TabsTrigger value="sponsors">Sponsors</TabsTrigger>
      </TabsList>

      <TabsContent value="news">
        <NewsStoriesTab />
      </TabsContent>

      <TabsContent value="stories">
        <UserStoriesTab />
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
  )
}
