import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { Grid3X3, MessageSquare, Image, Activity } from 'lucide-react';
import { useUserVotedPolls, useUserFanPosts } from '@/hooks/useUserActivity';
import { useUserComments } from '@/hooks/useUserComments';
import RacingFormation from '@/components/RacingFormation';
import { LikeButton } from '@/components/LikeButton';
import { UniversalLikeButton } from '@/components/UniversalLikeButton';
import { UserCommentsTab } from '@/components/UserCommentsTab';

interface UserProfileTabsProps {
  userId: string;
  userGrids: any[];
  viewMode: 'formation' | 'list';
  setViewMode: (mode: 'formation' | 'list') => void;
}

export const UserProfileTabs: React.FC<UserProfileTabsProps> = ({
  userId,
  userGrids,
  viewMode,
  setViewMode,
}) => {
  const { data: userVotedPolls = [] } = useUserVotedPolls(userId);
  const { data: userFanPosts = [] } = useUserFanPosts(userId);
  const { data: userCommentsData } = useUserComments(userId, 'newest', 1, 5);

  return (
    <Tabs defaultValue="grids" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="grids" className="flex items-center gap-2">
          <Grid3X3 className="h-4 w-4" />
          Grids ({userGrids.length})
        </TabsTrigger>
        <TabsTrigger value="posts" className="flex items-center gap-2">
          <Image className="h-4 w-4" />
          Posts ({userFanPosts.length})
        </TabsTrigger>
        <TabsTrigger value="comments" className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Comments ({userCommentsData?.totalCount || 0})
        </TabsTrigger>
        <TabsTrigger value="activity" className="flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Activity
        </TabsTrigger>
      </TabsList>

      <TabsContent value="grids" className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Racing Grids</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('formation')}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                viewMode === 'formation'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              Formation
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                viewMode === 'list'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              List
            </button>
          </div>
        </div>

        {userGrids.length === 0 ? (
          <Card className="rounded-2xl">
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">No grids created yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {userGrids.map((grid) => (
              <Card key={grid.id} className="rounded-2xl">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Racing Grid</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Created {formatDistanceToNow(new Date(grid.created_at), { addSuffix: true })}
                  </p>
                </CardHeader>
                <CardContent>
                  {viewMode === 'formation' ? (
                    <RacingFormation items={grid.items || []} />
                  ) : (
                    <div className="space-y-2">
                      {(grid.items || grid.drivers || []).map((item: any, index: number) => {
                        const driver = item.driver || item;
                        return (
                        <div key={driver.id || index} className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl">
                          <span className="font-bold text-lg w-6">{index + 1}</span>
                          <img
                            src={driver.headshot_url}
                            alt={driver.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          <div className="flex-1">
                            <p className="font-semibold">{driver.name}</p>
                            <p className="text-sm text-muted-foreground">#{driver.number}</p>
                          </div>
                          {(item.stars || driver.stars) && (
                            <div className="flex gap-1">
                              {Array.from({ length: item.stars || driver.stars }).map((_, i) => (
                                <span key={i} className="text-yellow-500">⭐</span>
                              ))}
                            </div>
                          )}
                        </div>
                        );
                      })}
                    </div>
                  )}
                  <div className="mt-4 flex items-center justify-between">
                    <LikeButton gridId={grid.id} />
                    {grid.note && (
                      <p className="text-sm text-muted-foreground italic">{grid.note}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="posts" className="space-y-4">
        <h3 className="text-lg font-semibold">Fan Posts</h3>
        {userFanPosts.length === 0 ? (
          <Card className="rounded-2xl">
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">No fan posts yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {userFanPosts.map((post) => (
              <Card key={post.id} className="rounded-2xl">
                <CardContent className="p-4">
                  <div className="space-y-4">
                    <img
                      src={post.image_url}
                      alt="Fan post"
                      className="w-full rounded-xl object-cover max-h-96"
                    />
                    {post.caption && (
                      <p className="text-sm">{post.caption}</p>
                    )}
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</span>
                      <div className="flex items-center gap-4">
                        <UniversalLikeButton id={post.id} type="fan_post" />
                        <Badge variant="outline" className={
                          post.status === 'approved' ? 'border-green-500 text-green-600' :
                          post.status === 'pending' ? 'border-yellow-500 text-yellow-600' :
                          'border-red-500 text-red-600'
                        }>
                          {post.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="comments" className="space-y-4">
        <UserCommentsTab userId={userId} />
      </TabsContent>

      <TabsContent value="activity" className="space-y-4">
        <h3 className="text-lg font-semibold">Activity Feed</h3>
        <Card className="rounded-2xl">
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Activity feed coming soon!</p>
            <p className="text-sm text-muted-foreground mt-2">
              This will show a chronological feed of all user activities including grid creation, posts, and voting.
            </p>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};