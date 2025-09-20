import React from 'react';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import { useGridLikes } from '@/hooks/useGridLikes';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface LikeButtonProps {
  gridId: string;
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  size?: 'default' | 'sm' | 'lg';
  showCount?: boolean;
  className?: string;
}

export const LikeButton: React.FC<LikeButtonProps> = ({
  gridId,
  variant = 'ghost',
  size = 'sm',
  showCount = true,
  className,
}) => {
  const { user } = useAuth();
  const { isLiked, likeCount, isLoading, toggleLike, isToggling } = useGridLikes(gridId);

  if (!user) {
    return null;
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={toggleLike}
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

export default LikeButton;