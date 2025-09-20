import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy } from 'lucide-react';

interface Team {
  id: string;
  name: string;
  country: string;
  logo_url: string | null;
  bio: string | null;
  championship_standing: number | null;
}

interface TeamsGalleryProps {
  teams: Team[];
}

export const TeamsGallery = ({ teams }: TeamsGalleryProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {teams.map((team) => (
        <Link key={team.id} to={`/teams/${team.id}`}>
          <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full">
            <CardContent className="p-4">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                  {team.logo_url ? (
                    <img 
                      src={team.logo_url} 
                      alt={team.name}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-primary rounded" />
                  )}
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm">{team.name}</h3>
                  <div className="flex flex-wrap gap-1 justify-center">
                    <Badge variant="secondary" className="text-xs">
                      {team.country}
                    </Badge>
                    {team.championship_standing && (
                      <Badge variant="outline" className="text-xs">
                        <Trophy className="w-3 h-3 mr-1" />
                        P{team.championship_standing}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
};