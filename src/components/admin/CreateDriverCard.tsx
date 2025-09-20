import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus, Save, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Team {
  id: string;
  name: string;
  logo_url: string | null;
}

interface CreateDriverCardProps {
  teams: Team[];
  onSuccess: () => void;
}

export const CreateDriverCard = ({ teams, onSuccess }: CreateDriverCardProps) => {
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    country: '',
    team_id: 'no-team',
    number: '',
    headshot_url: '',
    bio: ''
  });
  const { toast } = useToast();

  const handleCreate = async () => {
    if (!formData.name || !formData.country) {
      toast({
        title: "Error",
        description: "Name and country are required",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const createData = {
        ...formData,
        team_id: formData.team_id === 'no-team' ? null : formData.team_id,
        number: formData.number ? parseInt(formData.number) : null
      };

      const { error } = await supabase
        .from('drivers')
        .insert([createData]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Driver created successfully"
      });
      
      setFormData({
        name: '',
        country: '',
        team_id: 'no-team',
        number: '',
        headshot_url: '',
        bio: ''
      });
      setIsCreating(false);
      onSuccess();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create driver",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: '',
      country: '',
      team_id: 'no-team',
      number: '',
      headshot_url: '',
      bio: ''
    });
    setIsCreating(false);
  };

  const handleImageUpload = async (file: File) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `drivers/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setFormData({ ...formData, headshot_url: data.publicUrl });
      
      toast({
        title: "Success",
        description: "Image uploaded successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive"
      });
    }
  };

  if (isCreating) {
    return (
      <Card className="overflow-hidden border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5">
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex justify-between items-center">
              <h4 className="font-semibold text-primary">Create New Driver</h4>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  onClick={handleCreate} 
                  disabled={loading}
                  className="bg-gradient-primary hover:opacity-90"
                >
                  <Save className="w-4 h-4 mr-1" />
                  Create
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={handleCancel}
                  disabled={loading}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Image upload section */}
            <div className="flex items-center space-x-4">
              <Avatar className="w-20 h-20">
                <AvatarImage src={formData.headshot_url} alt={formData.name || 'New driver'} />
                <AvatarFallback className="text-lg font-bold bg-gradient-primary text-primary-foreground">
                  {formData.name ? formData.name.charAt(0) : '?'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file);
                  }}
                  className="mb-2"
                />
                <Input
                  placeholder="Or paste image URL"
                  value={formData.headshot_url}
                  onChange={(e) => setFormData({ ...formData, headshot_url: e.target.value })}
                />
              </div>
            </div>

            {/* Form fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Name *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1"
                  placeholder="Driver name"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Country *</label>
                <Input
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="mt-1"
                  placeholder="Country"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Team</label>
                <Select value={formData.team_id} onValueChange={(value) => setFormData({ ...formData, team_id: value })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select team" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no-team">No team</SelectItem>
                    {teams.map((team) => (
                      <SelectItem key={team.id} value={team.id}>
                        <div className="flex items-center gap-2">
                          {team.logo_url && (
                            <img src={team.logo_url} alt={team.name} className="w-4 h-4" />
                          )}
                          {team.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Number</label>
                <Input
                  type="number"
                  value={formData.number}
                  onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                  className="mt-1"
                  placeholder="Racing number"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Bio</label>
              <Textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                rows={3}
                className="mt-1"
                placeholder="Driver biography..."
              />
              <div className="text-xs text-muted-foreground mt-1">
                {formData.bio.length}/500 characters
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className="overflow-hidden border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5 hover:border-primary/50 transition-all duration-300 cursor-pointer group"
      onClick={() => setIsCreating(true)}
    >
      <CardContent className="p-6">
        <div className="flex flex-col items-center justify-center text-center space-y-4 py-8">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
            <Plus className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Add New Driver</h3>
            <p className="text-sm text-muted-foreground">
              Click to create a new driver profile
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};