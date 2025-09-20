import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';
import { UniversalLikeButton } from '@/components/UniversalLikeButton';
import { useAuth } from '@/contexts/AuthContext';
import { TeamCommentReplyForm } from '@/components/TeamCommentReplyForm';
import { TeamPrincipalCommentReplyForm } from '@/components/TeamPrincipalCommentReplyForm';
import { TrackCommentReplyForm } from '@/components/TrackCommentReplyForm';
import { useTeamCommentReplies } from '@/hooks/useTeamCommentReplies';
import { useTeamPrincipalCommentReplies } from '@/hooks/useTeamPrincipalCommentReplies';
import { useTrackCommentReplies } from '@/hooks/useTrackCommentReplies';

interface EnhancedComment {
  id: string;
  content: string;
  created_at: string;
  profiles?: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

interface EnhancedCommentCardProps {
  comment: EnhancedComment;
  type: 'team_comment' | 'team_principal_comment' | 'track_comment';
}

export const EnhancedCommentCard: React.FC<EnhancedCommentCardProps> = ({ comment, type }) => {
  const { user } = useAuth();
  const [showReplyForm, setShowReplyForm] = useState(false);
  
  const displayName = comment.profiles?.display_name || comment.profiles?.username || 'Anonymous User';
  const timeAgo = formatDistanceToNow(new Date(comment.created_at), { addSuffix: true });

  // Get replies based on comment type
  const teamReplies = useTeamCommentReplies(type === 'team_comment' ? comment.id : undefined);
  const teamPrincipalReplies = useTeamPrincipalCommentReplies(type === 'team_principal_comment' ? comment.id : undefined);
  const trackReplies = useTrackCommentReplies(type === 'track_comment' ? comment.id : undefined);
  
  const replies = type === 'team_comment' ? teamReplies.data : 
                 type === 'team_principal_comment' ? teamPrincipalReplies.data :
                 trackReplies.data;

  const renderReplyForm = () => {
    if (!showReplyForm) return null;
    
    switch (type) {
      case 'team_comment':
        return <TeamCommentReplyForm commentId={comment.id} onCancel={() => setShowReplyForm(false)} />;
      case 'team_principal_comment':
        return <TeamPrincipalCommentReplyForm commentId={comment.id} onCancel={() => setShowReplyForm(false)} />;
      case 'track_comment':
        return <TrackCommentReplyForm commentId={comment.id} onCancel={() => setShowReplyForm(false)} />;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex gap-3">
          <Avatar className="w-8 h-8">
            <AvatarImage src={comment.profiles?.avatar_url || ''} alt={displayName} />
            <AvatarFallback className="text-sm">
              {displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">{displayName}</span>
              <span className="text-xs text-muted-foreground">{timeAgo}</span>
            </div>
            
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {comment.content}
            </p>

            {/* Action buttons */}
            <div className="flex items-center gap-2 pt-2">
              <UniversalLikeButton
                id={comment.id}
                type={type}
                variant="ghost"
                size="sm"
                showCount={true}
              />
              
              {user && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowReplyForm(!showReplyForm)}
                  className="gap-2"
                >
                  <MessageCircle className="h-4 w-4" />
                  Reply
                </Button>
              )}
            </div>

            {/* Reply form */}
            {renderReplyForm()}

            {/* Replies */}
            {replies && replies.length > 0 && (
              <div className="mt-4 space-y-3 pl-4 border-l-2 border-muted">
                {replies.map((reply: any) => (
                  <div key={reply.id} className="flex gap-3">
                    <Avatar className="w-6 h-6">
                      <AvatarImage src={reply.profiles?.avatar_url || ''} alt={reply.profiles?.display_name || reply.profiles?.username || 'User'} />
                      <AvatarFallback className="text-xs">
                        {(reply.profiles?.display_name || reply.profiles?.username || 'U').charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">
                          {reply.profiles?.display_name || reply.profiles?.username || 'Anonymous User'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {reply.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};