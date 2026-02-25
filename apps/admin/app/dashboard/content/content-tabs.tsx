'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { NewsStoriesTab } from '@/components/content/news-stories-tab'
import { UserStoriesTab } from '@/components/content/user-stories-tab'
import { PollsTab } from '@/components/content/polls-tab'
import { HotTakesTab } from '@/components/content/hot-takes-tab'
import { SponsorsTab } from '@/components/content/sponsors-tab'

interface ContentTabsProps {
  defaultTab?: 'news' | 'stories' | 'polls' | 'hot-takes' | 'sponsors'
}

export function ContentTabs({ defaultTab = 'news' }: ContentTabsProps) {
  return (
    <Tabs defaultValue={defaultTab} className="w-full">
      <TabsList>
        <TabsTrigger value="polls">Polls</TabsTrigger>
        <TabsTrigger value="hot-takes">Hot Takes</TabsTrigger>
        <TabsTrigger value="news">Published Stories</TabsTrigger>
        <TabsTrigger value="stories">Pending Stories</TabsTrigger>
        <TabsTrigger value="sponsors">Endorsements</TabsTrigger>
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

      <TabsContent value="sponsors">
        <SponsorsTab />
      </TabsContent>
    </Tabs>
  )
}
