import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CSVImport } from '@/components/CSVImport';
import { TeamCard } from '@/components/admin/TeamCard';
import { EntityTagManager } from '@/components/admin/EntityTagManager';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Pencil, Trash2, Plus, Tags, ChevronDown } from 'lucide-react';

interface Team {
  id: string;
  name: string;
  country: string;
  logo_url: string | null;
  bio: string | null;
  short_bio: string | null;
  quote: string | null;
  quote_author: string | null;
  championship_standing: number | null;
  created_at: string;
}

const TeamsAdmin = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [expandedTagManagers, setExpandedTagManagers] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    name: '',
    country: '',
    logo_url: '',
    bio: '',
    short_bio: '',
    championship_standing: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setTeams(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch teams",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const submitData = {
        name: formData.name,
        country: formData.country,
        logo_url: formData.logo_url || null,
        bio: formData.bio || null,
        short_bio: formData.short_bio || null,
        championship_standing: formData.championship_standing ? parseInt(formData.championship_standing) : null
      };

      if (editingTeam) {
        const { error } = await supabase
          .from('teams')
          .update(submitData)
          .eq('id', editingTeam.id);
        if (error) throw error;
        toast({ title: "Success", description: "Team updated successfully" });
      } else {
        const { error } = await supabase
          .from('teams')
          .insert([submitData]);
        if (error) throw error;
        toast({ title: "Success", description: "Team created successfully" });
      }
      
      setIsDialogOpen(false);
      setEditingTeam(null);
      setFormData({ name: '', country: '', logo_url: '', bio: '', short_bio: '', championship_standing: '' });
      fetchTeams();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save team",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (team: Team) => {
    setEditingTeam(team);
    setFormData({
      name: team.name,
      country: team.country,
      logo_url: team.logo_url || '',
      bio: team.bio || '',
      short_bio: team.short_bio || '',
      championship_standing: team.championship_standing?.toString() || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this team?')) return;
    
    try {
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      toast({ title: "Success", description: "Team deleted successfully" });
      fetchTeams();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete team",
        variant: "destructive"
      });
    }
  };

  const handleCSVImport = async (data: any[]) => {
    const { error } = await supabase
      .from('teams')
      .insert(data.map(row => ({
        name: row.name || '',
        country: row.country || '',
        logo_url: row.logo_url || null,
        bio: row.bio || null,
        championship_standing: row.championship_standing ? parseInt(row.championship_standing) : null
      })));
    
    if (error) throw error;
    fetchTeams();
  };

  const sampleTeamData = {
    name: 'Red Bull Racing',
    country: 'Austria',
    logo_url: 'https://example.com/logo.png',
    bio: 'A description of the team and their history',
    championship_standing: '1'
  };

  if (loading) return <AdminLayout><div>Loading...</div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold">Teams Management</h2>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingTeam(null);
                setFormData({ name: '', country: '', logo_url: '', bio: '', short_bio: '', championship_standing: '' });
              }}>
                <Plus className="w-4 h-4 mr-2" />
                Add Team
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingTeam ? 'Edit Team' : 'Add New Team'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="logo_url">Logo URL</Label>
                  <Input
                    id="logo_url"
                    value={formData.logo_url}
                    onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="short_bio">Short Bio (Attention-grabbing)</Label>
                  <Textarea
                    id="short_bio"
                    value={formData.short_bio}
                    onChange={(e) => setFormData({ ...formData, short_bio: e.target.value })}
                    placeholder="Brief, compelling introduction..."
                    rows={2}
                  />
                </div>
                <div>
                  <Label htmlFor="bio">Full Bio (In-depth)</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Detailed team history and achievements..."
                    rows={4}
                  />
                </div>
                <div>
                  <Label htmlFor="championship_standing">Championship Standing</Label>
                  <Input
                    id="championship_standing"
                    type="number"
                    min="1"
                    value={formData.championship_standing}
                    onChange={(e) => setFormData({ ...formData, championship_standing: e.target.value })}
                    placeholder="Current championship position"
                  />
                </div>
                <Button type="submit" className="w-full">
                  {editingTeam ? 'Update' : 'Create'} Team
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Tabs defaultValue="gallery" className="space-y-4">
              <TabsList>
                <TabsTrigger value="gallery">Gallery View</TabsTrigger>
                <TabsTrigger value="table">Table View</TabsTrigger>
              </TabsList>
              
              <TabsContent value="gallery">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {teams.map((team) => (
                    <TeamCard
                      key={team.id}
                      team={team as any}
                      onUpdate={fetchTeams}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="table">
                <Card>
                  <CardHeader>
                    <CardTitle>Teams Table</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Country</TableHead>
                          <TableHead>Standing</TableHead>
                          <TableHead>Logo</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {teams.map((team) => (
                          <TableRow key={team.id}>
                            <TableCell className="font-medium">{team.name}</TableCell>
                            <TableCell>{team.country}</TableCell>
                            <TableCell>
                              {team.championship_standing ? `P${team.championship_standing}` : '-'}
                            </TableCell>
                            <TableCell>
                              {team.logo_url && (
                                <img src={team.logo_url} alt={team.name} className="w-8 h-8 object-contain" />
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEdit(team)}
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDelete(team.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const newExpanded = new Set(expandedTagManagers);
                                    if (newExpanded.has(team.id)) {
                                      newExpanded.delete(team.id);
                                    } else {
                                      newExpanded.add(team.id);
                                    }
                                    setExpandedTagManagers(newExpanded);
                                  }}
                                >
                                  <Tags className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                        {/* Tag Manager Rows */}
                        {teams.map((team) => 
                          expandedTagManagers.has(team.id) && (
                            <TableRow key={`${team.id}-tags`}>
                              <TableCell colSpan={5} className="p-4 bg-muted/20">
                                <EntityTagManager
                                  entityId={team.id}
                                  entityType="team"
                                  entityName={team.name}
                                />
                              </TableCell>
                            </TableRow>
                          )
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
          
          <div>
            <CSVImport 
              onImport={handleCSVImport}
              sampleData={sampleTeamData}
              entityName="team"
            />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default TeamsAdmin;