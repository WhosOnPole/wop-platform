import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, X, SortAsc, SortDesc } from 'lucide-react';

interface Team {
  id: string;
  name: string;
}

interface DriverSearchProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  selectedTeam: string;
  onTeamChange: (teamId: string) => void;
  selectedCountry: string;
  onCountryChange: (country: string) => void;
  teams: Team[];
  countries: string[];
  sortField: string;
  onSortFieldChange: (field: string) => void;
  sortDirection: 'asc' | 'desc';
  onSortDirectionChange: (direction: 'asc' | 'desc') => void;
  totalDrivers: number;
  filteredDrivers: number;
}

export const DriverSearch = ({
  searchTerm,
  onSearchChange,
  selectedTeam,
  onTeamChange,
  selectedCountry,
  onCountryChange,
  teams,
  countries,
  sortField,
  onSortFieldChange,
  sortDirection,
  onSortDirectionChange,
  totalDrivers,
  filteredDrivers
}: DriverSearchProps) => {
  const [showFilters, setShowFilters] = useState(false);

  const clearFilters = () => {
    onSearchChange('');
    onTeamChange('all-teams');
    onCountryChange('all-countries');
    onSortFieldChange('name');
    onSortDirectionChange('asc');
  };

  const hasActiveFilters = searchTerm || selectedTeam !== 'all-teams' || selectedCountry !== 'all-countries' || sortField !== 'name' || sortDirection !== 'asc';

  return (
    <div className="space-y-4">
      {/* Search and filter toggle */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search drivers by name..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className={showFilters ? "bg-accent text-accent-foreground" : ""}
        >
          <Filter className="w-4 h-4 mr-2" />
          Filters
        </Button>
        {hasActiveFilters && (
          <Button variant="outline" onClick={clearFilters}>
            <X className="w-4 h-4 mr-2" />
            Clear
          </Button>
        )}
      </div>

      {/* Advanced filters */}
      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg">
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">Team</label>
            <Select value={selectedTeam} onValueChange={onTeamChange}>
              <SelectTrigger>
                <SelectValue placeholder="All teams" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-teams">All teams</SelectItem>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={team.id}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">Country</label>
            <Select value={selectedCountry} onValueChange={onCountryChange}>
              <SelectTrigger>
                <SelectValue placeholder="All countries" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-countries">All countries</SelectItem>
                {countries.map((country) => (
                  <SelectItem key={country} value={country}>
                    {country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">Sort by</label>
            <Select value={sortField} onValueChange={onSortFieldChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="country">Country</SelectItem>
                <SelectItem value="number">Number</SelectItem>
                <SelectItem value="created_at">Created Date</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">Direction</label>
            <Button
              variant="outline"
              onClick={() => onSortDirectionChange(sortDirection === 'asc' ? 'desc' : 'asc')}
              className="w-full justify-start"
            >
              {sortDirection === 'asc' ? (
                <SortAsc className="w-4 h-4 mr-2" />
              ) : (
                <SortDesc className="w-4 h-4 mr-2" />
              )}
              {sortDirection === 'asc' ? 'Ascending' : 'Descending'}
            </Button>
          </div>
        </div>
      )}

      {/* Results summary */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div>
          Showing {filteredDrivers} of {totalDrivers} drivers
        </div>
        {hasActiveFilters && (
          <div className="flex items-center gap-2">
            <span>Active filters:</span>
            <div className="flex gap-1">
              {searchTerm && (
                <Badge variant="secondary" className="text-xs">
                  Search: {searchTerm}
                </Badge>
              )}
              {selectedTeam !== 'all-teams' && (
                <Badge variant="secondary" className="text-xs">
                  Team: {teams.find(t => t.id === selectedTeam)?.name}
                </Badge>
              )}
              {selectedCountry !== 'all-countries' && (
                <Badge variant="secondary" className="text-xs">
                  Country: {selectedCountry}
                </Badge>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};