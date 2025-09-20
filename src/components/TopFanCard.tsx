import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RegionBadge } from "./RegionBadge";
import { FanPointsBadge } from "./FanPointsBadge";
import { CompactFanLeaderBadge } from "./FanLeadershipBadge";
import { TopFan } from "@/hooks/useTopFans";
import { useRegionalFanBadges } from "@/hooks/useRegionalFanBadges";

interface TopFanCardProps {
  fan: TopFan;
  showPodiumHighlight?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const TopFanCard: React.FC<TopFanCardProps> = ({
  fan,
  showPodiumHighlight = true,
  size = "md",
  className = ""
}) => {
  const isPodium = fan.rank_position <= 3;
  const displayName = fan.display_name || fan.username;
  const initials = displayName
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const { data: regionalBadges } = useRegionalFanBadges();
  const hasRegionalBadge = regionalBadges?.some(badge => badge.region === fan.region);

  const sizeClasses = {
    sm: {
      card: "p-3",
      avatar: "h-10 w-10",
      name: "text-sm",
      username: "text-xs",
      spacing: "gap-2"
    },
    md: {
      card: "p-4",
      avatar: "h-12 w-12",
      name: "text-base",
      username: "text-sm",
      spacing: "gap-3"
    },
    lg: {
      card: "p-6",
      avatar: "h-16 w-16",
      name: "text-lg",
      username: "text-base",
      spacing: "gap-4"
    }
  };

  const getPodiumBorder = (position: number) => {
    if (!showPodiumHighlight) return "";
    
    switch (position) {
      case 1: return "border-2 border-yellow-400 shadow-lg shadow-yellow-400/20 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950/30 dark:to-yellow-900/20";
      case 2: return "border-2 border-gray-400 shadow-lg shadow-gray-400/20 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950/30 dark:to-gray-900/20";
      case 3: return "border-2 border-amber-600 shadow-lg shadow-amber-600/20 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-amber-900/20";
      default: return "border border-border hover:border-border/80";
    }
  };

  return (
    <Link 
      to={`/profile/${fan.username}`}
      className={`
        block transition-all duration-200 rounded-xl
        ${getPodiumBorder(fan.rank_position)}
        hover:scale-[1.02] hover:shadow-md
        ${sizeClasses[size].card}
        ${className}
      `}
    >
      <div className={`flex items-center ${sizeClasses[size].spacing}`}>
        {/* Avatar */}
        <div className="relative">
          <Avatar className={sizeClasses[size].avatar}>
            <AvatarImage 
              src={fan.avatar_url || undefined} 
              alt={displayName}
            />
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          
          {/* Podium crown for #1 */}
          {isPodium && fan.rank_position === 1 && (
            <div className="absolute -top-1 -right-1 text-lg" title="Top Fan">
              👑
            </div>
          )}
        </div>

        {/* User Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className={`font-semibold text-foreground truncate ${sizeClasses[size].name}`}>
              {displayName}
            </h3>
            <FanPointsBadge
              points={fan.total_points}
              rank={fan.rank_position}
              showRank={true}
              variant={isPodium ? "podium" : "default"}
              size={size === "lg" ? "md" : "sm"}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <p className={`text-muted-foreground truncate ${sizeClasses[size].username}`}>
              @{fan.username}
              {hasRegionalBadge && size !== "sm" && (
                <CompactFanLeaderBadge className="ml-2" />
              )}
            </p>
            <RegionBadge region={fan.region} />
          </div>
        </div>
      </div>
    </Link>
  );
};