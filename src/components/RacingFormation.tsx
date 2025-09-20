import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface Driver {
  id: string;
  name: string;
  country: string;
  number: number | null;
  headshot_url: string | null;
  teams?: { name: string };
}

interface GridItem {
  driver_id: string;
  rank: number;
  reasoning?: string;
  driver?: Driver;
}

interface RacingFormationProps {
  items: GridItem[];
  showMiniVersion?: boolean;
}

const RacingFormation: React.FC<RacingFormationProps> = ({ items, showMiniVersion = false }) => {
  const sortedItems = items.sort((a, b) => a.rank - b.rank);
  
  // For mini version, only show top 6 drivers
  const displayItems = showMiniVersion ? sortedItems.slice(0, 6) : sortedItems;

  return (
    <div className="relative">
      {/* Starting formation using CSS Grid with proper alignment */}
      <div 
        className={`grid ${showMiniVersion ? 'gap-2 max-w-[240px]' : 'gap-4 max-w-[320px]'} mx-auto`}
        style={{
          gridTemplateColumns: '1fr 1fr',
          gridTemplateRows: `repeat(${Math.ceil(displayItems.length / 2)}, auto)`,
          alignItems: 'center',
          justifyItems: 'center'
        }}
      >
        {displayItems.map((item, index) => {
          const row = Math.floor(index / 2) + 1;
          const isLeft = index % 2 === 0;
          
          return (
            <div
              key={item.driver_id}
              className={`relative flex flex-col items-center ${showMiniVersion ? 'p-2' : 'p-3'} w-full`}
              style={{
                gridRow: row,
                gridColumn: isLeft ? 1 : 2,
              }}
            >
            {/* Position Badge */}
            <Badge 
              variant="secondary" 
              className={`${showMiniVersion ? 'w-4 h-4 text-xs' : 'w-6 h-6'} mb-2 flex items-center justify-center font-bold bg-primary text-primary-foreground`}
            >
              {item.rank}
            </Badge>

            {/* Driver Photo */}
            <div className={`${showMiniVersion ? 'w-8 h-8' : 'w-12 h-12'} mb-2 relative`}>
              <Avatar className="w-full h-full">
                <AvatarImage 
                  src={item.driver?.headshot_url || ''} 
                  alt={item.driver?.name || 'Driver'} 
                />
                <AvatarFallback className="text-xs font-bold">
                  {item.driver?.name?.charAt(0) || '?'}
                </AvatarFallback>
              </Avatar>
              {/* Driver Number Badge */}
              {item.driver?.number && (
                <div className={`absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full ${showMiniVersion ? 'w-4 h-4 text-xs' : 'w-5 h-5 text-xs'} flex items-center justify-center font-bold`}>
                  {item.driver.number}
                </div>
              )}
            </div>

            {/* Driver Info */}
            <div className="text-center">
              <h3 className={`${showMiniVersion ? 'text-xs' : 'text-sm'} font-semibold truncate max-w-full`}>
                {item.driver?.name || 'Unknown'}
              </h3>
              
              {!showMiniVersion && (
                <>
                  <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mt-1">
                    <span>{item.driver?.country}</span>
                    {item.driver?.teams && (
                      <>
                        <span>•</span>
                        <span className="truncate">{item.driver.teams.name}</span>
                      </>
                    )}
                  </div>
                  
                  {/* Reasoning */}
                  {item.reasoning && (
                    <div className="text-xs text-muted-foreground mt-1 max-w-full">
                      <div className="truncate italic">"{item.reasoning}"</div>
                    </div>
                  )}
                </>
              )}
            </div>
            </div>
          );
        })}
      </div>

      {/* Start/Finish Line */}
      <div className={`w-full ${showMiniVersion ? 'h-1 mt-2' : 'h-2 mt-6'} bg-gradient-to-r from-muted via-foreground to-muted opacity-30`}>
        <div className="w-full h-full checkered-pattern animate-checkered-flag"></div>
      </div>
    </div>
  );
};

export default RacingFormation;