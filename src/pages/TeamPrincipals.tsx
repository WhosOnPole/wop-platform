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
import { Search, User } from "lucide-react";
import { useTeamPrincipals } from "@/hooks/useTeamPrincipals";

const TeamPrincipals = () => {
  const { data: teamPrincipals, isLoading, error } = useTeamPrincipals();
  const [searchTerm, setSearchTerm] = useState("");
  const [countryFilter, setCountryFilter] = useState("all-countries");
  const [teamFilter, setTeamFilter] = useState("all-teams");

  const filteredPrincipals = useMemo(() => {
    if (!teamPrincipals) return [];
    
    return teamPrincipals.filter((principal) => {
      const matchesSearch = principal.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCountry = countryFilter === "all-countries" || principal.country === countryFilter;
      const matchesTeam = teamFilter === "all-teams" || 
        (principal.teams?.name === teamFilter) ||
        (teamFilter === "no-team" && !principal.team_id);
      
      return matchesSearch && matchesCountry && matchesTeam;
    });
  }, [teamPrincipals, searchTerm, countryFilter, teamFilter]);

  const uniqueCountries = useMemo(() => {
    if (!teamPrincipals) return [];
    return Array.from(new Set(teamPrincipals.map(principal => principal.country))).sort();
  }, [teamPrincipals]);

  const uniqueTeams = useMemo(() => {
    if (!teamPrincipals) return [];
    const teams = teamPrincipals
      .filter(principal => principal.teams?.name)
      .map(principal => principal.teams!.name);
    return Array.from(new Set(teams)).sort();
  }, [teamPrincipals]);

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="pt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-foreground">Error loading team principals</h1>
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
        <title>F1 Team Principals - Who's On Pole?</title>
        <meta name="description" content="Meet the team principals leading Formula 1 constructors. Learn about the people behind the teams." />
      </Helmet>
      
      <Navigation />
      
      <main className="pt-16">
        <PageHeader 
          title="Team Principals"
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          <p className="text-xl text-muted-foreground text-center">
            The leaders guiding F1 teams to championship glory
          </p>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search team principals..."
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
            <Select value={teamFilter} onValueChange={setTeamFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by team" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-teams">All Teams</SelectItem>
                <SelectItem value="no-team">No Team</SelectItem>
                {uniqueTeams.map((team) => (
                  <SelectItem key={team} value={team}>
                    {team}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Results count */}
          <div className="mb-6">
            <p className="text-sm text-muted-foreground">
              {isLoading ? "Loading..." : `${filteredPrincipals.length} team principal${filteredPrincipals.length === 1 ? '' : 's'} found`}
            </p>
          </div>

          {/* Team Principals Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center text-center space-y-4">
                      <Skeleton className="w-20 h-20 rounded-lg" />
                      <div className="space-y-2">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : filteredPrincipals.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <p className="text-lg text-muted-foreground">No team principals match your filters.</p>
                <p className="text-sm text-muted-foreground mt-2">Try adjusting your search criteria.</p>
              </div>
            ) : (
              filteredPrincipals.map((principal) => (
                <Link key={principal.id} to={`/team-principals/${principal.id}`}>
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow group">
                    <CardContent className="p-6">
                      <div className="flex flex-col items-center text-center space-y-4">
                        <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform">
                          {principal.photo_url ? (
                            <img 
                              src={principal.photo_url} 
                              alt={principal.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="h-10 w-10 text-muted-foreground" />
                          )}
                        </div>
                        <div className="space-y-2">
                          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                            {principal.name}
                          </h3>
                          <div className="flex flex-col gap-1">
                            <Badge variant="secondary" className="text-xs">
                              {principal.country}
                            </Badge>
                            {principal.teams && (
                              <Badge variant="outline" className="text-xs">
                                {principal.teams.name}
                              </Badge>
                            )}
                            {principal.years_with_team && (
                              <p className="text-xs text-muted-foreground">
                                {principal.years_with_team} year{principal.years_with_team === 1 ? '' : 's'} with team
                              </p>
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

export default TeamPrincipals;