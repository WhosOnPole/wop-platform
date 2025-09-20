import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Copy, Share, ExternalLink, Grid3X3, List } from 'lucide-react';
import { toast } from 'sonner';
import { Helmet } from 'react-helmet-async';
import RacingFormation from '@/components/RacingFormation';

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
  stars: number;
  driver?: Driver;
}

interface Grid {
  id: string;
  items: GridItem[];
  note: string | null;
  created_at: string;
  profiles: {
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

const ShareGrid = () => {
  const { username } = useParams<{ username: string }>();
  const [grid, setGrid] = useState<Grid | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'formation' | 'list'>('formation');

  useEffect(() => {
    if (username) {
      fetchGrid();
    }
  }, [username]);

  const fetchGrid = async () => {
    if (!username) return;

    try {
      // First get the user profile to get user_id
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, username, display_name, avatar_url')
        .eq('username', username)
        .maybeSingle();

      if (profileError) {
        throw profileError;
      }

      if (!profile) {
        setError('User not found');
        setLoading(false);
        return;
      }

      // Then get the user's grid
      const { data: gridData, error: gridError } = await supabase
        .from('grids')
        .select('id, items, note, created_at')
        .eq('user_id', profile.user_id)
        .maybeSingle();

      if (gridError) {
        throw gridError;
      }

      if (!gridData) {
        setError('Grid not found');
        setLoading(false);
        return;
      }

        // Fetch driver details for each item
        const items = Array.isArray(gridData.items) ? gridData.items : [];
        const driverIds = items.map((item: any) => item.driver_id);
        
        if (driverIds.length > 0) {
          const { data: drivers, error: driversError } = await supabase
            .from('drivers')
            .select(`
              id, name, country, number, headshot_url,
              teams!drivers_team_id_fkey(name)
            `)
            .in('id', driverIds);

          if (driversError) {
            throw driversError;
          }

          // Map drivers to grid items
          const itemsWithDrivers = items.map((item: any) => ({
            ...item,
            driver: drivers?.find(d => d.id === item.driver_id)
          }));

          setGrid({
            ...gridData,
            items: itemsWithDrivers,
            profiles: profile
          });
        } else {
          setGrid({
            ...gridData,
            items: [],
            profiles: profile
          });
        }
    } catch (err) {
      console.error('Error fetching grid:', err);
      setError('Failed to load grid');
    } finally {
      setLoading(false);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  const shareToInstagram = () => {
    // Instagram doesn't have a direct web share API, so we'll show instructions
    toast.info('Copy the link and share it in your Instagram story or bio!');
  };

  const shareToTikTok = () => {
    // TikTok doesn't have a direct web share API either
    toast.info('Copy the link and share it in your TikTok bio or comments!');
  };

  const openNativeShare = async () => {
    if (navigator.share && grid) {
      try {
        await navigator.share({
          title: `${grid.profiles.display_name || grid.profiles.username}'s F1 Grid`,
          text: `Check out ${grid.profiles.display_name || grid.profiles.username}'s top 10 F1 drivers!`,
          url: window.location.href,
        });
      } catch (err) {
        // User cancelled or share failed
      }
    } else {
      copyLink();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading grid...</p>
        </div>
      </div>
    );
  }

  if (error || !grid) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Grid Not Found</h2>
            <p className="text-muted-foreground mb-4">{error || 'This grid does not exist or has been removed.'}</p>
            <Button variant="outline" onClick={() => window.location.href = '/'}>
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const pageTitle = `${grid.profiles.display_name || grid.profiles.username}'s F1 Grid`;
  const pageDescription = `Check out ${grid.profiles.display_name || grid.profiles.username}'s top ${grid.items.length} F1 drivers on Who's On Pole!`;
  const topDrivers = grid.items.slice(0, 4);
  const ogImage = topDrivers.length > 0 ? topDrivers[0].driver?.headshot_url : null;

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        
        {/* OpenGraph */}
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={window.location.href} />
        {ogImage && <meta property="og:image" content={ogImage} />}
        <meta property="og:site_name" content="Who's On Pole?" />
        
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        {ogImage && <meta name="twitter:image" content={ogImage} />}
        
        {/* Additional metadata */}
        <meta name="author" content={grid.profiles.display_name || grid.profiles.username} />
        <meta name="robots" content="index, follow" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              {grid.profiles.avatar_url ? (
                <img
                  src={grid.profiles.avatar_url}
                  alt={grid.profiles.username}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center font-bold">
                  {(grid.profiles.display_name || grid.profiles.username).charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold">
                  {grid.profiles.display_name || grid.profiles.username}'s Grid
                </h1>
                <p className="text-muted-foreground">Top {grid.items.length} F1 Drivers</p>
              </div>
            </div>

            {/* Share Buttons */}
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              <Button variant="outline" size="sm" onClick={copyLink}>
                <Copy className="w-4 h-4 mr-2" />
                Copy Link
              </Button>
              <Button variant="outline" size="sm" onClick={openNativeShare}>
                <Share className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm" onClick={shareToInstagram}>
                <ExternalLink className="w-4 h-4 mr-2" />
                Instagram
              </Button>
              <Button variant="outline" size="sm" onClick={shareToTikTok}>
                <ExternalLink className="w-4 h-4 mr-2" />
                TikTok
              </Button>
            </div>

            {/* View Toggle */}
            <div className="flex justify-center mb-6">
              <div className="flex bg-muted rounded-lg p-1">
                <Button
                  variant={viewMode === 'formation' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('formation')}
                  className="flex items-center gap-2"
                >
                  <Grid3X3 className="w-4 h-4" />
                  Formation
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="flex items-center gap-2"
                >
                  <List className="w-4 h-4" />
                  List
                </Button>
              </div>
            </div>
          </div>

          {/* Grid */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{viewMode === 'formation' ? 'Racing Formation' : 'Driver Rankings'}</span>
                <Badge variant="secondary">
                  {new Date(grid.created_at).toLocaleDateString()}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {viewMode === 'formation' ? (
                <div className="py-8">
                  <RacingFormation items={grid.items} />
                </div>
              ) : (
                <div className="space-y-3">
                  {grid.items
                    .sort((a, b) => a.rank - b.rank)
                    .map((item) => (
                      <div
                        key={item.driver_id}
                        className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg"
                      >
                        <Badge variant="secondary" className="w-8 h-8 flex items-center justify-center font-bold">
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
                              {item.driver?.name?.charAt(0)}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <h3 className="font-semibold">{item.driver?.name || 'Unknown Driver'}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            {item.driver?.number && (
                              <span>#{item.driver.number}</span>
                            )}
                            <span>{item.driver?.country}</span>
                            {item.driver?.teams && (
                              <span>• {item.driver.teams.name}</span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${
                                star <= item.stars ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {grid.note && (
                <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Note:</p>
                  <p className="text-sm">{grid.note}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center mt-8">
            <p className="text-sm text-muted-foreground mb-2">
              Create your own F1 grid on
            </p>
            <Button variant="outline" onClick={() => window.location.href = '/'}>
              Who's On Pole?
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ShareGrid;