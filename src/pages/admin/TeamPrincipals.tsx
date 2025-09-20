import { useState, useEffect, useMemo } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CSVImport } from '@/components/CSVImport';
import { TeamPrincipalCard } from '@/components/admin/TeamPrincipalCard';
import { CreateTeamPrincipalCard } from '@/components/admin/CreateTeamPrincipalCard';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTeamPrincipals } from '@/hooks/useTeamPrincipals';
import { useTeams } from '@/hooks/useTeams';
import { Plus, Search, Filter, Download, Users, TrendingUp, Award } from 'lucide-react';

const TeamPrincipalsAdmin = () => {
  const { data: teamPrincipals = [], isLoading, refetch } = useTeamPrincipals();
  const { data: teams = [] } = useTeams();
  const [searchTerm, setSearchTerm] = useState('');
  const [countryFilter, setCountryFilter] = useState('all');
  const [teamFilter, setTeamFilter] = useState('all');
  const { toast } = useToast();

  // Filter data
  const filteredPrincipals = useMemo(() => {
    return teamPrincipals.filter(principal => {
      const matchesSearch = principal.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           principal.country.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCountry = !countryFilter || countryFilter === 'all' || principal.country === countryFilter;
      const matchesTeam = !teamFilter || teamFilter === 'all' || principal.team_id === teamFilter;
      return matchesSearch && matchesCountry && matchesTeam;
    });
  }, [teamPrincipals, searchTerm, countryFilter, teamFilter]);

  // Get unique values for filters
  const uniqueCountries = useMemo(() => 
    [...new Set(teamPrincipals.map(p => p.country))].sort(), 
    [teamPrincipals]
  );

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this team principal?')) return;
    
    try {
      const { error } = await supabase
        .from('team_principals')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      toast({ title: "Success", description: "Team principal deleted successfully" });
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete team principal",
        variant: "destructive"
      });
    }
  };

  const handleCSVImport = async (data: any[]) => {
    try {
      const { error } = await supabase
        .from('team_principals')
        .insert(data.map(row => ({
          name: row.name || '',
          country: row.country || '',
          team_id: row.team_id || null,
          photo_url: row.photo_url || null,
          bio: row.bio || null,
          quote: row.quote || null,
          quote_author: row.quote_author || null,
          years_with_team: row.years_with_team ? parseInt(row.years_with_team) : null
        })));
      
      if (error) throw error;
      refetch();
      toast({ title: "Success", description: "Team principals imported successfully" });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to import team principals",
        variant: "destructive"
      });
    }
  };

  const handleExport = () => {
    const csvData = teamPrincipals.map(principal => ({
      name: principal.name,
      country: principal.country,
      team_name: principal.teams?.name || '',
      photo_url: principal.photo_url || '',
      bio: principal.bio || '',
      quote: principal.quote || '',
      quote_author: principal.quote_author || '',
      years_with_team: principal.years_with_team || ''
    }));

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'team_principals.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const samplePrincipalData = {
    name: 'Christian Horner',
    country: 'United Kingdom',
    team_id: 'team-id-here',
    photo_url: 'https://example.com/photo.jpg',
    bio: 'Team principal biography and career details',
    quote: 'Racing is in our DNA',
    quote_author: 'Christian Horner',
    years_with_team: '10'
  };

  if (isLoading) return <AdminLayout><div>Loading...</div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold">Team Principals Management</h2>
            <p className="text-muted-foreground">Manage F1 team principals and their information</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleExport} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <CardContent className="flex items-center p-6">
              <div className="p-3 rounded-full bg-primary/20 mr-4">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Principals</p>
                <p className="text-2xl font-bold">{teamPrincipals.length}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
            <CardContent className="flex items-center p-6">
              <div className="p-3 rounded-full bg-accent/20 mr-4">
                <Award className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Countries</p>
                <p className="text-2xl font-bold">{uniqueCountries.length}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20">
            <CardContent className="flex items-center p-6">
              <div className="p-3 rounded-full bg-secondary/20 mr-4">
                <TrendingUp className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">With Teams</p>
                <p className="text-2xl font-bold">{teamPrincipals.filter(p => p.team_id).length}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search team principals by name or country..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Select value={countryFilter} onValueChange={setCountryFilter}>
                  <SelectTrigger className="w-[180px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Countries</SelectItem>
                    {uniqueCountries.map((country) => (
                      <SelectItem key={country} value={country}>
                        {country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={teamFilter} onValueChange={setTeamFilter}>
                  <SelectTrigger className="w-[180px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by team" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Teams</SelectItem>
                    {teams.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {(searchTerm || (countryFilter && countryFilter !== 'all') || (teamFilter && teamFilter !== 'all')) && (
              <div className="mt-4 flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Showing {filteredPrincipals.length} of {teamPrincipals.length} team principals
                </span>
                {(searchTerm || (countryFilter && countryFilter !== 'all') || (teamFilter && teamFilter !== 'all')) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSearchTerm('');
                      setCountryFilter('all');
                      setTeamFilter('all');
                    }}
                  >
                    Clear filters
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3">
            <Tabs defaultValue="cards" className="space-y-4">
              <TabsList>
                <TabsTrigger value="cards">Card View</TabsTrigger>
                <TabsTrigger value="table">Table View</TabsTrigger>
              </TabsList>
              
              <TabsContent value="cards">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  <CreateTeamPrincipalCard 
                    teams={teams}
                    onSuccess={refetch}
                  />
                  {filteredPrincipals.map((principal) => (
                    <TeamPrincipalCard
                      key={principal.id}
                      teamPrincipal={principal}
                      teams={teams}
                      onUpdate={refetch}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
                
                {filteredPrincipals.length === 0 && (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Users className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No team principals found</h3>
                      <p className="text-muted-foreground text-center mb-4">
                        {searchTerm || (countryFilter && countryFilter !== 'all') || (teamFilter && teamFilter !== 'all') 
                          ? "Try adjusting your search or filter criteria."
                          : "Start by adding some team principals to manage."}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
              
              <TabsContent value="table">
                <Card>
                  <CardHeader>
                    <CardTitle>Team Principals Table</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* Table view would go here - simplified for now */}
                    <div className="text-center py-8 text-muted-foreground">
                      Table view coming soon - use card view for now
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
          
          <div className="space-y-6">
            <CSVImport 
              onImport={handleCSVImport}
              sampleData={samplePrincipalData}
              entityName="team principal"
            />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default TeamPrincipalsAdmin;