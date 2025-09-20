import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageCircle, TrendingUp, RefreshCw, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUserComments, useHideCommentFromProfile, CommentSortOption } from '@/hooks/useUserComments';
import { UserCommentCard } from './UserCommentCard';
import { useToast } from '@/hooks/use-toast';

interface UserCommentsTabProps {
  userId: string;
}

export const UserCommentsTab: React.FC<UserCommentsTabProps> = ({ userId }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [sortBy, setSortBy] = useState<CommentSortOption>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  
  const {
    data: commentsData,
    isLoading,
    error,
    refetch
  } = useUserComments(userId, sortBy, currentPage);

  const hideCommentMutation = useHideCommentFromProfile();

  const handleSortChange = (value: CommentSortOption) => {
    setSortBy(value);
    setCurrentPage(1); // Reset to first page when sorting changes
  };

  const handleLoadMore = () => {
    setCurrentPage(prev => prev + 1);
  };

  const handleHideFromProfile = async (commentId: string, hidden: boolean) => {
    // Determine entity type based on comment data
    const comment = commentsData?.comments.find(c => c.id === commentId);
    if (!comment) return;

    try {
      await hideCommentMutation.mutateAsync({
        commentId,
        entityType: comment.entity_type,
        hidden
      });
      
      toast({
        title: "Success",
        description: "Comment hidden from your profile"
      });
    } catch (error) {
      toast({
        title: "Error", 
        description: "Failed to hide comment",
        variant: "destructive"
      });
    }
  };

  const handleRetry = () => {
    refetch();
  };

  const handleJumpToConversation = () => {
    navigate('/drivers?sort=trending');
  };

  // Loading state
  if (isLoading && currentPage === 1) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Comments</h3>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <Skeleton className="h-16 w-full" />
                  <div className="flex items-center justify-between">
                    <div className="flex gap-4">
                      <Skeleton className="h-4 w-8" />
                      <Skeleton className="h-4 w-8" />
                    </div>
                    <Skeleton className="h-6 w-20" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Comments</h3>
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h4 className="text-lg font-semibold mb-2">Failed to load comments</h4>
            <p className="text-sm text-muted-foreground mb-4">
              There was an error loading your comments. Please try again.
            </p>
            <Button onClick={handleRetry} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const comments = commentsData?.comments || [];
  const hasMore = commentsData?.hasMore || false;
  const totalCount = commentsData?.totalCount || 0;

  // Empty state
  if (!isLoading && comments.length === 0 && currentPage === 1) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Comments ({totalCount})</h3>
        <Card className="rounded-2xl">
          <CardContent className="p-8 text-center">
            <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h4 className="text-lg font-semibold mb-2">No comments yet</h4>
            <p className="text-sm text-muted-foreground mb-6">
              Share your thoughts on drivers, teams, and tracks to see your comments here.
            </p>
            <Button onClick={handleJumpToConversation} className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Jump into the conversation
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with sort controls */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Comments ({totalCount})</h3>
        
        <Select value={sortBy} onValueChange={handleSortChange}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="most_liked">Most Liked</SelectItem>
            <SelectItem value="most_replied">Most Replied</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Comments list */}
      <div className="space-y-4">
        {comments.map((comment) => (
          <UserCommentCard
            key={comment.id}
            comment={comment}
            onHideFromProfile={handleHideFromProfile}
          />
        ))}
      </div>

      {/* Load more button */}
      {hasMore && (
        <div className="text-center pt-4">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            disabled={isLoading}
            aria-expanded="false"
            aria-label="Load more comments"
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Loading...
              </>
            ) : (
              'Show More Comments'
            )}
          </Button>
        </div>
      )}

      {/* Loading indicator for pagination */}
      {isLoading && currentPage > 1 && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={`loading-${i}`}>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <Skeleton className="h-16 w-full" />
                  <div className="flex items-center justify-between">
                    <div className="flex gap-4">
                      <Skeleton className="h-4 w-8" />
                      <Skeleton className="h-4 w-8" />
                    </div>
                    <Skeleton className="h-6 w-20" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};