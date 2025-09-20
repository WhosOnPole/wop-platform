import { useState } from "react";
import { MessageSquare, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CommentSortControls } from "@/components/CommentSortControls";
import { RedditStyleCommentCard } from "@/components/RedditStyleCommentCard";
import { CommentSortOption, TimePeriod, useEnhancedDriverComments, useEnhancedTeamComments, useEnhancedTrackComments } from "@/hooks/useEnhancedComments";
import { useAuth } from "@/contexts/AuthContext";
import { CommentForm } from "@/components/CommentForm";
import { TeamCommentForm } from "@/components/TeamCommentForm";
import { TrackCommentForm } from "@/components/TrackCommentForm";
import { useSpamPrevention } from "@/hooks/useCommentModeration";

interface RedditStyleCommentSectionProps {
  entityType: 'driver' | 'team' | 'track';
  entityId: string;
  entityName: string;
  commentForm?: React.ReactNode;
}

export const RedditStyleCommentSection = ({
  entityType,
  entityId,
  entityName,
  commentForm,
}: RedditStyleCommentSectionProps) => {
  const { user } = useAuth();
  const { canComment, timeRemaining } = useSpamPrevention();
  const [sortBy, setSortBy] = useState<CommentSortOption>('popular');
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('all');

  const filters = { sortBy, timePeriod };

  // Use the appropriate hook based on entity type
  const driverCommentsQuery = useEnhancedDriverComments(
    entityType === 'driver' ? entityId : '',
    filters
  );
  const teamCommentsQuery = useEnhancedTeamComments(
    entityType === 'team' ? entityId : '',
    filters
  );
  const trackCommentsQuery = useEnhancedTrackComments(
    entityType === 'track' ? entityId : '',
    filters
  );

  // Select the appropriate query result
  const { data: comments, isLoading } = 
    entityType === 'driver' ? driverCommentsQuery :
    entityType === 'team' ? teamCommentsQuery :
    trackCommentsQuery;

  const handleReply = (commentId: string) => {
    // TODO: Implement reply functionality
    console.log('Reply to comment:', commentId);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {user && commentForm && (
          <Card className="rounded-2xl">
            <CardContent className="p-6">
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        )}
        
        <Card className="rounded-2xl">
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-16 w-full" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Comment Form - Only show if user is authenticated */}
      {user && (
        <div>
          {!canComment && (
            <div className="mb-4 p-3 bg-muted rounded-lg text-center">
              <p className="text-sm text-muted-foreground">
                Please wait {timeRemaining} seconds before posting another comment
              </p>
            </div>
          )}
          {commentForm}
        </div>
      )}
      
      {/* Comments Section */}
      <Card className="rounded-2xl">
        <CardHeader className="space-y-4">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Discussion
            {comments && comments.length > 0 && (
              <span className="text-sm font-normal text-muted-foreground">
                ({comments.length})
              </span>
            )}
          </CardTitle>
          
          {/* Sort Controls */}
          {comments && comments.length > 0 && (
            <CommentSortControls
              sortBy={sortBy}
              timePeriod={timePeriod}
              onSortChange={setSortBy}
              onTimePeriodChange={setTimePeriod}
            />
          )}
        </CardHeader>

        <CardContent>
          {!comments || comments.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No comments yet</h3>
              <p className="text-muted-foreground mb-4">
                Be the first to share your thoughts about {entityName}!
              </p>
              {!user && (
                <p className="text-sm text-muted-foreground">
                  Sign in to leave a comment and join the conversation.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <RedditStyleCommentCard
                  key={comment.id}
                  comment={comment}
                  entityType={entityType}
                  entityId={entityId}
                  onReply={handleReply}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};