import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { Heart, MessageCircle, ExternalLink } from 'lucide-react';
import { CommentEntityBadge } from './CommentEntityBadge';
import { UserCommentMenu } from './UserCommentMenu';
import { useNavigate } from 'react-router-dom';

interface UserComment {
  id: string;
  content: string;
  created_at: string;
  entity_type: 'driver' | 'team' | 'track' | 'team_principal';
  entity_id: string;
  entity_name: string;
  entity_image?: string;
  entity_additional_info?: string;
  like_count: number;
  reply_count: number;
  snippet: string;
  deep_link: string;
  is_hidden_from_profile?: boolean;
}

interface UserCommentCardProps {
  comment: UserComment;
  onHideFromProfile?: (commentId: string, hidden: boolean) => void;
}

export const UserCommentCard: React.FC<UserCommentCardProps> = ({
  comment,
  onHideFromProfile
}) => {
  const navigate = useNavigate();
  
  const handleCardClick = () => {
    navigate(comment.deep_link);
  };

  const handleMenuAction = (action: string) => {
    if (action === 'hide' && onHideFromProfile) {
      onHideFromProfile(comment.id, true);
    }
  };

  const timeAgo = formatDistanceToNow(new Date(comment.created_at), { addSuffix: true });

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer group">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header with entity badge and menu */}
          <div className="flex items-center justify-between">
            <CommentEntityBadge
              entityType={comment.entity_type}
              entityName={comment.entity_name}
              entityImage={comment.entity_image}
              additionalInfo={comment.entity_additional_info}
            />
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{timeAgo}</span>
              <UserCommentMenu
                commentId={comment.id}
                onAction={handleMenuAction}
              />
            </div>
          </div>

          {/* Comment content snippet */}
          <div onClick={handleCardClick} className="cursor-pointer">
            <p className="text-sm text-foreground leading-relaxed line-clamp-3">
              {comment.snippet}
            </p>
          </div>

          {/* Footer with stats and actions */}
          <div className="flex items-center justify-between pt-2 border-t border-border/50">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Heart className="h-3 w-3" />
                <span className="text-xs">{comment.like_count}</span>
              </div>
              
              <div className="flex items-center gap-1 text-muted-foreground">
                <MessageCircle className="h-3 w-3" />
                <span className="text-xs">{comment.reply_count}</span>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCardClick}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              View Thread
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};