import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MessageCircle, RefreshCw, Zap, Users, Vote } from 'lucide-react';
import { useHotComments, TimeWindow, SortMode } from '@/hooks/useHotComments';
import { useEnhancedPolls } from '@/hooks/useEnhancedPolls';
import { useEnhancedFanPosts } from '@/hooks/useEnhancedFanPosts';
import { HotCommentCard } from '@/components/HotCommentCard';
import { CommentsHighlightsTabs } from '@/components/CommentsHighlightsTabs';
import { useNavigate } from 'react-router-dom';

export const CommentsHighlights = () => {
  const navigate = useNavigate();
  const [sortMode, setSortMode] = useState<SortMode>('hot');
  const [timeWindow, setTimeWindow] = useState<TimeWindow>('day');
  const [page, setPage] = useState(1);
  const [expandedWindows, setExpandedWindows] = useState<TimeWindow[]>([]);

  const {
    data: commentsData,
    isLoading: commentsLoading,
    error: commentsError,
    refetch: refetchComments
  } = useHotComments(sortMode, timeWindow, 20, page);

  // Fallback content hooks
  const { data: enhancedPolls } = useEnhancedPolls(3);
  const { data: enhancedFanPosts } = useEnhancedFanPosts(3, 7);

  const comments = commentsData?.comments || [];
  const hasMore = commentsData?.hasMore || false;
  const totalCount = commentsData?.totalCount || 0;

  // Analytics tracking
  const trackTabSwitch = useCallback((newSortMode: SortMode, newTimeWindow?: TimeWindow) => {
    // Analytics implementation would go here
    console.log('Tab switch:', { from: sortMode, to: newSortMode, timeWindow: newTimeWindow || timeWindow });
  }, [sortMode, timeWindow]);

  const trackCommentClick = useCallback((commentId: string) => {
    // Analytics implementation would go here
    console.log('Comment clicked:', commentId);
  }, []);

  const handleSortModeChange = (newMode: SortMode) => {
    setSortMode(newMode);
    setPage(1);
    trackTabSwitch(newMode);
  };

  const handleTimeWindowChange = (newWindow: TimeWindow) => {
    setTimeWindow(newWindow);
    setPage(1);
    trackTabSwitch(sortMode, newWindow);
  };

  const handleShowMore = () => {
    setPage(prev => prev + 1);
  };

  const handleCommentClick = (commentId: string) => {
    trackCommentClick(commentId);
  };

  // Handle case where we have minimal content - try expanding time window
  const shouldExpandTimeWindow = !commentsLoading && comments.length < 10 && !expandedWindows.includes(timeWindow);

  React.useEffect(() => {
    if (shouldExpandTimeWindow && sortMode === 'hot') {
      const nextWindow: TimeWindow = timeWindow === 'day' ? 'week' : timeWindow === 'week' ? 'month' : 'all';
      if (nextWindow !== timeWindow && !expandedWindows.includes(nextWindow)) {
        setExpandedWindows(prev => [...prev, timeWindow]);
        setTimeWindow(nextWindow);
      }
    }
  }, [shouldExpandTimeWindow, timeWindow, sortMode, expandedWindows]);

  // Loading state
  if (commentsLoading && page === 1) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-6 w-40" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
          </div>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-3 p-4">
              <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="flex gap-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-16 w-full" />
                <div className="flex gap-4">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (commentsError) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Comments Highlights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription className="flex items-center justify-between">
              <span>Failed to load comments. Please try again.</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetchComments()}
                className="ml-4"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Empty state with fallback content
  if (!commentsLoading && comments.length === 0) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Comments Highlights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <CommentsHighlightsTabs
            sortMode={sortMode}
            timeWindow={timeWindow}
            onSortModeChange={handleSortModeChange}
            onTimeWindowChange={handleTimeWindowChange}
            hotCommentCount={0}
            newCommentCount={0}
          />
          
          <div className="text-center py-8">
            <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {sortMode === 'hot' ? 'No hot comments yet' : 'No new comments'}
            </h3>
            <p className="text-muted-foreground mb-6">
              {sortMode === 'hot' 
                ? `Be the first to create engaging discussions in the ${timeWindow === 'day' ? 'last 24 hours' : `last ${timeWindow}`}.`
                : 'Check back later for the latest community discussions.'
              }
            </p>
            
            {/* Fallback content */}
            <div className="grid gap-4 max-w-md mx-auto">
              {enhancedPolls && enhancedPolls.length > 0 && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate('/polls')}
                >
                  <Vote className="h-4 w-4 mr-2" />
                  Vote on {enhancedPolls.length} active poll{enhancedPolls.length > 1 ? 's' : ''}
                </Button>
              )}
              
              {enhancedFanPosts && enhancedFanPosts.length > 0 && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => navigate('/fans')}
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Discover {enhancedFanPosts.length} trending post{enhancedFanPosts.length > 1 ? 's' : ''}
                </Button>
              )}
              
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => navigate('/fans')}
              >
                <Users className="h-4 w-4 mr-2" />
                Find fans to follow
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Comments Highlights
          {totalCount > 0 && (
            <span className="text-sm font-normal text-muted-foreground">
              ({totalCount} found)
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <CommentsHighlightsTabs
          sortMode={sortMode}
          timeWindow={timeWindow}
          onSortModeChange={handleSortModeChange}
          onTimeWindowChange={handleTimeWindowChange}
          hotCommentCount={sortMode === 'hot' ? totalCount : 0}
          newCommentCount={sortMode === 'new' ? totalCount : 0}
        />

        {/* Comments List */}
        <div className="divide-y divide-border">
          {comments.map((comment) => (
            <HotCommentCard
              key={comment.id}
              comment={comment}
              onClick={() => handleCommentClick(comment.id)}
            />
          ))}
        </div>

        {/* Load More */}
        {hasMore && (
          <div className="flex justify-center pt-4">
            <Button
              variant="outline"
              onClick={handleShowMore}
              disabled={commentsLoading}
              className="min-w-32"
            >
              {commentsLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                'Show more'
              )}
            </Button>
          </div>
        )}

        {/* Page indicator */}
        {page > 1 && (
          <div className="text-center text-sm text-muted-foreground">
            Page {page} • {comments.length} of {totalCount} comments
          </div>
        )}
      </CardContent>
    </Card>
  );
};