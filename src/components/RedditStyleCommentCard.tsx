import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import { EnhancedComment } from "@/hooks/useEnhancedComments";
import { UniversalLikeButton } from "@/components/UniversalLikeButton";
import { CommentOptionsMenu } from "@/components/CommentOptionsMenu";
import { useHiddenComments } from "@/hooks/useCommentModeration";
import { useAuth } from "@/contexts/AuthContext";

interface RedditStyleCommentCardProps {
  comment: EnhancedComment;
  entityType: 'driver' | 'team' | 'track';
  entityId: string;
  onReply?: (commentId: string) => void;
  showReplies?: boolean;
}

export const RedditStyleCommentCard = ({
  comment,
  entityType,
  entityId,
  onReply,
  showReplies = true,
}: RedditStyleCommentCardProps) => {
  const { user } = useAuth();
  const { isHidden } = useHiddenComments();
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Don't render hidden comments
  if (isHidden(comment.id)) {
    return (
      <div className="bg-muted/30 border rounded-lg p-3 text-center">
        <span className="text-sm text-muted-foreground">Comment hidden</span>
      </div>
    );
  }
  
  const author = comment.profiles;
  const displayName = author?.display_name || author?.username || "Anonymous";
  const timeAgo = formatDistanceToNow(new Date(comment.created_at), { addSuffix: true });

  // Truncate long content for better readability
  const maxLength = 300;
  const shouldTruncate = comment.content.length > maxLength;
  const displayContent = shouldTruncate && !isExpanded 
    ? comment.content.slice(0, maxLength) + "..." 
    : comment.content;

  return (
    <div className="bg-card border rounded-lg p-4 space-y-3 group">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={author?.avatar_url || undefined} alt={displayName} />
            <AvatarFallback className="text-xs">
              {displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium text-foreground">{displayName}</span>
          <span className="text-xs text-muted-foreground">•</span>
          <span className="text-xs text-muted-foreground">{timeAgo}</span>
        </div>
        
        {/* Options Menu */}
        <CommentOptionsMenu
          commentId={comment.id}
          commentAuthorId={comment.author_id}
          entityType={entityType}
          entityId={entityId}
        />
      </div>

      {/* Content */}
      <div className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
        {displayContent}
        {shouldTruncate && (
          <Button
            variant="link"
            size="sm"
            className="p-0 h-auto text-primary"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? " Show less" : " Read more"}
          </Button>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        {/* Upvote/Like Button */}
        <UniversalLikeButton
          id={comment.id}
          type={`${entityType}_comment` as any}
          variant="ghost"
          size="sm"
          showCount
          className="gap-1 h-8 px-2"
        />

        {/* Reply Button */}
        {user && onReply && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onReply(comment.id)}
            className="gap-1 h-8 px-2"
          >
            <MessageSquare className="h-3 w-3" />
            <span className="text-xs">Reply</span>
            {comment.reply_count > 0 && (
              <span className="text-xs text-muted-foreground">
                ({comment.reply_count})
              </span>
            )}
          </Button>
        )}

        {/* Popularity Score (for debugging/admin) */}
        {comment.popularity_score > 0 && (
          <div className="ml-auto">
            <span className="text-xs text-muted-foreground">
              Score: {Math.round(comment.popularity_score)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};