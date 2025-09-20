import React from 'react';
import { Button } from '@/components/ui/button';
import { UserPlus, UserMinus } from 'lucide-react';
import { useFollow } from '@/hooks/useFollow';
import { useAuth } from '@/contexts/AuthContext';

interface FollowButtonProps {
  targetUserId: string;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg';
  showIcon?: boolean;
}

export const FollowButton: React.FC<FollowButtonProps> = ({
  targetUserId,
  variant = 'default',
  size = 'default',
  showIcon = true,
}) => {
  const { user } = useAuth();
  const { isFollowing, isLoading, toggleFollow, isToggling } = useFollow(targetUserId);

  // Don't show button if user is viewing their own profile
  if (!user || user.id === targetUserId) {
    return null;
  }

  return (
    <Button
      variant={isFollowing ? 'outline' : variant}
      size={size}
      onClick={toggleFollow}
      disabled={isLoading || isToggling}
    >
      {showIcon && (
        isFollowing ? (
          <UserMinus className="h-4 w-4 mr-2" />
        ) : (
          <UserPlus className="h-4 w-4 mr-2" />
        )
      )}
      {isToggling ? 'Loading...' : isFollowing ? 'Unfollow' : 'Follow'}
    </Button>
  );
};

export default FollowButton;