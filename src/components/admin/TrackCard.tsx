import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Edit3, Save, X, Trash2, MapPin, Ruler, Calendar, Mountain } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

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

interface TrackCardProps {
  track: Track;
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

export const TrackCard = ({ track, onUpdate, onDelete }: TrackCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imageKey, setImageKey] = useState(Date.now());
  const [formData, setFormData] = useState({
    name: track.name,
    country: track.country,
    length_km: track.length_km?.toString() || '',
    image_url: track.image_url || '',
    description: track.description || '',
    quote: track.quote || '',
    quote_author: track.quote_author || ''
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleSave = async () => {
    setLoading(true);
    try {
      const updateData = {
        ...formData,
        length_km: formData.length_km ? parseFloat(formData.length_km) : null
      };

      const { error } = await supabase
        .from('tracks')
        .update(updateData)
        .eq('id', track.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Track updated successfully"
      });
      
      queryClient.invalidateQueries({ queryKey: ["tracks"] });
      queryClient.invalidateQueries({ queryKey: ["track", track.id] });
      
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update track",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: track.name,
      country: track.country,
      length_km: track.length_km?.toString() || '',
      image_url: track.image_url || '',
      description: track.description || '',
      quote: track.quote || '',
      quote_author: track.quote_author || ''
    });
    setIsEditing(false);
  };

  const handleImageUpload = async (file: File) => {
    try {
      const fileExt = file.name.split('.').pop();
      const timestamp = Date.now();
      const fileName = `${track.id}_${timestamp}.${fileExt}`;
      const filePath = `tracks/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const imageUrlWithCacheBust = `${data.publicUrl}?v=${timestamp}`;
      setFormData({ ...formData, image_url: imageUrlWithCacheBust });
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
              <h4 className="font-semibold text-primary">Editing Track</h4>
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
            <div className="space-y-4">
              {formData.image_url && (
                <div className="w-full h-32 overflow-hidden rounded-lg">
                  <img 
                    key={imageKey} 
                    src={formData.image_url} 
                    alt={formData.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file);
                  }}
                />
                <Input
                  placeholder="Or paste image URL"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
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
              <label className="text-sm font-medium text-muted-foreground">Length (km)</label>
              <Input
                type="number"
                step="0.001"
                min="0"
                value={formData.length_km}
                onChange={(e) => setFormData({ ...formData, length_km: e.target.value })}
                className="mt-1"
                placeholder="Circuit length in kilometers"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="mt-1"
                placeholder="Track history and characteristics..."
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
                  placeholder="Famous quote about this track..."
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
      <CardContent className="p-0">
        {/* Track image */}
        {track.image_url && (
          <div className="w-full h-48 overflow-hidden">
            <img 
              key={imageKey} 
              src={track.image_url} 
              alt={track.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}
        
        <div className="p-6 space-y-4">
          {/* Header with actions */}
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-bold text-lg flex items-center gap-2">
                {track.name}
                <Mountain className="w-4 h-4 text-accent" />
              </h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-3 h-3" />
                <span>{getCountryFlag(track.country)} {track.country}</span>
                {track.length_km && (
                  <Badge variant="outline" className="font-bold flex items-center gap-1">
                    <Ruler className="w-3 h-3" />
                    {track.length_km} km
                  </Badge>
                )}
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
                onClick={() => onDelete(track.id)}
                className="hover:bg-destructive hover:text-destructive-foreground"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Description */}
          {track.description && (
            <div className="text-sm text-muted-foreground">
              {track.description.length > 100 ? `${track.description.substring(0, 100)}...` : track.description}
            </div>
          )}

          {/* Quote */}
          {track.quote && (
            <div className="p-3 bg-accent/10 rounded-lg border-l-4 border-accent">
              <div className="text-sm italic">"{track.quote}"</div>
              {track.quote_author && (
                <div className="text-xs text-muted-foreground mt-1">
                  — {track.quote_author}
                </div>
              )}
            </div>
          )}

          {/* Created date */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
            <Calendar className="w-3 h-3" />
            Added {new Date(track.created_at).toLocaleDateString()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};