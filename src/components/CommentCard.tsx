import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Reply } from "lucide-react";
import { DriverComment } from "@/hooks/useDriverComments";
import { UniversalLikeButton } from "@/components/UniversalLikeButton";
import { useDriverCommentReplies } from "@/hooks/useDriverCommentReplies";
import { DriverCommentReplyForm } from "@/components/DriverCommentReplyForm";
import { UniversalCommentCard } from "@/components/UniversalCommentCard";
import { useAuth } from "@/contexts/AuthContext";

interface CommentCardProps {
  comment: DriverComment;
  showStatus?: boolean;
}

export const CommentCard = ({ comment, showStatus = false }: CommentCardProps) => {
  const { user } = useAuth();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const { data: replies } = useDriverCommentReplies(comment.id);
  
  const author = comment.profiles;
  const displayName = author?.display_name || author?.username || "Anonymous";
  const timeAgo = formatDistanceToNow(new Date(comment.created_at), { addSuffix: true });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  return (
    <div className="space-y-4">
      <Card className="rounded-2xl">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={author?.avatar_url || undefined} alt={displayName} />
              <AvatarFallback className="text-sm">
                {displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm truncate">{displayName}</p>
                  {showStatus && (
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getStatusColor(comment.status)}`}
                    >
                      {comment.status}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{timeAgo}</p>
              </div>
              
              <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap break-words">
                {comment.content}
              </p>
              
              <div className="mt-3 flex items-center gap-2">
                <UniversalLikeButton 
                  id={comment.id} 
                  type="driver_comment"
                />
                {user && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowReplyForm(!showReplyForm)}
                    className="gap-1"
                  >
                    <Reply className="h-4 w-4" />
                    <span className="text-sm">Reply</span>
                    {replies && replies.length > 0 && (
                      <span className="text-xs text-muted-foreground">
                        ({replies.length})
                      </span>
                    )}
                  </Button>
                )}
              </div>

              {/* Reply Form */}
              {showReplyForm && user && (
                <DriverCommentReplyForm
                  commentId={comment.id}
                  onCancel={() => setShowReplyForm(false)}
                />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Render replies */}
      {replies && replies.length > 0 && (
        <div className="ml-8 space-y-4">
          {replies.map((reply) => (
            <UniversalCommentCard
              key={reply.id}
              comment={reply}
            />
          ))}
        </div>
      )}
    </div>
  );
};