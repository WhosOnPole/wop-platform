import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Users, Trophy, MessageCircle } from "lucide-react";
import { QualifyingEntity } from "@/hooks/useQualifyingEntities";
import { Link } from "react-router-dom";
import { useState } from "react";

// Country code to flag emoji mapping
const getCountryFlag = (countryCode: string): string => {
  const countryFlags: Record<string, string> = {
    'Netherlands': '🇳🇱',
    'United Kingdom': '🇬🇧',
    'Monaco': '🇲🇨',
    'Germany': '🇩🇪',
    'Spain': '🇪🇸',
    'France': '🇫🇷',
    'Italy': '🇮🇹',
    'Finland': '🇫🇮',
    'Australia': '🇦🇺',
    'Canada': '🇨🇦',
    'Mexico': '🇲🇽',
    'Japan': '🇯🇵',
    'Thailand': '🇹🇭',
    'Denmark': '🇩🇰',
    'USA': '🇺🇸',
    'United States': '🇺🇸',
    'Belgium': '🇧🇪',
    'China': '🇨🇳',
    'Austria': '🇦🇹',
    'Switzerland': '🇨🇭',
    'Brazil': '🇧🇷',
    'Argentina': '🇦🇷',
    'Poland': '🇵🇱',
    'Hungary': '🇭🇺',
    'Czech Republic': '🇨🇿',
    'Slovenia': '🇸🇮',
    'Estonia': '🇪🇪',
    'Russia': '🇷🇺',
    'Turkey': '🇹🇷',
    'India': '🇮🇳',
    'South Korea': '🇰🇷',
    'Malaysia': '🇲🇾',
    'Singapore': '🇸🇬',
    'Norway': '🇳🇴',
    'Sweden': '🇸🇪',
    'Portugal': '🇵🇹',
    // Add more as needed
  };
  return countryFlags[countryCode] || '🏁';
};

const getEntityRoute = (entity: QualifyingEntity): string => {
  switch (entity.entity_type) {
    case 'driver':
      return `/drivers/${entity.id}`;
    case 'team':
      return `/teams/${entity.id}`;
    case 'track':
      return `/tracks/${entity.id}`;
    case 'team_principal':
      return `/team-principals/${entity.id}`;
    default:
      return '#';
  }
};

const getEntityTypeLabel = (type: string): string => {
  switch (type) {
    case 'driver':
      return 'Driver';
    case 'team':
      return 'Team';
    case 'track':
      return 'Track';
    case 'team_principal':
      return 'Team Principal';
    default:
      return '';
  }
};

const getEntityTypeColor = (type: string): string => {
  switch (type) {
    case 'driver':
      return 'bg-primary text-primary-foreground';
    case 'team':
      return 'bg-secondary text-secondary-foreground';
    case 'track':
      return 'bg-accent text-accent-foreground';
    case 'team_principal':
      return 'bg-muted text-muted-foreground';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

interface QualifyingEntityCardProps {
  entity: QualifyingEntity;
  position: number;
}

export const QualifyingEntityCard = ({ entity, position }: QualifyingEntityCardProps) => {
  const hasRecentActivity = entity.comment_count > 0 || entity.grid_count > 0;
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
    setImageLoaded(true);
  };
  
  // Calculate responsive height based on aspect ratio
  const getImageContainerStyle = () => {
    if (!imageLoaded || !imageDimensions.width || !imageDimensions.height) {
      return { height: '192px' }; // Default height (h-48)
    }
    
    const aspectRatio = imageDimensions.height / imageDimensions.width;
    const containerWidth = 300; // Approximate card width
    const maxHeight = 240; // Maximum height to maintain card consistency
    const minHeight = 120; // Minimum height
    
    const calculatedHeight = Math.min(Math.max(containerWidth * aspectRatio, minHeight), maxHeight);
    return { height: `${calculatedHeight}px` };
  };

  // Get the primary tag to display, prioritizing assigned tags over activity
  const getPrimaryTag = () => {
    if (entity.tags && entity.tags.length > 0) {
      return entity.tags[0]; // Show first assigned tag
    }
    return null;
  };

  const primaryTag = getPrimaryTag();
  
  return (
    <Link to={getEntityRoute(entity)}>
      <Card className="h-full rounded-2xl shadow-racing transition-racing hover:shadow-glow cursor-pointer">
        <CardContent className="p-6">
          <div className="relative mb-4">
            {entity.image_url ? (
              <div 
                className="w-full rounded-2xl bg-muted flex items-center justify-center overflow-hidden"
                style={getImageContainerStyle()}
              >
                <img
                  src={entity.image_url}
                  alt={`${entity.name} ${entity.entity_type}`}
                  className="w-full h-full object-cover"
                  onLoad={handleImageLoad}
                  onError={(e) => {
                    // Fallback to a generic image or initials
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                {/* Fallback initials display for image errors */}
                <div className="hidden w-full h-full bg-muted rounded-2xl items-center justify-center text-4xl font-bold text-muted-foreground">
                  {entity.name.split(' ').map((n: string) => n[0]).join('')}
                </div>
              </div>
            ) : (
              <div className="w-full h-48 bg-muted rounded-2xl flex items-center justify-center text-4xl font-bold text-muted-foreground">
                {entity.name.split(' ').map((n: string) => n[0]).join('')}
              </div>
            )}
            
            <Badge className="absolute top-3 right-3 bg-primary text-primary-foreground rounded-2xl">
              #{position}
            </Badge>
            
            <Badge className={`absolute top-3 left-3 rounded-2xl ${getEntityTypeColor(entity.entity_type)}`}>
              {getEntityTypeLabel(entity.entity_type)}
            </Badge>
            
            <div className="absolute bottom-3 left-3 flex items-center gap-2">
              {primaryTag ? (
                <Badge className={`rounded-2xl ${primaryTag.color_class}`}>
                  {primaryTag.name}
                </Badge>
              ) : hasRecentActivity ? (
                <Badge className="bg-accent text-accent-foreground rounded-2xl">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  Hot
                </Badge>
              ) : null}
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-foreground truncate">{entity.name}</h3>
              <span className="text-2xl">{getCountryFlag(entity.country)}</span>
            </div>
            
            {entity.additional_info && (
              <p className="text-muted-foreground font-medium truncate">{entity.additional_info}</p>
            )}
            
            <div className="grid grid-cols-2 gap-2 pt-2 text-sm">
              {entity.fan_count > 0 && (
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3 text-accent" />
                  <span className="font-medium">{entity.fan_count} fans</span>
                </div>
              )}
              {entity.comment_count > 0 && (
                <div className="flex items-center gap-1">
                  <MessageCircle className="h-3 w-3 text-accent" />
                  <span className="font-medium">{entity.comment_count} comments</span>
                </div>
              )}
              {entity.grid_count > 0 && (
                <div className="flex items-center gap-1 col-span-2">
                  <Trophy className="h-3 w-3 text-primary" />
                  <span className="font-medium text-primary">{entity.grid_count} recent grids</span>
                </div>
              )}
            </div>
            
            <div className="flex justify-center pt-2">
              <Badge variant="secondary" className="rounded-2xl">
                Qualifying #{position}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};