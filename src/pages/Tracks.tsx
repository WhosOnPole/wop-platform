import { useState, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import Navigation from "@/components/Navigation";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Search } from "lucide-react";
import { useTracks } from "@/hooks/useTracks";

const Tracks = () => {
  const { data: tracks, isLoading, error } = useTracks();
  const [searchTerm, setSearchTerm] = useState("");
  const [countryFilter, setCountryFilter] = useState("all-countries");

  const filteredTracks = useMemo(() => {
    if (!tracks) return [];
    
    return tracks.filter((track) => {
      const matchesSearch = track.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCountry = countryFilter === "all-countries" || track.country === countryFilter;
      
      return matchesSearch && matchesCountry;
    });
  }, [tracks, searchTerm, countryFilter]);

  const uniqueCountries = useMemo(() => {
    if (!tracks) return [];
    return Array.from(new Set(tracks.map(track => track.country))).sort();
  }, [tracks]);

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="pt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-foreground">Error loading tracks</h1>
              <p className="text-muted-foreground mt-2">Please try again later.</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>F1 Tracks - Who's On Pole?</title>
        <meta name="description" content="Explore all Formula 1 circuits from around the world. Discover track layouts, lengths, and race history." />
      </Helmet>
      
      <Navigation />
      
      <main className="pt-16">
        <PageHeader 
          title="F1 Circuits"
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          <p className="text-xl text-muted-foreground text-center">
            The legendary tracks where racing history is made
          </p>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tracks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={countryFilter} onValueChange={setCountryFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-countries">All Countries</SelectItem>
                {uniqueCountries.map((country) => (
                  <SelectItem key={country} value={country}>
                    {country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Results count */}
          <div className="mb-6">
            <p className="text-sm text-muted-foreground">
              {isLoading ? "Loading..." : `${filteredTracks.length} track${filteredTracks.length === 1 ? '' : 's'} found`}
            </p>
          </div>

          {/* Tracks Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="aspect-video w-full" />
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <Skeleton className="h-6 w-3/4" />
                      <div className="flex justify-between">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : filteredTracks.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <p className="text-lg text-muted-foreground">No tracks match your filters.</p>
                <p className="text-sm text-muted-foreground mt-2">Try adjusting your search criteria.</p>
              </div>
            ) : (
              filteredTracks.map((track) => (
                <Link key={track.id} to={`/tracks/${track.id}`}>
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow group">
                    <div className="aspect-video bg-muted relative overflow-hidden">
                      {track.image_url ? (
                        <img 
                          src={track.image_url} 
                          alt={track.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                          <div className="text-4xl opacity-50">🏁</div>
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                          {track.name}
                        </h3>
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
                </Link>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Tracks;