import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Navigation from '@/components/Navigation';
import PageHeader from '@/components/PageHeader';
import Footer from '@/components/Footer';
import RacingFormation from '@/components/RacingFormation';
import LikeButton from '@/components/LikeButton';
import { TrendingCommentCard } from '@/components/TrendingCommentCard';
import { UniversalLikeButton } from '@/components/UniversalLikeButton';
import { CommentsHighlights } from '@/components/CommentsHighlights';
import { useTrendingComments } from '@/hooks/useTrendingComments';
import { useEnhancedPolls } from '@/hooks/useEnhancedPolls';
import { useEnhancedFanPosts } from '@/hooks/useEnhancedFanPosts';
import { Calendar, Grid3X3, Heart, MessageCircle, Users, Trophy, Vote, Image, TrendingUp, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface FeedItem {
  id: string;
  type: 'grid' | 'fan_post' | 'poll' | 'trending_comment' | 'poll_result';
  created_at: string;
  data: any;
  engagement_score?: number;
  author?: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

const Feed = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  // Use enhanced hooks
  const { data: trendingComments, isLoading: commentsLoading } = useTrendingComments(5, 7);
  const { data: enhancedPolls, isLoading: pollsLoading } = useEnhancedPolls(10);
  const { data: enhancedFanPosts, isLoading: postsLoading } = useEnhancedFanPosts(10, 14);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchFeedData();
  }, [user, navigate, trendingComments, enhancedPolls, enhancedFanPosts]);

  const fetchFeedData = async () => {
    if (!user) return;

    try {
      // Get users that current user follows
      const { data: follows } = await supabase
        .from('follows')
        .select('followee_id')
        .eq('follower_id', user.id);

      const followingIds = follows?.map(f => f.followee_id) || [];
      const feedItems: FeedItem[] = [];

      // Add trending comments
      if (trendingComments) {
        trendingComments.forEach(comment => {
          feedItems.push({
            id: `trending-${comment.id}`,
            type: 'trending_comment',
            created_at: comment.created_at,
            data: comment,
            engagement_score: comment.engagement_score,
            author: comment.profiles
          });
        });
      }

      // Add enhanced polls
      if (enhancedPolls) {
        enhancedPolls.forEach(poll => {
          const type = poll.status === 'live' && !poll.user_voted ? 'poll' : 'poll_result';
          feedItems.push({
            id: `poll-${poll.id}`,
            type,
            created_at: poll.created_at,
            data: poll,
            engagement_score: poll.vote_count
          });
        });
      }

      // Add enhanced fan posts
      if (enhancedFanPosts) {
        enhancedFanPosts.forEach(post => {
          feedItems.push({
            id: `fanpost-${post.id}`,
            type: 'fan_post',
            created_at: post.created_at,
            data: post,
            engagement_score: post.engagement_score,
            author: post.profiles
          });
        });
      }

      // Fetch recent grids from people I follow
      if (followingIds.length > 0) {
        const { data: grids } = await supabase
          .from('grids')
          .select(`
            id, items, note, created_at, user_id,
            profiles!grids_user_id_fkey(username, display_name, avatar_url)
          `)
          .in('user_id', followingIds)
          .order('created_at', { ascending: false })
          .limit(8);

        if (grids) {
          for (const grid of grids) {
            const items = Array.isArray(grid.items) ? grid.items : [];
            
            if (items.length > 0) {
              const driverIds = items.map((item: any) => item.driver_id);
              
              const { data: driversData } = await supabase
                .from('drivers')
                .select('id, name, country, number, headshot_url')
                .in('id', driverIds);

              const itemsWithDrivers = items.map((item: any) => ({
                ...item,
                driver: driversData?.find(driver => driver.id === item.driver_id)
              })).filter(item => item.driver);

              feedItems.push({
                id: `grid-${grid.id}`,
                type: 'grid',
                created_at: grid.created_at,
                data: {
                  ...grid,
                  items: itemsWithDrivers
                },
                author: Array.isArray(grid.profiles) ? grid.profiles[0] : grid.profiles
              });
            }
          }
        }
      }

      // Sort by engagement score and recency
      feedItems.sort((a, b) => {
        const aScore = (a.engagement_score || 0) * 0.7 + new Date(a.created_at).getTime() * 0.3;
        const bScore = (b.engagement_score || 0) * 0.7 + new Date(b.created_at).getTime() * 0.3;
        return bScore - aScore;
      });

      setFeedItems(feedItems);
    } catch (error) {
      console.error('Error fetching feed data:', error);
      toast.error('Failed to load feed');
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const getInitials = (username: string, displayName?: string | null) => {
    if (displayName) {
      return displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return username.slice(0, 2).toUpperCase();
  };

  const filteredItems = activeTab === 'all' 
    ? feedItems 
    : feedItems.filter(item => {
        if (activeTab === 'comment') return item.type === 'trending_comment';
        if (activeTab === 'poll') return item.type === 'poll' || item.type === 'poll_result';
        return item.type === activeTab;
      });

  if (loading || commentsLoading || pollsLoading || postsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-40 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Your Feed | Who's On Pole?</title>
        <meta name="description" content="Stay up to date with grids from people you follow, new fan posts, and polls you can vote on." />
      </Helmet>

      <Navigation />
      <PageHeader title="Your Feed" />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="mb-8">
          <p className="text-muted-foreground">
            Stay up to date with the latest from the racing community
          </p>
        </div>

        {/* Comments Highlights Module */}
        <CommentsHighlights />

        {/* Suggested Users Section - Show when feed is not loading */}
        {!loading && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Discover Racing Fans
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm mb-4">
                Connect with fellow racing enthusiasts and see their grids, posts, and opinions in your feed.
              </p>
              <Button onClick={() => navigate('/fans')} className="w-full">
                <Users className="h-4 w-4 mr-2" />
                Find Fans to Follow
              </Button>
            </CardContent>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="comment">
              <TrendingUp className="h-4 w-4 mr-1" />
              Trending
            </TabsTrigger>
            <TabsTrigger value="grid">Grids</TabsTrigger>
            <TabsTrigger value="fan_post">Posts</TabsTrigger>
            <TabsTrigger value="poll">Polls</TabsTrigger>
          </TabsList>
        </Tabs>

        {filteredItems.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                No feed items yet
              </h3>
              <p className="text-muted-foreground mb-6">
                Follow other racing fans to see their grids and activity in your feed.
              </p>
              <Button onClick={() => navigate('/fans')}>
                <Users className="h-4 w-4 mr-2" />
                Discover Fans
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {filteredItems.map((item) => (
              <Card key={`${item.type}-${item.id}`} className="overflow-hidden">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {item.author && (
                        <>
                          <Avatar className="w-10 h-10">
                            <AvatarImage 
                              src={item.author.avatar_url || undefined}
                              alt={`${item.author.username}'s avatar`}
                            />
                            <AvatarFallback>
                              {getInitials(item.author.username, item.author.display_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-sm">
                              {item.author.display_name || item.author.username}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              @{item.author.username}
                            </p>
                          </div>
                        </>
                      )}
                      {item.type === 'poll' && (
                        <div className="flex items-center gap-2">
                          <Vote className="h-5 w-5 text-primary" />
                          <span className="font-semibold text-sm">New Poll</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {item.type === 'grid' && <Grid3X3 className="h-3 w-3 mr-1" />}
                        {item.type === 'fan_post' && <Image className="h-3 w-3 mr-1" />}
                        {item.type === 'poll' && <Vote className="h-3 w-3 mr-1" />}
                        {item.type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatTimeAgo(item.created_at)}
                      </span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  {item.type === 'trending_comment' && (
                    <TrendingCommentCard comment={item.data} />
                  )}

                  {item.type === 'grid' && (
                    <div>
                      <RacingFormation items={item.data.items} />
                      {item.data.note && (
                        <div className="mt-4 p-3 bg-muted rounded-lg">
                          <p className="text-sm italic">"{item.data.note}"</p>
                        </div>
                      )}
                      <div className="mt-4 flex items-center justify-between">
                        <LikeButton gridId={item.data.id} />
                        <span className="text-xs text-muted-foreground">
                          Grid by @{item.author?.username}
                        </span>
                      </div>
                    </div>
                  )}

                  {item.type === 'fan_post' && (
                    <div>
                      <img 
                        src={item.data.image_url} 
                        alt="Fan post" 
                        className="w-full rounded-lg mb-3"
                      />
                      {item.data.caption && (
                        <p className="text-sm mb-3">{item.data.caption}</p>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <UniversalLikeButton
                            id={item.data.id}
                            type="fan_post"
                            variant="ghost"
                            size="sm"
                            showCount={true}
                            className="h-8 px-2"
                          />
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <MessageCircle className="h-4 w-4" />
                            <span className="text-sm">{item.data.comment_count || 0}</span>
                          </div>
                        </div>
                        {item.data.engagement_score > 0 && (
                          <Badge variant="outline" className="text-xs">
                            {item.data.engagement_score} engagement
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {(item.type === 'poll' || item.type === 'poll_result') && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <h3 className="font-semibold">{item.data.title}</h3>
                        {item.type === 'poll_result' && (
                          <Badge variant="secondary" className="text-xs">
                            <Clock className="h-3 w-3 mr-1" />
                            Results
                          </Badge>
                        )}
                      </div>
                      
                      {item.type === 'poll' ? (
                        <div className="space-y-2">
                          {item.data.options?.map((option: any) => (
                            <Button
                              key={option.id}
                              variant="outline"
                              className="w-full justify-start"
                              onClick={() => navigate(`/polls/${item.data.id}`)}
                            >
                              {option.label}
                            </Button>
                          ))}
                          <Button 
                            className="w-full mt-3"
                            onClick={() => navigate(`/polls/${item.data.id}`)}
                          >
                            Vote Now
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {item.data.options?.map((option: any) => (
                            <div key={option.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                              <span className="text-sm font-medium">{option.label}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">{option.percentage}%</span>
                                <Badge variant="outline" className="text-xs">
                                  {option.vote_count} votes
                                </Badge>
                              </div>
                            </div>
                          ))}
                          {item.data.user_voted && item.data.user_selected_option && (
                            <p className="text-xs text-muted-foreground mt-2">
                              You voted for: {item.data.user_selected_option}
                            </p>
                          )}
                          <Button 
                            variant="outline"
                            className="w-full mt-3"
                            onClick={() => navigate(`/polls/${item.data.id}`)}
                          >
                            View Details
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Feed;