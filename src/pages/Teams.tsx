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
import { Search, Trophy } from "lucide-react";
import { useTeams } from "@/hooks/useTeams";

const Teams = () => {
  const { data: teams, isLoading, error } = useTeams();
  const [searchTerm, setSearchTerm] = useState("");
  const [countryFilter, setCountryFilter] = useState("all-countries");

  const filteredTeams = useMemo(() => {
    if (!teams) return [];
    
    return teams.filter((team) => {
      const matchesSearch = team.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCountry = countryFilter === "all-countries" || team.country === countryFilter;
      
      return matchesSearch && matchesCountry;
    });
  }, [teams, searchTerm, countryFilter]);

  const uniqueCountries = useMemo(() => {
    if (!teams) return [];
    return Array.from(new Set(teams.map(team => team.country))).sort();
  }, [teams]);

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="pt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-foreground">Error loading teams</h1>
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
        <title>F1 Teams - Who's On Pole?</title>
        <meta name="description" content="Explore all Formula 1 teams, their countries, and team information. Find your favorite F1 constructor." />
      </Helmet>
      
      <Navigation />
      
      <main className="pt-16">
        <PageHeader 
          title="F1 Teams"
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          <p className="text-xl text-muted-foreground text-center">
            Explore the constructors racing for championship glory
          </p>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search teams..."
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
              {isLoading ? "Loading..." : `${filteredTeams.length} team${filteredTeams.length === 1 ? '' : 's'} found`}
            </p>
          </div>

          {/* Teams Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center text-center space-y-4">
                      <Skeleton className="w-16 h-16 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : filteredTeams.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <p className="text-lg text-muted-foreground">No teams match your filters.</p>
                <p className="text-sm text-muted-foreground mt-2">Try adjusting your search criteria.</p>
              </div>
            ) : (
              filteredTeams.map((team) => (
                <Link key={team.id} to={`/teams/${team.id}`}>
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow group">
                    <CardContent className="p-6">
                      <div className="flex flex-col items-center text-center space-y-4">
                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center overflow-hidden group-hover:scale-110 transition-transform">
                          {team.logo_url ? (
                            <img 
                              src={team.logo_url} 
                              alt={`${team.name} logo`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 bg-primary rounded" />
                          )}
                        </div>
                         <div className="space-y-2">
                           <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                             {team.name}
                           </h3>
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
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Teams;