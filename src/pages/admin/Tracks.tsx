import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CSVImport } from '@/components/CSVImport';
import { TrackCard } from '@/components/admin/TrackCard';
import { EntityTagManager } from '@/components/admin/EntityTagManager';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Pencil, Trash2, Plus, Tags } from 'lucide-react';

interface Track {
  id: string;
  name: string;
  country: string;
  length_km: number | null;
  image_url: string | null;
  description: string | null;
  quote: string | null;
  quote_author: string | null;
  created_at: string;
}

const TracksAdmin = () => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTrack, setEditingTrack] = useState<Track | null>(null);
  const [expandedTagManagers, setExpandedTagManagers] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    name: '',
    country: '',
    length_km: '',
    image_url: '',
    description: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchTracks();
  }, []);

  const fetchTracks = async () => {
    try {
      const { data, error } = await supabase
        .from('tracks')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setTracks(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch tracks",
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
        ...formData,
        length_km: formData.length_km ? parseFloat(formData.length_km) : null
      };

      if (editingTrack) {
        const { error } = await supabase
          .from('tracks')
          .update(submitData)
          .eq('id', editingTrack.id);
        if (error) throw error;
        toast({ title: "Success", description: "Track updated successfully" });
      } else {
        const { error } = await supabase
          .from('tracks')
          .insert([submitData]);
        if (error) throw error;
        toast({ title: "Success", description: "Track created successfully" });
      }
      
      setIsDialogOpen(false);
      setEditingTrack(null);
      setFormData({ name: '', country: '', length_km: '', image_url: '', description: '' });
      fetchTracks();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save track",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (track: Track) => {
    setEditingTrack(track);
    setFormData({
      name: track.name,
      country: track.country,
      length_km: track.length_km?.toString() || '',
      image_url: track.image_url || '',
      description: track.description || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this track?')) return;
    
    try {
      const { error } = await supabase
        .from('tracks')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      toast({ title: "Success", description: "Track deleted successfully" });
      fetchTracks();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete track",
        variant: "destructive"
      });
    }
  };

  const handleCSVImport = async (data: any[]) => {
    const { error } = await supabase
      .from('tracks')
      .insert(data.map(row => ({
        name: row.name || '',
        country: row.country || '',
        length_km: row.length_km ? parseFloat(row.length_km) : null,
        image_url: row.image_url || null,
        description: row.description || null
      })));
    
    if (error) throw error;
    fetchTracks();
  };

  const sampleTrackData = {
    name: 'Monaco Grand Prix',
    country: 'Monaco',
    length_km: '3.337',
    image_url: 'https://example.com/track.jpg',
    description: 'Famous street circuit in Monte Carlo'
  };

  if (loading) return <AdminLayout><div>Loading...</div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h2 className="text-3xl font-bold">Tracks Management</h2>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingTrack(null);
                setFormData({ name: '', country: '', length_km: '', image_url: '', description: '' });
              }}>
                <Plus className="w-4 h-4 mr-2" />
                Add Track
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingTrack ? 'Edit Track' : 'Add New Track'}</DialogTitle>
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
                  <Label htmlFor="length_km">Length (km)</Label>
                  <Input
                    id="length_km"
                    type="number"
                    step="0.001"
                    value={formData.length_km}
                    onChange={(e) => setFormData({ ...formData, length_km: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="image_url">Image URL</Label>
                  <Input
                    id="image_url"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <Button type="submit" className="w-full">
                  {editingTrack ? 'Update' : 'Create'} Track
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
                  {tracks.map((track) => (
                    <TrackCard
                      key={track.id}
                      track={track}
                      onUpdate={fetchTracks}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="table">
                <Card>
                  <CardHeader>
                    <CardTitle>Tracks Table</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Country</TableHead>
                          <TableHead>Length (km)</TableHead>
                          <TableHead>Image</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tracks.map((track) => (
                          <TableRow key={track.id}>
                            <TableCell className="font-medium">{track.name}</TableCell>
                            <TableCell>{track.country}</TableCell>
                            <TableCell>{track.length_km ? `${track.length_km} km` : '-'}</TableCell>
                            <TableCell>
                              {track.image_url && (
                                <img src={track.image_url} alt={track.name} className="w-16 h-10 object-cover rounded" />
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEdit(track)}
                                >
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDelete(track.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const newExpanded = new Set(expandedTagManagers);
                                    if (newExpanded.has(track.id)) {
                                      newExpanded.delete(track.id);
                                    } else {
                                      newExpanded.add(track.id);
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
                        {tracks.map((track) => 
                          expandedTagManagers.has(track.id) && (
                            <TableRow key={`${track.id}-tags`}>
                              <TableCell colSpan={5} className="p-4 bg-muted/20">
                                <EntityTagManager
                                  entityId={track.id}
                                  entityType="track"
                                  entityName={track.name}
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
              sampleData={sampleTrackData}
              entityName="track"
            />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default TracksAdmin;