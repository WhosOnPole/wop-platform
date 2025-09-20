import { Card, CardContent } from "@/components/ui/card";
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem, 
  CarouselNext, 
  CarouselPrevious 
} from "@/components/ui/carousel";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Star, Users, Trophy } from "lucide-react";
import { useTrendingDrivers, useDriverFanGrowth } from "@/hooks/useTrendingDrivers";
import { Link } from "react-router-dom";

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
    // Add more as needed
  };
  return countryFlags[countryCode] || '🏁';
};

const DriverCard = ({ driver, index }: { driver: any; index: number }) => {
  const { data: fanGrowth } = useDriverFanGrowth(driver.id);
  
  const position = index + 1;
  const hasRecentActivity = driver.recent_grids > 0;
  const fanCount = driver.fan_count || 0;
  const avgStars = Math.round((driver.avg_stars || 0) * 10) / 10;
  
  return (
    <Link to={`/drivers/${driver.id}`}>
      <Card className="h-full rounded-2xl shadow-racing transition-racing hover:shadow-glow cursor-pointer">
        <CardContent className="p-6">
        <div className="relative mb-4">
          {driver.headshot_url ? (
            <img
              src={driver.headshot_url}
              alt={`${driver.name} headshot`}
              className="w-full h-48 object-cover rounded-2xl"
              onError={(e) => {
                // Fallback to a generic driver image or initials
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : null}
          {/* Fallback initials display */}
          <div className={`${driver.headshot_url ? 'hidden' : 'flex'} w-full h-48 bg-muted rounded-2xl items-center justify-center text-4xl font-bold text-muted-foreground`}>
            {driver.name.split(' ').map((n: string) => n[0]).join('')}
          </div>
          
          <Badge className="absolute top-3 right-3 bg-primary text-primary-foreground rounded-2xl">
            #{position}
          </Badge>
          
          <div className="absolute bottom-3 left-3 flex items-center gap-2">
            {hasRecentActivity && (
              <Badge className="bg-accent text-accent-foreground rounded-2xl">
                <TrendingUp className="h-3 w-3 mr-1" />
                Hot
              </Badge>
            )}
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-foreground truncate">{driver.name}</h3>
            <span className="text-2xl">{getCountryFlag(driver.country)}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground font-medium truncate">{driver.team_name}</p>
            {driver.number && (
              <Badge variant="outline" className="rounded-2xl">
                #{driver.number}
              </Badge>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-2 pt-2 text-sm">
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3 text-accent" />
              <span className="font-medium">{fanCount} fans</span>
            </div>
            {avgStars > 0 && (
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 text-accent fill-accent" />
                <span className="font-medium">{avgStars}★</span>
              </div>
            )}
            {hasRecentActivity && (
              <div className="flex items-center gap-1 col-span-2">
                <Trophy className="h-3 w-3 text-primary" />
                <span className="font-medium text-primary">{driver.recent_grids} recent grids</span>
              </div>
            )}
          </div>
          
          <div className="flex justify-center pt-2">
            <Badge variant="secondary" className="rounded-2xl">
              Trending #{position}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
    </Link>
  );
};

const LoadingSkeleton = () => (
  <Card className="h-full rounded-2xl">
    <CardContent className="p-6">
      <Skeleton className="w-full h-48 rounded-2xl mb-4" />
      <div className="space-y-3">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="grid grid-cols-2 gap-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </div>
        <Skeleton className="h-6 w-1/3 mx-auto" />
      </div>
    </CardContent>
  </Card>
);

const TrendingDrivers = () => {
  const { data: drivers, isLoading, error } = useTrendingDrivers(5);

  if (error) {
    return (
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-muted-foreground">Unable to load trending drivers. Please try again later.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <TrendingUp className="h-6 w-6 text-accent" />
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Trending Drivers
            </h2>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            See who's making waves in the racing world right now
          </p>
        </div>

        <Carousel className="w-full max-w-6xl mx-auto">
          <CarouselContent>
            {isLoading ? (
              // Show loading skeletons
              Array.from({ length: 5 }).map((_, index) => (
                <CarouselItem key={`skeleton-${index}`} className="md:basis-1/2 lg:basis-1/3">
                  <LoadingSkeleton />
                </CarouselItem>
              ))
            ) : drivers && drivers.length > 0 ? (
              // Show real driver data
              drivers.map((driver, index) => (
                <CarouselItem key={driver.id} className="md:basis-1/2 lg:basis-1/3">
                  <DriverCard driver={driver} index={index} />
                </CarouselItem>
              ))
            ) : (
              // Show empty state
              <div className="w-full text-center py-12">
                <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No trending drivers found. Check back later!</p>
              </div>
            )}
          </CarouselContent>
          {!isLoading && drivers && drivers.length > 0 && (
            <>
              <CarouselPrevious className="rounded-2xl" />
              <CarouselNext className="rounded-2xl" />
            </>
          )}
        </Carousel>
      </div>
    </section>
  );
};

export default TrendingDrivers;