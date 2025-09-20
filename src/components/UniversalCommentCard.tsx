import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';

interface UniversalComment {
  id: string;
  content: string;
  created_at: string;
  profiles?: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

interface UniversalCommentCardProps {
  comment: UniversalComment;
}

export const UniversalCommentCard = ({ comment }: UniversalCommentCardProps) => {
  const displayName = comment.profiles?.display_name || comment.profiles?.username || 'Anonymous User';
  const timeAgo = formatDistanceToNow(new Date(comment.created_at), { addSuffix: true });

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
          </div>
        </div>
      </CardContent>
    </Card>
  );
};