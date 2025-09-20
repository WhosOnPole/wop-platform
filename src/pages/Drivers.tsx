import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Search, Filter, Users, MapPin, Hash } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import Navigation from '@/components/Navigation';
import PageHeader from '@/components/PageHeader';
import { useDrivers } from '@/hooks/useDrivers';

const Drivers = () => {
  const { data: drivers, isLoading } = useDrivers();
  const [searchTerm, setSearchTerm] = useState('');
  const [countryFilter, setCountryFilter] = useState('all');
  const [teamFilter, setTeamFilter] = useState('all');

  const filteredDrivers = drivers?.filter(driver => {
    const matchesSearch = driver.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCountry = countryFilter === 'all' || driver.country === countryFilter;
    const matchesTeam = teamFilter === 'all' || driver.teams?.name === teamFilter;
    return matchesSearch && matchesCountry && matchesTeam;
  });

  const countries = [...new Set(drivers?.map(d => d.country))].sort();
  const teams = [...new Set(drivers?.map(d => d.teams?.name).filter(Boolean))].sort();

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Drivers - Who's On Pole?</title>
        <meta name="description" content="Explore all Formula 1 drivers. View detailed profiles, team information, and fan sentiment data." />
      </Helmet>
      
      <Navigation />
      <PageHeader title="Drivers" />
      
      <main className="pb-12">
        <div className="container mx-auto px-4">
          <header className="mb-8">
            <p className="text-muted-foreground text-lg">
              Discover all F1 drivers, their teams, and what fans think about them.
            </p>
          </header>

          {/* Filters */}
          <div className="mb-8 bg-card p-6 rounded-lg border">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search drivers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={countryFilter} onValueChange={setCountryFilter}>
                <SelectTrigger>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <SelectValue placeholder="All Countries" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Countries</SelectItem>
                  {countries.map(country => (
                    <SelectItem key={country} value={country}>
                      {country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={teamFilter} onValueChange={setTeamFilter}>
                <SelectTrigger>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <SelectValue placeholder="All Teams" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Teams</SelectItem>
                  {teams.map(team => (
                    <SelectItem key={team} value={team}>
                      {team}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setCountryFilter('all');
                  setTeamFilter('all');
                }}
              >
                <Filter className="w-4 h-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          </div>

          {/* Results Count */}
          <div className="mb-6">
            <p className="text-sm text-muted-foreground">
              {isLoading ? 'Loading...' : `${filteredDrivers?.length || 0} drivers found`}
            </p>
          </div>

          {/* Drivers Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center text-center space-y-4">
                      <Skeleton className="w-20 h-20 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredDrivers?.map((driver) => (
                <Link key={driver.id} to={`/drivers/${driver.id}`}>
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow group">
                    <CardContent className="p-6">
                      <div className="flex flex-col items-center text-center space-y-4">
                        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                          {driver.headshot_url ? (
                            <img 
                              src={driver.headshot_url} 
                              alt={driver.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center text-sm font-bold">
                              {driver.name.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div className="space-y-2">
                          <h3 className="font-semibold group-hover:text-primary transition-colors">
                            {driver.name}
                          </h3>
                          <div className="flex items-center gap-2 text-sm">
                            {driver.number && (
                              <Badge variant="outline" className="text-xs">
                                <Hash className="w-3 h-3 mr-1" />
                                {driver.number}
                              </Badge>
                            )}
                            <Badge variant="secondary" className="text-xs">
                              {driver.country}
                            </Badge>
                          </div>
                          {driver.teams && (
                            <div className="text-sm text-muted-foreground">
                              {driver.teams.name}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}

          {filteredDrivers?.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">No drivers found matching your filters.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Drivers;