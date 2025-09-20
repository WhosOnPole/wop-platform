import { useState, useEffect, useMemo } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CSVImport } from '@/components/CSVImport';
import { DriverCard } from '@/components/admin/DriverCard';
import { CreateDriverCard } from '@/components/admin/CreateDriverCard';
import { DriverSearch } from '@/components/admin/DriverSearch';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Download, Upload } from 'lucide-react';
import type { Driver } from '@/hooks/useDrivers';

interface Team {
  id: string;
  name: string;
  logo_url: string | null;
}

const DriversAdmin = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('all-teams');
  const [selectedCountry, setSelectedCountry] = useState('all-countries');
  const [sortField, setSortField] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  const { toast } = useToast();

  useEffect(() => {
    fetchDrivers();
    fetchTeams();
  }, []);

  const fetchDrivers = async () => {
    try {
      const { data, error } = await supabase
        .from('drivers')
        .select(`
          *,
          teams (
            id,
            name,
            logo_url
          )
        `)
        .order('name');
      
      if (error) throw error;
      setDrivers(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch drivers",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTeams = async () => {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('id, name, logo_url')
        .order('name');
      
      if (error) throw error;
      setTeams(data || []);
    } catch (error) {
      console.error('Failed to fetch teams:', error);
    }
  };

  // Filter and sort drivers
  const filteredAndSortedDrivers = useMemo(() => {
    let filtered = drivers.filter(driver => {
      const matchesSearch = driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           driver.country.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTeam = selectedTeam === 'all-teams' || driver.team_id === selectedTeam;
      const matchesCountry = selectedCountry === 'all-countries' || driver.country === selectedCountry;
      
      return matchesSearch && matchesTeam && matchesCountry;
    });

    // Sort drivers
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortField) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'country':
          aValue = a.country.toLowerCase();
          bValue = b.country.toLowerCase();
          break;
        case 'number':
          aValue = a.number || 0;
          bValue = b.number || 0;
          break;
        case 'team':
          aValue = a.teams?.name?.toLowerCase() || '';
          bValue = b.teams?.name?.toLowerCase() || '';
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [drivers, searchTerm, selectedTeam, selectedCountry, sortField, sortDirection]);

  // Get unique countries for filter
  const countries = useMemo(() => {
    return Array.from(new Set(drivers.map(driver => driver.country))).sort();
  }, [drivers]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this driver? This action cannot be undone.')) return;
    
    try {
      const { error } = await supabase
        .from('drivers')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      toast({ title: "Success", description: "Driver deleted successfully" });
      fetchDrivers();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete driver",
        variant: "destructive"
      });
    }
  };

  const handleCSVImport = async (data: any[]) => {
    try {
      const { error } = await supabase
        .from('drivers')
        .insert(data.map(row => ({
          name: row.name || '',
          country: row.country || '',
          team_id: row.team_id || null,
          number: row.number ? parseInt(row.number) : null,
          headshot_url: row.headshot_url || null,
          bio: row.bio || null
        })));
      
      if (error) throw error;
      toast({ title: "Success", description: `${data.length} drivers imported successfully` });
      fetchDrivers();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to import drivers",
        variant: "destructive"
      });
    }
  };

  const exportDrivers = async () => {
    try {
      const csvContent = [
        ['name', 'country', 'team_id', 'number', 'headshot_url', 'bio'].join(','),
        ...drivers.map(driver => [
          `"${driver.name}"`,
          `"${driver.country}"`,
          driver.team_id || '',
          driver.number || '',
          driver.headshot_url || '',
          `"${driver.bio || ''}"`
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'drivers-export.csv';
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast({ title: "Success", description: "Drivers exported successfully" });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export drivers",
        variant: "destructive"
      });
    }
  };

  const sampleDriverData = {
    name: 'Max Verstappen',
    country: 'Netherlands',
    team_id: 'team-uuid-here',
    number: '1',
    headshot_url: 'https://example.com/headshot.jpg',
    bio: 'Formula 1 driver biography'
  };

  if (loading) return <AdminLayout><div>Loading...</div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Drivers Management
            </h2>
            <p className="text-muted-foreground mt-1">
              Manage your Formula 1 drivers with visual cards and inline editing
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportDrivers}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <DriverSearch
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedTeam={selectedTeam}
          onTeamChange={setSelectedTeam}
          selectedCountry={selectedCountry}
          onCountryChange={setSelectedCountry}
          teams={teams}
          countries={countries}
          sortField={sortField}
          onSortFieldChange={setSortField}
          sortDirection={sortDirection}
          onSortDirectionChange={setSortDirection}
          totalDrivers={drivers.length}
          filteredDrivers={filteredAndSortedDrivers.length}
        />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Drivers Grid */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <CardContent className="p-6">
                      <div className="animate-pulse space-y-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-16 h-16 bg-muted rounded-full"></div>
                          <div className="space-y-2">
                            <div className="h-4 bg-muted rounded w-24"></div>
                            <div className="h-3 bg-muted rounded w-16"></div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="h-3 bg-muted rounded"></div>
                          <div className="h-3 bg-muted rounded w-3/4"></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {/* Create Driver Card */}
                <CreateDriverCard teams={teams} onSuccess={fetchDrivers} />
                
                {/* Driver Cards */}
                {filteredAndSortedDrivers.map((driver) => (
                  <DriverCard
                    key={driver.id}
                    driver={driver}
                    teams={teams}
                    onUpdate={fetchDrivers}
                    onDelete={handleDelete}
                  />
                ))}
                
                {filteredAndSortedDrivers.length === 0 && !loading && (
                  <div className="col-span-full">
                    <Card className="border-dashed">
                      <CardContent className="p-12 text-center">
                        <div className="text-muted-foreground">
                          <h3 className="font-semibold text-lg mb-2">No drivers found</h3>
                          <p>Try adjusting your search or filters, or create a new driver.</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Sidebar with Import/Export */}
          <div className="space-y-6">
            <CSVImport 
              onImport={handleCSVImport}
              sampleData={sampleDriverData}
              entityName="driver"
            />
            
            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Drivers</span>
                  <span className="font-bold">{drivers.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">With Teams</span>
                  <span className="font-bold">
                    {drivers.filter(d => d.team_id).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Countries</span>
                  <span className="font-bold">{countries.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">With Photos</span>
                  <span className="font-bold">
                    {drivers.filter(d => d.headshot_url).length}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default DriversAdmin;