import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Search, Save, GripVertical, Share, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Navigation from '@/components/Navigation';
import PageHeader from '@/components/PageHeader';

interface Driver {
  id: string;
  name: string;
  country: string;
  number: number | null;
  headshot_url: string | null;
  teams?: { name: string };
}

interface GridItem {
  driver_id: string;
  rank: number;
  reasoning?: string;
  driver?: Driver;
}

interface SortableDriverProps {
  item: GridItem;
  onReasoningChange: (driverId: string, reasoning: string) => void;
}

const SortableDriver = ({ item, onReasoningChange }: SortableDriverProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: item.driver_id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="flex items-center gap-4 p-4 bg-card border rounded-lg"
    >
      <div {...listeners} className="cursor-grab active:cursor-grabbing">
        <GripVertical className="w-5 h-5 text-muted-foreground" />
      </div>
      
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="w-8 h-8 flex items-center justify-center">
            {item.rank}
          </Badge>
          
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center overflow-hidden">
            {item.driver?.headshot_url ? (
              <img 
                src={item.driver.headshot_url} 
                alt={item.driver.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center text-xs font-bold">
                {item.driver?.name.charAt(0)}
              </div>
            )}
          </div>
          
          <div>
            <h3 className="font-semibold">{item.driver?.name}</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {item.driver?.number && (
                <span>#{item.driver.number}</span>
              )}
              <span>{item.driver?.country}</span>
            </div>
          </div>
        </div>
        
        <div className="flex-1 max-w-xs ml-4">
          <Input
            placeholder={`Why rank ${item.driver?.name} here?`}
            value={item.reasoning || ''}
            onChange={(e) => onReasoningChange(item.driver_id, e.target.value)}
            className="text-sm"
          />
        </div>
      </div>
    </div>
  );
};

const MyGrid = () => {
  const { user } = useAuth();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [gridItems, setGridItems] = useState<GridItem[]>([]);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [existingGridId, setExistingGridId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<{ username: string } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchDrivers();
    if (user) {
      fetchUserProfile();
      fetchExistingGrid();
    }
  }, [user]);

  const fetchDrivers = async () => {
    const { data, error } = await supabase
      .from('drivers')
      .select(`
        id, name, country, number, headshot_url,
        teams!drivers_team_id_fkey(name)
      `)
      .order('name');

    if (error) {
      toast.error('Failed to fetch drivers');
      return;
    }

    setDrivers(data || []);
  };

  const fetchUserProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('username')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!error && data) {
      setUserProfile(data);
    }
  };

  const fetchExistingGrid = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('grids')
      .select('id, items, note')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!error && data) {
      setExistingGridId(data.id);
      setNote(data.note || '');
      
      // Load grid items with driver details
      const items = Array.isArray(data.items) ? data.items : [];
      if (items.length > 0) {
        const driverIds = items.map((item: any) => item.driver_id);
        const { data: drivers } = await supabase
          .from('drivers')
          .select(`
            id, name, country, number, headshot_url,
            teams!drivers_team_id_fkey(name)
          `)
          .in('id', driverIds);

        const itemsWithDrivers = items.map((item: any) => ({
          ...item,
          driver: drivers?.find(d => d.id === item.driver_id)
        }));

        setGridItems(itemsWithDrivers);
      }
    }
  };

  const filteredDrivers = drivers.filter(driver =>
    driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.country.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addDriverToGrid = (driver: Driver) => {
    if (gridItems.length >= 10) {
      toast.error('Maximum 10 drivers allowed in grid');
      return;
    }

    if (gridItems.some(item => item.driver_id === driver.id)) {
      toast.error('Driver already in grid');
      return;
    }

    const newItem: GridItem = {
      driver_id: driver.id,
      rank: gridItems.length + 1,
      reasoning: '',
      driver,
    };

    setGridItems([...gridItems, newItem]);
  };

  const removeDriverFromGrid = (driverId: string) => {
    const updatedItems = gridItems
      .filter(item => item.driver_id !== driverId)
      .map((item, index) => ({ ...item, rank: index + 1 }));
    setGridItems(updatedItems);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setGridItems((items) => {
        const oldIndex = items.findIndex((item) => item.driver_id === active.id);
        const newIndex = items.findIndex((item) => item.driver_id === over.id);

        const newItems = arrayMove(items, oldIndex, newIndex);
        return newItems.map((item, index) => ({ ...item, rank: index + 1 }));
      });
    }
  };

  const handleReasoningChange = (driverId: string, reasoning: string) => {
    setGridItems(items =>
      items.map(item =>
        item.driver_id === driverId ? { ...item, reasoning } : item
      )
    );
  };

  const saveGrid = async () => {
    if (!user) {
      toast.error('Please sign in to save your grid');
      return;
    }

    if (gridItems.length === 0) {
      toast.error('Add at least one driver to your grid');
      return;
    }

    setSaving(true);

    const gridData = {
      user_id: user.id,
      items: gridItems.map(({ driver, ...item }) => item),
      note: note.trim() || null,
    };

    let error;
    if (existingGridId) {
      // Update existing grid
      const { error: updateError } = await supabase
        .from('grids')
        .update(gridData)
        .eq('id', existingGridId)
        .eq('user_id', user.id);
      error = updateError;
    } else {
      // Create new grid
      const { data, error: insertError } = await supabase
        .from('grids')
        .insert(gridData)
        .select('id')
        .single();
      
      if (!insertError && data) {
        setExistingGridId(data.id);
      }
      error = insertError;
    }

    setSaving(false);

    if (error) {
      toast.error('Failed to save grid');
      return;
    }

    toast.success('Grid saved successfully!');
  };

  const shareGrid = async () => {
    if (!existingGridId || !userProfile) {
      toast.error('Please save your grid first');
      return;
    }

    const shareUrl = `${window.location.origin}/u/${userProfile.username}/grid`;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Share link copied to clipboard!');
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  const clearGrid = () => {
    setGridItems([]);
    setNote('');
    // Don't reset existingGridId as the grid still exists in DB
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">
              Please sign in to create your grid
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <PageHeader title={existingGridId ? 'Edit Your Grid' : 'Build Your Grid'} />
      <div className="container mx-auto px-4 pb-8">
        <div className="mb-8">
          <p className="text-muted-foreground">
            Search and rank your top 10 drivers with optional reasoning
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Driver Search */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                Search Drivers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                placeholder="Search drivers by name or country..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mb-4"
              />
              
              <div className="max-h-96 overflow-y-auto space-y-2">
                {filteredDrivers.map((driver) => (
                  <div
                    key={driver.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                    onClick={() => addDriverToGrid(driver)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                        {driver.headshot_url ? (
                          <img 
                            src={driver.headshot_url} 
                            alt={driver.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-6 h-6 bg-secondary rounded-full flex items-center justify-center text-xs font-bold">
                            {driver.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <div className="font-medium">{driver.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {driver.number && `#${driver.number} • `}{driver.country}
                        </div>
                      </div>
                    </div>
                    
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={gridItems.some(item => item.driver_id === driver.id)}
                    >
                      {gridItems.some(item => item.driver_id === driver.id) ? 'Added' : 'Add'}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Grid Builder */}
          <Card>
            <CardHeader>
              <CardTitle>Your Top 10 Grid ({gridItems.length}/10)</CardTitle>
            </CardHeader>
            <CardContent>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={gridItems.map(item => item.driver_id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3 mb-6">
                    {gridItems.map((item) => (
                      <div key={item.driver_id} className="relative">
                        <SortableDriver
                          item={item}
                          onReasoningChange={handleReasoningChange}
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          className="absolute top-2 right-2"
                          onClick={() => removeDriverFromGrid(item.driver_id)}
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                </SortableContext>
              </DndContext>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Add a note (optional)
                  </label>
                  <Textarea
                    placeholder="Add any notes about your grid..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={saveGrid}
                    disabled={saving || gridItems.length === 0}
                    className="flex-1"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? 'Saving...' : existingGridId ? 'Update Grid' : 'Save Grid'}
                  </Button>
                  
                  {existingGridId && userProfile && (
                    <Button
                      variant="outline"
                      onClick={shareGrid}
                      className="flex-1"
                    >
                      <Share className="w-4 h-4 mr-2" />
                      Share
                    </Button>
                  )}
                  
                  {gridItems.length > 0 && (
                    <Button
                      variant="outline"
                      onClick={clearGrid}
                      size="icon"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MyGrid;