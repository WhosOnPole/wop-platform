import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Edit3, Save, X, Trash2, Trophy, MapPin, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

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

interface TeamCardProps {
  team: Team;
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

export const TeamCard = ({ team, onUpdate, onDelete }: TeamCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imageKey, setImageKey] = useState(Date.now());
  const [formData, setFormData] = useState({
    name: team.name,
    country: team.country,
    logo_url: team.logo_url || '',
    bio: team.bio || '',
    short_bio: team.short_bio || '',
    quote: team.quote || '',
    quote_author: team.quote_author || '',
    championship_standing: team.championship_standing?.toString() || ''
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleSave = async () => {
    setLoading(true);
    try {
      const updateData = {
        ...formData,
        championship_standing: formData.championship_standing ? parseInt(formData.championship_standing) : null
      };

      const { error } = await supabase
        .from('teams')
        .update(updateData)
        .eq('id', team.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Team updated successfully"
      });
      
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      queryClient.invalidateQueries({ queryKey: ["team", team.id] });
      
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update team",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: team.name,
      country: team.country,
      logo_url: team.logo_url || '',
      bio: team.bio || '',
      short_bio: team.short_bio || '',
      quote: team.quote || '',
      quote_author: team.quote_author || '',
      championship_standing: team.championship_standing?.toString() || ''
    });
    setIsEditing(false);
  };

  const handleImageUpload = async (file: File) => {
    try {
      const fileExt = file.name.split('.').pop();
      const timestamp = Date.now();
      const fileName = `${team.id}_${timestamp}.${fileExt}`;
      const filePath = `teams/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const imageUrlWithCacheBust = `${data.publicUrl}?v=${timestamp}`;
      setFormData({ ...formData, logo_url: imageUrlWithCacheBust });
      setImageKey(timestamp);
      
      toast({
        title: "Success",
        description: "Logo uploaded successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload logo",
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
              <h4 className="font-semibold text-primary">Editing Team</h4>
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

            {/* Logo upload section */}
            <div className="flex items-center space-x-4">
              <Avatar className="w-20 h-20">
                <AvatarImage 
                  key={imageKey} 
                  src={formData.logo_url} 
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
                  placeholder="Or paste logo URL"
                  value={formData.logo_url}
                  onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
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

            <div>
              <label className="text-sm font-medium text-muted-foreground">Championship Standing</label>
              <Input
                type="number"
                min="1"
                value={formData.championship_standing}
                onChange={(e) => setFormData({ ...formData, championship_standing: e.target.value })}
                className="mt-1"
                placeholder="Current position (1-10)"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Short Bio (Attention-grabbing)</label>
              <Textarea
                value={formData.short_bio}
                onChange={(e) => setFormData({ ...formData, short_bio: e.target.value })}
                rows={2}
                className="mt-1"
                placeholder="Brief, compelling introduction..."
              />
              <div className="text-xs text-muted-foreground mt-1">
                {formData.short_bio.length}/150 characters
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Full Bio (In-depth)</label>
              <Textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                rows={4}
                className="mt-1"
                placeholder="Detailed team history and achievements..."
              />
              <div className="text-xs text-muted-foreground mt-1">
                {formData.bio.length}/1000 characters
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Quote</label>
                <Textarea
                  value={formData.quote}
                  onChange={(e) => setFormData({ ...formData, quote: e.target.value })}
                  rows={2}
                  className="mt-1"
                  placeholder="Team motto or quote..."
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
                  src={team.logo_url || ''} 
                  alt={team.name} 
                />
                <AvatarFallback className="text-lg font-bold bg-gradient-primary text-primary-foreground">
                  {team.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-bold text-lg">{team.name}</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-3 h-3" />
                  <span>{getCountryFlag(team.country)} {team.country}</span>
                  {team.championship_standing && (
                    <Badge variant="outline" className="font-bold flex items-center gap-1">
                      <Trophy className="w-3 h-3" />
                      P{team.championship_standing}
                    </Badge>
                  )}
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
                onClick={() => onDelete(team.id)}
                className="hover:bg-destructive hover:text-destructive-foreground"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Bio */}
          {(team.short_bio || team.bio) && (
            <div className="text-sm text-muted-foreground">
              {team.short_bio || (team.bio && team.bio.length > 100 ? `${team.bio.substring(0, 100)}...` : team.bio)}
            </div>
          )}

          {/* Quote */}
          {team.quote && (
            <div className="p-3 bg-accent/10 rounded-lg border-l-4 border-accent">
              <div className="text-sm italic">"{team.quote}"</div>
              {team.quote_author && (
                <div className="text-xs text-muted-foreground mt-1">
                  — {team.quote_author}
                </div>
              )}
            </div>
          )}

          {/* Created date */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
            <Calendar className="w-3 h-3" />
            Added {new Date(team.created_at).toLocaleDateString()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};