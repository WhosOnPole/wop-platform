import { Crown, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { RegionalFanBadge } from "@/hooks/useRegionalFanBadges";

interface FanLeadershipBadgeProps {
  badge: RegionalFanBadge;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  className?: string;
}

export const FanLeadershipBadge: React.FC<FanLeadershipBadgeProps> = ({
  badge,
  size = "md",
  showIcon = true,
  className = ""
}) => {
  const sizeClasses = {
    sm: "text-xs px-2 py-1 gap-1",
    md: "text-sm px-3 py-1.5 gap-1.5",
    lg: "text-base px-4 py-2 gap-2"
  };

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4", 
    lg: "h-5 w-5"
  };

  return (
    <Badge 
      variant="secondary" 
      className={`
        bg-gradient-to-r from-yellow-400/20 to-yellow-600/20 
        border-yellow-400/30 text-yellow-800 dark:text-yellow-200
        font-semibold shadow-sm
        ${sizeClasses[size]} 
        ${className}
      `}
      title={`#1 ${badge.driver_name} fan in ${badge.region}${badge.is_tied ? ' (tied)' : ''}`}
    >
      {showIcon && <Crown className={iconSizes[size]} />}
      <span className="truncate max-w-[150px]">
        #1 {badge.driver_name} Fan
      </span>
      {size !== "sm" && (
        <span className="text-xs opacity-75">
          {badge.region}
        </span>
      )}
    </Badge>
  );
};

// Compact badge for inline display
interface CompactFanLeaderBadgeProps {
  className?: string;
}

export const CompactFanLeaderBadge: React.FC<CompactFanLeaderBadgeProps> = ({ className = "" }) => {
  return (
    <div 
      className={`
        inline-flex items-center gap-1 text-xs 
        text-yellow-700 dark:text-yellow-300
        ${className}
      `}
      title="Regional Fan Leader"
    >
      <Crown className="h-3 w-3" />
      <span>Leader</span>
    </div>
  );
};