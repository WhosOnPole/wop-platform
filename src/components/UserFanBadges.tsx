import { useRegionalFanBadges } from "@/hooks/useRegionalFanBadges";
import { FanLeadershipBadge } from "./FanLeadershipBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { Crown } from "lucide-react";

interface UserFanBadgesProps {
  userId?: string;
  size?: "sm" | "md" | "lg";
  maxDisplay?: number;
  className?: string;
}

export const UserFanBadges: React.FC<UserFanBadgesProps> = ({
  size = "md",
  maxDisplay = 3,
  className = ""
}) => {
  const { data: badges, isLoading } = useRegionalFanBadges();

  if (isLoading) {
    return (
      <div className={`flex gap-2 ${className}`}>
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-6 w-24 rounded-full" />
        ))}
      </div>
    );
  }

  if (!badges || badges.length === 0) {
    return null;
  }

  const displayBadges = badges.slice(0, maxDisplay);
  const remainingCount = badges.length - maxDisplay;

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {displayBadges.map((badge) => (
        <FanLeadershipBadge
          key={`${badge.driver_id}-${badge.region}`}
          badge={badge}
          size={size}
        />
      ))}
      
      {remainingCount > 0 && (
        <div 
          className={`
            inline-flex items-center gap-1 px-2 py-1 text-xs 
            bg-muted text-muted-foreground rounded-full
          `}
          title={`${remainingCount} more regional leadership${remainingCount > 1 ? 's' : ''}`}
        >
          <Crown className="h-3 w-3" />
          +{remainingCount}
        </div>
      )}
    </div>
  );
};