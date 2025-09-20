import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import RacingFormation from '@/components/RacingFormation';
import FollowButton from '@/components/FollowButton';
import LikeButton from '@/components/LikeButton';
import { useFollow } from '@/hooks/useFollow';
import { ArrowLeft, Share2, Calendar, Grid3X3, LayoutGrid, List, Users } from 'lucide-react';
import { toast } from 'sonner';

interface Profile {
  id: string;
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  favorite_team: string | null;
  favorite_driver: string | null;
  created_at: string;
}

interface Driver {
  id: string;
  name: string;
  country: string;
  number: number | null;
  headshot_url: string | null;
  teams?: { name: string; country: string };
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
}

const UserProfile = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [grids, setGrids] = useState<Grid[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'formation' | 'list'>('formation');
  const { followCounts } = useFollow(profile?.user_id);

  useEffect(() => {
    if (username) {
      fetchUserProfile();
    }
  }, [username]);

  const fetchUserProfile = async () => {
    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .eq('setup_completed', true)
        .maybeSingle();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        setError('Error loading profile');
        setLoading(false);
        return;
      }

      if (!profileData) {
        setError('Profile not found');
        setLoading(false);
        return;
      }

      setProfile(profileData);

      // Fetch user's grids
      const { data: gridsData, error: gridsError } = await supabase
        .from('grids')
        .select('id, items, note, created_at')
        .eq('user_id', profileData.user_id)
        .order('created_at', { ascending: false });

      if (gridsError) {
        console.error('Error fetching grids:', gridsError);
        setError('Error loading grids');
        setLoading(false);
        return;
      }

      // Fetch driver details for each grid
      const gridsWithDrivers = await Promise.all(
        (gridsData || []).map(async (grid) => {
          const items = Array.isArray(grid.items) ? (grid.items as unknown as GridItem[]) : [];
          
          if (items.length > 0) {
            const driverIds = items.map((item) => item.driver_id);
            
            const { data: driversData } = await supabase
              .from('drivers')
              .select(`
                id, name, country, number, headshot_url,
                teams!drivers_team_id_fkey(name, country)
              `)
              .in('id', driverIds);

            const itemsWithDrivers = items.map((item) => ({
              ...item,
              driver: driversData?.find(driver => driver.id === item.driver_id)
            })).filter(item => item.driver) as GridItem[];

            return {
              ...grid,
              items: itemsWithDrivers
            };
          }

          return {
            ...grid,
            items: [] as GridItem[]
          };
        })
      );

      setGrids(gridsWithDrivers);
    } catch (err) {
      console.error('Error:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const shareProfile = async () => {
    const url = window.location.href;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${profile?.display_name || profile?.username}'s Racing Profile`,
          text: `Check out this racing fan's profile on Who's On Pole!`,
          url: url
        });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          copyToClipboard(url);
        }
      }
    } else {
      copyToClipboard(url);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Profile link copied to clipboard!');
    }).catch(() => {
      toast.error('Failed to copy link');
    });
  };

  const formatJoinDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getInitials = (username: string, displayName?: string | null) => {
    if (displayName) {
      return displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    return username.slice(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-8">
            <Skeleton className="w-32 h-32 rounded-full mx-auto mb-6" />
            <Skeleton className="h-8 w-48 mx-auto mb-2" />
            <Skeleton className="h-6 w-32 mx-auto mb-4" />
            <Skeleton className="h-4 w-96 mx-auto" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-foreground mb-4">
              {error || 'Profile not found'}
            </h1>
            <p className="text-muted-foreground mb-6">
              The profile you're looking for doesn't exist or hasn't been set up yet.
            </p>
            <div className="flex gap-4 justify-center">
              <Button variant="outline" onClick={() => navigate('/profiles')}>
                <Users className="h-4 w-4 mr-2" />
                Browse Profiles
              </Button>
              <Button onClick={() => navigate('/')}>
                Back to Home
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{`${profile.display_name || profile.username} - Fan Profile | Who's On Pole?`}</title>
        <meta name="description" content={`Check out ${profile.display_name || profile.username}'s racing profile. ${profile.bio || 'A passionate motorsport fan'} ${profile.favorite_team ? `Supporting ${profile.favorite_team}` : ''} ${profile.favorite_driver ? `and ${profile.favorite_driver}` : ''}.`} />
      </Helmet>

      <Navigation />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => navigate('/profiles')}
          className="mb-6 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Profiles
        </Button>

        {/* Profile Header */}
        <div className="text-center mb-8">
          <Avatar className="w-32 h-32 mx-auto mb-6 shadow-racing">
            <AvatarImage 
              src={profile.avatar_url || undefined} 
              alt={`${profile.username}'s avatar`}
            />
            <AvatarFallback className="bg-primary/10 text-primary font-bold text-2xl">
              {getInitials(profile.username, profile.display_name)}
            </AvatarFallback>
          </Avatar>

          <h1 className="text-3xl md:text-4xl font-black text-foreground mb-2">
            {profile.display_name || profile.username}
          </h1>
          {profile.display_name && (
            <p className="text-lg text-muted-foreground mb-4">@{profile.username}</p>
          )}

          {profile.bio && (
            <p className="text-muted-foreground max-w-2xl mx-auto mb-6">
              {profile.bio}
            </p>
          )}

          <div className="flex justify-center gap-4 mb-6">
            {profile.favorite_team && (
              <Badge variant="secondary" className="text-sm px-4 py-2">
                Team: {profile.favorite_team}
              </Badge>
            )}
            {profile.favorite_driver && (
              <Badge variant="outline" className="text-sm px-4 py-2">
                Driver: {profile.favorite_driver}
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground mb-6">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>Joined {formatJoinDate(profile.created_at)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Grid3X3 className="h-4 w-4" />
              <span>{grids.length} grid{grids.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{followCounts?.follower_count || 0} followers</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{followCounts?.following_count || 0} following</span>
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <FollowButton targetUserId={profile.user_id} />
            <Button onClick={shareProfile} variant="outline">
              <Share2 className="h-4 w-4 mr-2" />
              Share Profile
            </Button>
          </div>
        </div>

        {/* Grids Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground">
              Racing Grids
            </h2>
            
            {grids.length > 0 && (
              <div className="flex gap-2">
                <Button
                  variant={viewMode === 'formation' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('formation')}
                >
                  <LayoutGrid className="h-4 w-4 mr-2" />
                  Formation
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4 mr-2" />
                  List
                </Button>
              </div>
            )}
          </div>

          {grids.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Grid3X3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  No grids yet
                </h3>
                <p className="text-muted-foreground">
                  {profile.username} hasn't created any racing grids yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {grids.map((grid, index) => (
                <Card key={grid.id} className="overflow-hidden">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Grid #{index + 1}</span>
                      <span className="text-sm font-normal text-muted-foreground">
                        {new Date(grid.created_at).toLocaleDateString()}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {viewMode === 'formation' ? (
                      <div>
                        <RacingFormation items={grid.items} />
                        <div className="mt-4 flex items-center justify-between">
                          <LikeButton gridId={grid.id} />
                          <span className="text-xs text-muted-foreground">
                            {new Date(grid.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {grid.items
                          .sort((a, b) => a.rank - b.rank)
                          .map((item) => (
                            <div key={item.driver_id} className="flex items-center gap-4 p-3 rounded-lg border">
                              <div className="font-bold text-primary min-w-[2rem]">
                                P{item.rank}
                              </div>
                              <Avatar className="w-10 h-10">
                                <AvatarImage 
                                  src={item.driver?.headshot_url || undefined}
                                  alt={`${item.driver?.name}'s headshot`}
                                />
                                <AvatarFallback>
                                  {item.driver?.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="font-semibold">{item.driver?.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {item.driver?.country}
                                  {item.driver?.number && ` • #${item.driver.number}`}
                                </div>
                              </div>
                              <div className="flex">
                                {Array.from({ length: item.stars }).map((_, i) => (
                                  <span key={i} className="text-yellow-500">★</span>
                                ))}
                              </div>
                            </div>
                          ))}
                        <div className="mt-4 flex items-center justify-between">
                          <LikeButton gridId={grid.id} />
                          <span className="text-xs text-muted-foreground">
                            {new Date(grid.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    )}
                    
                    {grid.note && (
                      <div className="mt-4 p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground italic">
                          "{grid.note}"
                        </p>
                      </div>
                    )}
                  </CardContent>
                  
                  {/* Racing stripe accent */}
                  <div className="absolute top-0 left-0 w-full h-1 gradient-primary opacity-50"></div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default UserProfile;