import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Edit3, Save, X, Trash2, Upload, Star, Users, TrendingUp, Tags, ChevronDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { EntityTagManager } from '@/components/admin/EntityTagManager';

interface Driver {
  id: string;
  name: string;
  country: string;
  team_id: string | null;
  number: number | null;
  headshot_url: string | null;
  bio: string | null;
  short_bio: string | null;
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

interface DriverCardProps {
  driver: Driver;
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

export const DriverCard = ({ driver, teams, onUpdate, onDelete }: DriverCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imageKey, setImageKey] = useState(Date.now()); // For cache busting
  const [showTagManager, setShowTagManager] = useState(false);
  const [formData, setFormData] = useState({
    name: driver.name,
    country: driver.country,
    team_id: driver.team_id || 'no-team',
    number: driver.number?.toString() || '',
    headshot_url: driver.headshot_url || '',
    bio: driver.bio || '',
    short_bio: driver.short_bio || ''
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleSave = async () => {
    setLoading(true);
    try {
      const updateData = {
        ...formData,
        team_id: formData.team_id === 'no-team' ? null : formData.team_id,
        number: formData.number ? parseInt(formData.number) : null
      };

      const { error } = await supabase
        .from('drivers')
        .update(updateData)
        .eq('id', driver.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Driver updated successfully"
      });
      
      // Invalidate and refetch driver data
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
      queryClient.invalidateQueries({ queryKey: ["driver", driver.id] });
      
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update driver",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: driver.name,
      country: driver.country,
      team_id: driver.team_id || 'no-team',
      number: driver.number?.toString() || '',
      headshot_url: driver.headshot_url || '',
      bio: driver.bio || '',
      short_bio: driver.short_bio || ''
    });
    setIsEditing(false);
  };

  const handleImageUpload = async (file: File) => {
    try {
      const fileExt = file.name.split('.').pop();
      const timestamp = Date.now();
      const fileName = `${driver.id}_${timestamp}.${fileExt}`;
      const filePath = `drivers/${fileName}`;

      // Upload to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL with cache busting parameter
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const imageUrlWithCacheBust = `${data.publicUrl}?v=${timestamp}`;
      setFormData({ ...formData, headshot_url: imageUrlWithCacheBust });
      setImageKey(timestamp); // Update image key to force re-render
      
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

  const selectedTeam = teams.find(t => t.id === formData.team_id);

  if (isEditing) {
    return (
      <Card className="overflow-hidden transition-all duration-300 border-2 border-primary/20 shadow-racing">
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Header with save/cancel */}
            <div className="flex justify-between items-center">
              <h4 className="font-semibold text-primary">Editing Driver</h4>
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
                  src={formData.headshot_url} 
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
                  value={formData.headshot_url}
                  onChange={(e) => setFormData({ ...formData, headshot_url: e.target.value })}
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
                <label className="text-sm font-medium text-muted-foreground">Number</label>
                <Input
                  type="number"
                  value={formData.number}
                  onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                  className="mt-1"
                />
              </div>
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
                placeholder="Detailed driver biography..."
              />
              <div className="text-xs text-muted-foreground mt-1">
                {formData.bio.length}/1000 characters
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
                  src={driver.headshot_url || ''} 
                  alt={driver.name} 
                />
                <AvatarFallback className="text-lg font-bold bg-gradient-primary text-primary-foreground">
                  {driver.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-bold text-lg">{driver.name}</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{getCountryFlag(driver.country)} {driver.country}</span>
                  {driver.number && (
                    <Badge variant="outline" className="font-bold">
                      #{driver.number}
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
                onClick={() => onDelete(driver.id)}
                className="hover:bg-destructive hover:text-destructive-foreground"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Team info */}
          {driver.teams && (
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
              {driver.teams.logo_url && (
                <img src={driver.teams.logo_url} alt={driver.teams.name} className="w-6 h-6" />
              )}
              <span className="font-medium">{driver.teams.name}</span>
            </div>
          )}

          {/* Bio */}
          {(driver.short_bio || driver.bio) && (
            <div className="text-sm text-muted-foreground">
              {driver.short_bio || (driver.bio && driver.bio.length > 100 ? `${driver.bio.substring(0, 100)}...` : driver.bio)}
            </div>
          )}

          {/* Stats placeholder - could be connected to real data */}
          <div className="grid grid-cols-3 gap-4 pt-2 border-t">
            <div className="text-center">
              <div className="flex items-center justify-center text-primary mb-1">
                <Users className="w-4 h-4" />
              </div>
              <div className="text-sm font-bold">1.2K</div>
              <div className="text-xs text-muted-foreground">Fans</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center text-accent mb-1">
                <Star className="w-4 h-4" />
              </div>
              <div className="text-sm font-bold">4.7</div>
              <div className="text-xs text-muted-foreground">Rating</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center text-secondary mb-1">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div className="text-sm font-bold">+12%</div>
              <div className="text-xs text-muted-foreground">Growth</div>
            </div>
          </div>

          {/* Tags Management Section */}
          <Collapsible open={showTagManager} onOpenChange={setShowTagManager}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                <div className="flex items-center gap-2">
                  <Tags className="w-4 h-4" />
                  Manage Tags
                </div>
                <ChevronDown className="w-4 h-4" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4">
              <EntityTagManager
                entityId={driver.id}
                entityType="driver"
                entityName={driver.name}
              />
            </CollapsibleContent>
          </Collapsible>
        </div>
      </CardContent>
    </Card>
  );
};