import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Track } from '@/hooks/useTracks';

interface FavoriteTracksDisplayProps {
  tracks: Track[];
  favoriteTrackIds: string[];
}

export const FavoriteTracksDisplay: React.FC<FavoriteTracksDisplayProps> = ({ 
  tracks, 
  favoriteTrackIds 
}) => {
  const favoriteTracks = favoriteTrackIds
    .map(id => tracks.find(track => track.id === id))
    .filter(Boolean) as Track[];

  if (favoriteTracks.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold">Favorite Tracks</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {favoriteTracks.map((track, index) => (
          <Card key={track.id} className="overflow-hidden hover:shadow-md transition-shadow">
            <div className="aspect-video bg-muted relative overflow-hidden">
              {track.image_url ? (
                <img 
                  src={track.image_url} 
                  alt={track.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                  <div className="text-3xl opacity-50">🏁</div>
                </div>
              )}
              
              {/* Rank badge for ordering */}
              <div className="absolute top-2 left-2 bg-background/90 text-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                {index + 1}
              </div>
            </div>
            <CardContent className="p-3">
              <div className="space-y-1">
                <h4 className="font-medium text-sm leading-tight">{track.name}</h4>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="text-xs">
                    {track.country}
                  </Badge>
                  {track.length_km && (
                    <div className="text-xs text-muted-foreground">
                      {track.length_km} km
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};