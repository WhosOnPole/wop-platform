import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageCircle, ExternalLink, Flame, Star } from 'lucide-react';
import { HotComment } from '@/hooks/useHotComments';
import { UniversalLikeButton } from '@/components/UniversalLikeButton';
import { CommentEntityBadge } from '@/components/CommentEntityBadge';
import { useNavigate } from 'react-router-dom';

interface HotCommentCardProps {
  comment: HotComment;
  onClick?: () => void;
}

export const HotCommentCard = ({ comment, onClick }: HotCommentCardProps) => {
  const navigate = useNavigate();
  const displayName = comment.profiles?.display_name || comment.profiles?.username || 'Anonymous User';
  const timeAgo = formatDistanceToNow(new Date(comment.created_at), { addSuffix: true });

  // Truncate content to 180 characters
  const snippet = comment.content.length > 180 
    ? comment.content.substring(0, 180) + '...' 
    : comment.content;

  const getEntityRoute = () => {
    switch (comment.entity_type) {
      case 'driver': return `/drivers/${comment.entity_id}#comment-${comment.id}`;
      case 'team': return `/teams/${comment.entity_id}#comment-${comment.id}`;
      case 'team_principal': return `/team-principals/${comment.entity_id}#comment-${comment.id}`;
      case 'track': return `/tracks/${comment.entity_id}#comment-${comment.id}`;
      default: return '#';
    }
  };

  const getCommentType = () => {
    switch (comment.entity_type) {
      case 'driver': return 'driver_comment';
      case 'team': return 'team_comment';
      case 'team_principal': return 'team_principal_comment';
      case 'track': return 'track_comment';
      default: return 'driver_comment';
    }
  };

  const handleViewThread = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(getEntityRoute());
    onClick?.();
  };

  return (
    <div 
      className="p-4 hover:bg-muted/30 transition-colors cursor-pointer border-l-2 border-transparent hover:border-primary/20"
      onClick={() => onClick?.()}
    >
      <div className="flex gap-3 items-start">
        <Avatar className="w-10 h-10 flex-shrink-0">
          <AvatarImage src={comment.profiles?.avatar_url || ''} alt={displayName} />
          <AvatarFallback className="text-sm">
            {displayName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0 space-y-2">
          {/* Header */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm truncate">{displayName}</span>
            
            {comment.is_personalized && (
              <Badge variant="secondary" className="text-xs py-0 px-1.5 bg-primary/10 text-primary">
                <Star className="h-3 w-3 mr-1" />
                For You
              </Badge>
            )}
            
            <span className="text-xs text-muted-foreground">•</span>
            <span className="text-xs text-muted-foreground">{timeAgo}</span>
          </div>

          {/* Entity Badge */}
          <CommentEntityBadge
            entityType={comment.entity_type}
            entityName={comment.entity_name}
            size="sm"
          />

          {/* Comment Content */}
          <div className="bg-muted/20 rounded-lg p-3 border-l-2 border-primary/10">
            <p className="text-sm leading-relaxed text-foreground">
              {snippet}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <UniversalLikeButton
                id={comment.id}
                type={getCommentType()}
                variant="ghost"
                size="sm"
                showCount={true}
                className="h-8 px-2 text-muted-foreground hover:text-primary"
              />
              
              <div className="flex items-center gap-1 text-muted-foreground">
                <MessageCircle className="h-4 w-4" />
                <span className="text-sm">{comment.reply_count}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {comment.engagement_score > 5 && (
                <Badge variant="outline" className="text-xs py-0 px-2">
                  <Flame className="h-3 w-3 mr-1 text-orange-500" />
                  Hot
                </Badge>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs text-muted-foreground hover:text-primary"
                onClick={handleViewThread}
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                View thread
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};