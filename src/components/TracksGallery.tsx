import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Track {
  id: string;
  name: string;
  country: string;
  length_km: number | null;
  image_url: string | null;
}

interface TracksGalleryProps {
  tracks: Track[];
}

export const TracksGallery = ({ tracks }: TracksGalleryProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {tracks.map((track) => (
        <Card key={track.id} className="overflow-hidden hover:shadow-lg transition-shadow">
          <div className="aspect-video bg-muted relative overflow-hidden">
            {track.image_url ? (
              <img 
                src={track.image_url} 
                alt={track.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                <div className="text-4xl opacity-50">🏁</div>
              </div>
            )}
          </div>
          <CardContent className="p-4">
            <div className="space-y-2">
              <h3 className="font-semibold">{track.name}</h3>
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="text-xs">
                  {track.country}
                </Badge>
                {track.length_km && (
                  <div className="text-sm text-muted-foreground">
                    {track.length_km} km
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};