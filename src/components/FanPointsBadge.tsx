import { Trophy, Star } from "lucide-react";

interface FanPointsBadgeProps {
  points: number;
  rank?: number;
  showRank?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "podium" | "compact";
  className?: string;
}

export const FanPointsBadge: React.FC<FanPointsBadgeProps> = ({
  points,
  rank,
  showRank = false,
  size = "md",
  variant = "default",
  className = ""
}) => {
  const isPodium = rank && rank <= 3;
  const isTop10 = rank && rank <= 10;

  const sizeClasses = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1.5 text-sm",
    lg: "px-4 py-2 text-base"
  };

  const getPodiumColor = (position: number) => {
    switch (position) {
      case 1: return "bg-gradient-to-r from-yellow-400 to-yellow-600 text-yellow-900";
      case 2: return "bg-gradient-to-r from-gray-300 to-gray-500 text-gray-900";
      case 3: return "bg-gradient-to-r from-amber-600 to-amber-800 text-amber-100";
      default: return "bg-primary text-primary-foreground";
    }
  };

  const getVariantClasses = () => {
    if (variant === "podium" && isPodium) {
      return `${getPodiumColor(rank!)} shadow-lg border-2 border-white/20`;
    }
    if (variant === "compact") {
      return "bg-muted/50 text-muted-foreground border border-border/50";
    }
    if (isTop10) {
      return "bg-primary/10 text-primary border border-primary/20";
    }
    return "bg-muted text-muted-foreground";
  };

  const formatPoints = (points: number): string => {
    if (points >= 1000) {
      return `${(points / 1000).toFixed(1)}k`;
    }
    return points.toString();
  };

  const getIcon = () => {
    if (isPodium) {
      return <Trophy className="h-3 w-3" />;
    }
    return <Star className="h-3 w-3" />;
  };

  return (
    <div 
      className={`
        inline-flex items-center gap-1.5 rounded-full font-medium transition-all
        ${sizeClasses[size]}
        ${getVariantClasses()}
        ${className}
      `}
      title={`${points} fan points${showRank && rank ? ` • Rank #${rank}` : ''}`}
    >
      {getIcon()}
      
      {showRank && rank && (
        <span className="font-bold">
          #{rank}
        </span>
      )}
      
      <span className={`${showRank && rank ? "font-normal" : "font-semibold"}`}>
        {formatPoints(points)}
      </span>
      
      {!showRank && (
        <span className="text-xs opacity-75">pts</span>
      )}
    </div>
  );
};