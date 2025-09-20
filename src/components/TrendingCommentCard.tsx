import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, User, Car, Building, MapPin } from 'lucide-react';
import { TrendingComment } from '@/hooks/useTrendingComments';
import { UniversalLikeButton } from '@/components/UniversalLikeButton';
import { useNavigate } from 'react-router-dom';

interface TrendingCommentCardProps {
  comment: TrendingComment;
}

export const TrendingCommentCard = ({ comment }: TrendingCommentCardProps) => {
  const navigate = useNavigate();
  const displayName = comment.profiles?.display_name || comment.profiles?.username || 'Anonymous User';
  const timeAgo = formatDistanceToNow(new Date(comment.created_at), { addSuffix: true });

  const getEntityIcon = (type: string) => {
    switch (type) {
      case 'driver': return <User className="h-3 w-3" />;
      case 'team': return <Building className="h-3 w-3" />;
      case 'team_principal': return <User className="h-3 w-3" />;
      case 'track': return <MapPin className="h-3 w-3" />;
      default: return <Car className="h-3 w-3" />;
    }
  };

  const getEntityRoute = () => {
    switch (comment.entity_type) {
      case 'driver': return `/drivers/${comment.entity_id}`;
      case 'team': return `/teams/${comment.entity_id}`;
      case 'team_principal': return `/team-principals/${comment.entity_id}`;
      case 'track': return `/tracks/${comment.entity_id}`;
      default: return '#';
    }
  };

  const getCommentType = () => {
    switch (comment.entity_type) {
      case 'driver': return 'driver_comment';
      case 'team': return 'team_comment';
      case 'team_principal': return 'team_principal_comment';
      case 'track': return 'track_comment';
      default: return 'driver_comment'; // fallback to driver_comment
    }
  };

  return (
    <Card className="hover:bg-muted/50 transition-colors">
      <CardContent className="p-4">
        <div className="flex gap-3">
          <Avatar className="w-8 h-8">
            <AvatarImage src={comment.profiles?.avatar_url || ''} alt={displayName} />
            <AvatarFallback className="text-sm">
              {displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">{displayName}</span>
                <span className="text-xs text-muted-foreground">•</span>
                <Badge variant="secondary" className="text-xs py-0 px-2">
                  {getEntityIcon(comment.entity_type)}
                  <span className="ml-1">Trending</span>
                </Badge>
              </div>
              <span className="text-xs text-muted-foreground">{timeAgo}</span>
            </div>

            <div className="bg-muted/30 rounded-lg p-2 border-l-2 border-primary/20">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 text-xs text-muted-foreground hover:text-primary mb-1"
                onClick={() => navigate(getEntityRoute())}
              >
                Comment on {comment.entity_name}
              </Button>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {comment.content}
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <UniversalLikeButton
                  id={comment.id}
                  type={getCommentType()}
                  variant="ghost"
                  size="sm"
                  showCount={true}
                  className="h-8 px-2"
                />
                <div className="flex items-center gap-1 text-muted-foreground">
                  <MessageCircle className="h-4 w-4" />
                  <span className="text-sm">{comment.reply_count}</span>
                </div>
              </div>
              <Badge variant="outline" className="text-xs">
                {comment.engagement_score} engagement
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};