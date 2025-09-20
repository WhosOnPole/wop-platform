import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Check, X } from 'lucide-react';
import { Track } from '@/hooks/useTracks';

interface TrackSelectorProps {
  tracks: Track[];
  selectedTrackIds: string[];
  onSelectionChange: (trackIds: string[]) => void;
  maxSelection?: number;
}

export const TrackSelector: React.FC<TrackSelectorProps> = ({
  tracks,
  selectedTrackIds,
  onSelectionChange,
  maxSelection = 5
}) => {
  const handleTrackToggle = (trackId: string) => {
    const isSelected = selectedTrackIds.includes(trackId);
    
    if (isSelected) {
      // Remove track
      onSelectionChange(selectedTrackIds.filter(id => id !== trackId));
    } else {
      // Add track if under limit
      if (selectedTrackIds.length < maxSelection) {
        onSelectionChange([...selectedTrackIds, trackId]);
      }
    }
  };

  const handleRemoveTrack = (trackId: string) => {
    onSelectionChange(selectedTrackIds.filter(id => id !== trackId));
  };

  return (
    <div className="space-y-4">
      {/* Selected tracks display */}
      {selectedTrackIds.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Selected Tracks</h4>
            <Badge variant="secondary" className="text-xs">
              {selectedTrackIds.length}/{maxSelection}
            </Badge>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedTrackIds.map(trackId => {
              const track = tracks.find(t => t.id === trackId);
              if (!track) return null;
              
              return (
                <Badge
                  key={trackId}
                  variant="secondary"
                  className="flex items-center gap-1 pr-1"
                >
                  <span className="text-xs">{track.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => handleRemoveTrack(trackId)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              );
            })}
          </div>
        </div>
      )}

      {/* Track selection grid */}
      <div>
        <h4 className="text-sm font-medium mb-3">Choose Your Favorite Tracks</h4>
        <ScrollArea className="h-64">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-4">
            {tracks.map(track => {
              const isSelected = selectedTrackIds.includes(track.id);
              const isDisabled = !isSelected && selectedTrackIds.length >= maxSelection;
              
              return (
                <Card
                  key={track.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    isSelected 
                      ? 'ring-2 ring-primary bg-primary/5' 
                      : isDisabled 
                        ? 'opacity-50 cursor-not-allowed' 
                        : 'hover:ring-1 hover:ring-primary/50'
                  }`}
                  onClick={() => !isDisabled && handleTrackToggle(track.id)}
                >
                  <CardContent className="p-3">
                    <div className="relative">
                      {/* Track image */}
                      <div className="aspect-video bg-muted rounded-lg overflow-hidden mb-2 relative">
                        {track.image_url ? (
                          <img 
                            src={track.image_url} 
                            alt={track.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                            <div className="text-2xl opacity-50">🏁</div>
                          </div>
                        )}
                        
                        {/* Selection indicator */}
                        {isSelected && (
                          <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                            <Check className="h-3 w-3" />
                          </div>
                        )}
                      </div>
                      
                      {/* Track info */}
                      <div className="space-y-1">
                        <h5 className="font-medium text-sm leading-tight">{track.name}</h5>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{track.country}</span>
                          {track.length_km && (
                            <span>{track.length_km} km</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};