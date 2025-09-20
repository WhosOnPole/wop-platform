import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Driver {
  id: string;
  name: string;
  country: string;
  number: number | null;
  headshot_url: string | null;
  teams?: { name: string };
}

interface DriversGalleryProps {
  drivers: Driver[];
}

export const DriversGallery = ({ drivers }: DriversGalleryProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {drivers.map((driver) => (
        <Card key={driver.id} className="overflow-hidden hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                {driver.headshot_url ? (
                  <img 
                    src={driver.headshot_url} 
                    alt={driver.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center text-xs font-bold">
                    {driver.name.charAt(0)}
                  </div>
                )}
              </div>
              <div>
                <h3 className="font-semibold text-sm">{driver.name}</h3>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                  {driver.number && (
                    <Badge variant="outline" className="text-xs">
                      #{driver.number}
                    </Badge>
                  )}
                  <Badge variant="secondary" className="text-xs">
                    {driver.country}
                  </Badge>
                </div>
                {driver.teams && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {driver.teams.name}
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