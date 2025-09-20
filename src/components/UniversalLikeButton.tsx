import React from 'react';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import { useFanPostLikes } from '@/hooks/useFanPostLikes';
import { useDriverCommentLikes } from '@/hooks/useDriverCommentLikes';
import { useTeamCommentLikes } from '@/hooks/useTeamCommentLikes';
import { useTeamPrincipalCommentLikes } from '@/hooks/useTeamPrincipalCommentLikes';
import { useTrackCommentLikes } from '@/hooks/useTrackCommentLikes';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface UniversalLikeButtonProps {
  id: string;
  type: 'fan_post' | 'driver_comment' | 'fan_post_comment' | 'team_comment' | 'team_principal_comment' | 'track_comment';
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg';
  showCount?: boolean;
  className?: string;
}

export const UniversalLikeButton: React.FC<UniversalLikeButtonProps> = ({
  id,
  type,
  variant = 'ghost',
  size = 'sm',
  showCount = true,
  className,
}) => {
  const { user } = useAuth();
  
  // Use appropriate hook based on type
  const fanPostLikes = useFanPostLikes(type === 'fan_post' ? id : undefined);
  const driverCommentLikes = useDriverCommentLikes(type === 'driver_comment' ? id : undefined);
  const teamCommentLikes = useTeamCommentLikes(type === 'team_comment' ? id : undefined);
  const teamPrincipalCommentLikes = useTeamPrincipalCommentLikes(type === 'team_principal_comment' ? id : undefined);
  const trackCommentLikes = useTrackCommentLikes(type === 'track_comment' ? id : undefined);
  
  // Get the appropriate like data based on type
  const { isLiked, likeCount, isLoading, toggleLike, isToggling } = 
    type === 'fan_post' ? fanPostLikes : 
    type === 'driver_comment' ? driverCommentLikes :
    type === 'team_comment' ? teamCommentLikes :
    type === 'team_principal_comment' ? teamPrincipalCommentLikes :
    type === 'track_comment' ? trackCommentLikes :
    { isLiked: false, likeCount: 0, isLoading: false, toggleLike: () => {}, isToggling: false };

  if (!user) {
    return null;
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={() => toggleLike()}
      disabled={isLoading || isToggling}
      className={cn(
        "gap-2",
        isLiked && "text-red-500 hover:text-red-600",
        className
      )}
    >
      <Heart 
        className={cn(
          "h-4 w-4",
          isLiked && "fill-current"
        )} 
      />
      {showCount && (
        <span className="text-sm">
          {isToggling ? '...' : likeCount}
        </span>
      )}
    </Button>
  );
};