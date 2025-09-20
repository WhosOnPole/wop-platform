import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Edit3, Save, X, Trash2, Crown, Calendar, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface TeamPrincipal {
  id: string;
  name: string;
  country: string;
  team_id: string | null;
  photo_url: string | null;
  bio: string | null;
  quote: string | null;
  quote_author: string | null;
  years_with_team: number | null;
  created_at: string;
  teams?: { 
    id: string;
    name: string; 
    logo_url: string | null;
  };
}

interface Team {
  id: string;
  name: string;
  logo_url: string | null;
}

interface TeamPrincipalCardProps {
  teamPrincipal: TeamPrincipal;
  teams: Team[];
  onUpdate: () => void;
  onDelete: (id: string) => void;
}

// Country code to flag emoji mapping
const getCountryFlag = (country: string): string => {
  const flagMap: { [key: string]: string } = {
    'Netherlands': '🇳🇱',
    'United Kingdom': '🇬🇧',
    'Monaco': '🇲🇨',
    'Spain': '🇪🇸',
    'Mexico': '🇲🇽',
    'Australia': '🇦🇺',
    'Canada': '🇨🇦',
    'France': '🇫🇷',
    'Germany': '🇩🇪',
    'Japan': '🇯🇵',
    'Finland': '🇫🇮',
    'Denmark': '🇩🇰',
    'Thailand': '🇹🇭',
    'China': '🇨🇳',
    'USA': '🇺🇸',
    'Brazil': '🇧🇷',
    'Italy': '🇮🇹',
    'Belgium': '🇧🇪',
    'Austria': '🇦🇹',
    'Switzerland': '🇨🇭'
  };
  return flagMap[country] || '🏁';
};

export const TeamPrincipalCard = ({ teamPrincipal, teams, onUpdate, onDelete }: TeamPrincipalCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imageKey, setImageKey] = useState(Date.now());
  const [formData, setFormData] = useState({
    name: teamPrincipal.name,
    country: teamPrincipal.country,
    team_id: teamPrincipal.team_id || 'no-team',
    photo_url: teamPrincipal.photo_url || '',
    bio: teamPrincipal.bio || '',
    quote: teamPrincipal.quote || '',
    quote_author: teamPrincipal.quote_author || '',
    years_with_team: teamPrincipal.years_with_team?.toString() || ''
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleSave = async () => {
    setLoading(true);
    try {
      const updateData = {
        ...formData,
        team_id: formData.team_id === 'no-team' ? null : formData.team_id,
        years_with_team: formData.years_with_team ? parseInt(formData.years_with_team) : null
      };

      const { error } = await supabase
        .from('team_principals')
        .update(updateData)
        .eq('id', teamPrincipal.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Team principal updated successfully"
      });
      
      queryClient.invalidateQueries({ queryKey: ["teamPrincipals"] });
      queryClient.invalidateQueries({ queryKey: ["teamPrincipal", teamPrincipal.id] });
      
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update team principal",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: teamPrincipal.name,
      country: teamPrincipal.country,
      team_id: teamPrincipal.team_id || 'no-team',
      photo_url: teamPrincipal.photo_url || '',
      bio: teamPrincipal.bio || '',
      quote: teamPrincipal.quote || '',
      quote_author: teamPrincipal.quote_author || '',
      years_with_team: teamPrincipal.years_with_team?.toString() || ''
    });
    setIsEditing(false);
  };

  const handleImageUpload = async (file: File) => {
    try {
      const fileExt = file.name.split('.').pop();
      const timestamp = Date.now();
      const fileName = `${teamPrincipal.id}_${timestamp}.${fileExt}`;
      const filePath = `team_principals/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const imageUrlWithCacheBust = `${data.publicUrl}?v=${timestamp}`;
      setFormData({ ...formData, photo_url: imageUrlWithCacheBust });
      setImageKey(timestamp);
      
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

  if (isEditing) {
    return (
      <Card className="overflow-hidden transition-all duration-300 border-2 border-primary/20 shadow-racing">
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Header with save/cancel */}
            <div className="flex justify-between items-center">
              <h4 className="font-semibold text-primary">Editing Team Principal</h4>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  onClick={handleSave} 
                  disabled={loading}
                  className="bg-gradient-primary hover:opacity-90"
                >
                  <Save className="w-4 h-4 mr-1" />
                  Save
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
                <AvatarImage 
                  key={imageKey} 
                  src={formData.photo_url} 
                  alt={formData.name} 
                />
                <AvatarFallback className="text-lg font-bold bg-gradient-primary text-primary-foreground">
                  {formData.name.charAt(0)}
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
                <label className="text-sm font-medium text-muted-foreground">Name</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Country</label>
                <Input
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Team</label>
                <Select value={formData.team_id} onValueChange={(value) => setFormData({ ...formData, team_id: value === 'no-team' ? '' : value })}>
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
    <Card className="overflow-hidden hover:shadow-racing transition-all duration-300 group">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header with actions */}
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-3">
              <Avatar className="w-16 h-16">
                <AvatarImage 
                  key={imageKey} 
                  src={teamPrincipal.photo_url || ''} 
                  alt={teamPrincipal.name} 
                />
                <AvatarFallback className="text-lg font-bold bg-gradient-primary text-primary-foreground">
                  {teamPrincipal.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-bold text-lg flex items-center gap-2">
                  {teamPrincipal.name}
                  <Crown className="w-4 h-4 text-accent" />
                </h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-3 h-3" />
                  <span>{getCountryFlag(teamPrincipal.country)} {teamPrincipal.country}</span>
                </div>
              </div>
            </div>
            
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsEditing(true)}
                className="hover:bg-accent hover:text-accent-foreground"
              >
                <Edit3 className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onDelete(teamPrincipal.id)}
                className="hover:bg-destructive hover:text-destructive-foreground"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Team info */}
          {teamPrincipal.teams && (
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                {teamPrincipal.teams.logo_url && (
                  <img src={teamPrincipal.teams.logo_url} alt={teamPrincipal.teams.name} className="w-6 h-6" />
                )}
                <span className="font-medium">{teamPrincipal.teams.name}</span>
              </div>
              {teamPrincipal.years_with_team && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {teamPrincipal.years_with_team}y
                </Badge>
              )}
            </div>
          )}

          {/* Bio */}
          {teamPrincipal.bio && (
            <div className="text-sm text-muted-foreground">
              {teamPrincipal.bio.length > 100 ? `${teamPrincipal.bio.substring(0, 100)}...` : teamPrincipal.bio}
            </div>
          )}

          {/* Quote */}
          {teamPrincipal.quote && (
            <div className="p-3 bg-accent/10 rounded-lg border-l-4 border-accent">
              <div className="text-sm italic">"{teamPrincipal.quote}"</div>
              {teamPrincipal.quote_author && (
                <div className="text-xs text-muted-foreground mt-1">
                  — {teamPrincipal.quote_author}
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};