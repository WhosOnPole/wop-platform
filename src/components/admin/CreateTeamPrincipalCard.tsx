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

interface CreateTeamPrincipalCardProps {
  teams: Team[];
  onSuccess: () => void;
}

export const CreateTeamPrincipalCard = ({ teams, onSuccess }: CreateTeamPrincipalCardProps) => {
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    country: '',
    team_id: 'no-team',
    photo_url: '',
    bio: '',
    quote: '',
    quote_author: '',
    years_with_team: ''
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
        years_with_team: formData.years_with_team ? parseInt(formData.years_with_team) : null
      };

      const { error } = await supabase
        .from('team_principals')
        .insert([createData]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Team principal created successfully"
      });
      
      setFormData({
        name: '',
        country: '',
        team_id: 'no-team',
        photo_url: '',
        bio: '',
        quote: '',
        quote_author: '',
        years_with_team: ''
      });
      setIsCreating(false);
      onSuccess();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create team principal",
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
      photo_url: '',
      bio: '',
      quote: '',
      quote_author: '',
      years_with_team: ''
    });
    setIsCreating(false);
  };

  const handleImageUpload = async (file: File) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `team_principals/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setFormData({ ...formData, photo_url: data.publicUrl });
      
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
              <h4 className="font-semibold text-primary">Create New Team Principal</h4>
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
                <AvatarImage src={formData.photo_url} alt={formData.name || 'New team principal'} />
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
                  value={formData.photo_url}
                  onChange={(e) => setFormData({ ...formData, photo_url: e.target.value })}
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
                  placeholder="Team principal name"
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
                <label className="text-sm font-medium text-muted-foreground">Years with Team</label>
                <Input
                  type="number"
                  value={formData.years_with_team}
                  onChange={(e) => setFormData({ ...formData, years_with_team: e.target.value })}
                  className="mt-1"
                  placeholder="Years"
                  min="0"
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
                placeholder="Team principal biography..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Quote</label>
                <Textarea
                  value={formData.quote}
                  onChange={(e) => setFormData({ ...formData, quote: e.target.value })}
                  rows={2}
                  className="mt-1"
                  placeholder="Inspirational quote..."
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Quote Author</label>
                <Input
                  value={formData.quote_author}
                  onChange={(e) => setFormData({ ...formData, quote_author: e.target.value })}
                  className="mt-1"
                  placeholder="Who said this quote?"
                />
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
            <h3 className="font-semibold text-lg">Add New Team Principal</h3>
            <p className="text-sm text-muted-foreground">
              Click to create a new team principal profile
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};