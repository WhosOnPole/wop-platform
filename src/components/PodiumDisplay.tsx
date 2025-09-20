import React from "react";
import { cn } from "@/lib/utils";
import { Trophy, Medal, Award } from "lucide-react";

interface PodiumOption {
  id: string;
  label: string;
  vote_count: number;
  percentage: number;
}

interface PodiumDisplayProps {
  options: PodiumOption[];
  className?: string;
  compact?: boolean;
}

export const PodiumDisplay: React.FC<PodiumDisplayProps> = ({ 
  options, 
  className,
  compact = false 
}) => {
  // Sort options by vote count descending
  const sortedOptions = [...options].sort((a, b) => b.vote_count - a.vote_count);
  
  // Handle ties by grouping options with same vote count
  const groupedByVotes = sortedOptions.reduce((acc, option, index) => {
    const key = option.vote_count;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push({ ...option, originalIndex: index });
    return acc;
  }, {} as Record<number, (PodiumOption & { originalIndex: number })[]>);

  // Create podium positions accounting for ties
  const podiumPositions: { position: number; options: PodiumOption[]; icon: React.ReactNode }[] = [];
  let currentPosition = 1;
  
  Object.entries(groupedByVotes)
    .sort(([a], [b]) => Number(b) - Number(a))
    .forEach(([voteCount, optionsGroup]) => {
      const icons = [
        <Trophy className="w-4 h-4 text-yellow-500" />,
        <Medal className="w-4 h-4 text-gray-400" />,
        <Award className="w-4 h-4 text-amber-600" />
      ];
      
      podiumPositions.push({
        position: currentPosition,
        options: optionsGroup,
        icon: icons[currentPosition - 1] || <Award className="w-4 h-4 text-accent" />
      });
      
      currentPosition += optionsGroup.length;
    });

  // Only show top 3 positions
  const topThree = podiumPositions.slice(0, 3);

  if (options.length === 0 || options.every(opt => opt.vote_count === 0)) {
    return (
      <div className={cn("flex items-center justify-center py-8", className)}>
        <div className="text-center text-muted-foreground">
          <Trophy className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No votes yet</p>
        </div>
      </div>
    );
  }

  if (compact) {
    // Compact view for poll cards
    return (
      <div className={cn("flex items-end justify-center gap-1 py-2", className)}>
        {topThree.map((position, index) => {
          const heights = ["h-8", "h-6", "h-4"];
          const colors = [
            "bg-gradient-to-t from-yellow-400 to-yellow-300",
            "bg-gradient-to-t from-gray-300 to-gray-200", 
            "bg-gradient-to-t from-amber-500 to-amber-400"
          ];
          
          return (
            <div key={position.position} className="flex flex-col items-center">
              <div className="text-xs text-center mb-1">
                {position.options[0].percentage}%
              </div>
              <div className={cn(
                "w-6 rounded-t flex items-end justify-center",
                heights[index],
                colors[index]
              )}>
                <span className="text-xs font-bold text-white mb-1">
                  {position.position}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Full podium view
  const getPodiumHeight = (position: number) => {
    switch (position) {
      case 1: return "h-32";
      case 2: return "h-24";
      case 3: return "h-20";
      default: return "h-16";
    }
  };

  const getPodiumColor = (position: number) => {
    switch (position) {
      case 1: return "bg-gradient-to-t from-yellow-500 to-yellow-300 border-yellow-400";
      case 2: return "bg-gradient-to-t from-gray-400 to-gray-300 border-gray-400";
      case 3: return "bg-gradient-to-t from-amber-600 to-amber-400 border-amber-500";
      default: return "bg-gradient-to-t from-accent to-accent/80 border-accent";
    }
  };

  const getPositionOrder = (position: number) => {
    // Center 1st, left 2nd, right 3rd
    switch (position) {
      case 1: return 1; // center
      case 2: return 0; // left
      case 3: return 2; // right
      default: return position;
    }
  };

  return (
    <div className={cn("w-full max-w-md mx-auto py-6", className)}>
      <div className="flex items-end justify-center gap-2">
        {topThree
          .sort((a, b) => getPositionOrder(a.position) - getPositionOrder(b.position))
          .map((positionData) => (
            <div key={positionData.position} className="flex flex-col items-center">
              {/* Winner info */}
              <div className="mb-4 text-center min-h-[60px] flex flex-col justify-end">
                {positionData.options.map((option, optIndex) => (
                  <div key={option.id} className={cn("mb-1", optIndex > 0 && "text-xs")}>
                    <div className="flex items-center justify-center gap-1 mb-1">
                      {positionData.icon}
                      <span className="font-medium text-sm">#{positionData.position}</span>
                    </div>
                    <div className="font-semibold text-sm leading-tight max-w-[80px] break-words">
                      {option.label}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {option.percentage}% ({option.vote_count} votes)
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Podium block */}
              <div className={cn(
                "w-16 border-2 rounded-t-lg flex items-end justify-center relative",
                getPodiumHeight(positionData.position),
                getPodiumColor(positionData.position)
              )}>
                <div className="absolute top-2 text-white font-bold text-lg">
                  {positionData.position}
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};