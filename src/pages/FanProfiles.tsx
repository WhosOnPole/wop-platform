import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import Navigation from '@/components/Navigation';
import PageHeader from '@/components/PageHeader';
import Footer from '@/components/Footer';
import { Search, Users, ArrowLeft, UserPlus } from 'lucide-react';

interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  favorite_team: string | null;
  favorite_driver: string | null;
  created_at: string;
}

const FanProfiles = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [filteredProfiles, setFilteredProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchProfiles();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredProfiles(profiles);
    } else {
      const filtered = profiles.filter(profile =>
        profile.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (profile.display_name && profile.display_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (profile.favorite_team && profile.favorite_team.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (profile.favorite_driver && profile.favorite_driver.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredProfiles(filtered);
    }
  }, [searchTerm, profiles]);

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url, bio, favorite_team, favorite_driver, created_at')
        .eq('setup_completed', true)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching profiles:', error);
        return;
      }

      setProfiles(data || []);
      setFilteredProfiles(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatJoinDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
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
        <PageHeader title="Fan Profiles" />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          <div className="text-center mb-8">
            <Skeleton className="h-12 w-64 mx-auto mb-4" />
            <Skeleton className="h-6 w-96 mx-auto mb-8" />
            <Skeleton className="h-10 w-full max-w-md mx-auto" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <CardHeader className="text-center pb-4">
                  <Skeleton className="w-16 h-16 rounded-full mx-auto mb-4" />
                  <Skeleton className="h-6 w-32 mx-auto mb-2" />
                  <Skeleton className="h-4 w-24 mx-auto" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Fan Profiles - Who's On Pole?</title>
        <meta name="description" content="Discover and connect with racing fans from around the world. Explore fan profiles, see their favorite drivers and teams, and connect with the motorsport community." />
      </Helmet>

      <Navigation />
      <PageHeader title="Fan Profiles" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {/* Header */}
        <div className="text-center mb-8">
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Discover racing fans, see their favorite drivers and teams, and explore their dream grids.
          </p>

          {/* Search */}
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by username, team, or driver..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{filteredProfiles.length} racing fans</span>
          </div>
        </div>

        {/* Profiles Grid */}
        {filteredProfiles.length === 0 ? (
          <div className="text-center py-12">
            <UserPlus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              {searchTerm ? 'No profiles found' : 'No fan profiles yet'}
            </h3>
            <p className="text-muted-foreground mb-6">
              {searchTerm 
                ? 'Try adjusting your search terms or browse all profiles.'
                : 'Be the first to create your racing profile and connect with other fans!'
              }
            </p>
            {searchTerm && (
              <Button 
                variant="outline" 
                onClick={() => setSearchTerm('')}
                className="mr-4"
              >
                Clear Search
              </Button>
            )}
            <Button onClick={() => navigate('/profile')}>
              Create Your Profile
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProfiles.map((profile) => (
              <Link key={profile.id} to={`/u/${profile.username}`}>
                <Card className="overflow-hidden hover:shadow-racing transition-racing hover:scale-105 cursor-pointer group">
                  <CardHeader className="text-center pb-4">
                    <Avatar className="w-16 h-16 mx-auto mb-4 group-hover:scale-110 transition-racing">
                      <AvatarImage 
                        src={profile.avatar_url || undefined} 
                        alt={`${profile.username}'s avatar`}
                      />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {getInitials(profile.username, profile.display_name)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <h3 className="font-bold text-foreground truncate">
                      {profile.display_name || profile.username}
                    </h3>
                    {profile.display_name && (
                      <p className="text-sm text-muted-foreground">@{profile.username}</p>
                    )}
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    {profile.bio && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {profile.bio}
                      </p>
                    )}
                    
                    <div className="space-y-2">
                      {profile.favorite_team && (
                        <Badge variant="secondary" className="w-full justify-center text-xs">
                          Team: {profile.favorite_team}
                        </Badge>
                      )}
                      {profile.favorite_driver && (
                        <Badge variant="outline" className="w-full justify-center text-xs">
                          Driver: {profile.favorite_driver}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="text-xs text-muted-foreground text-center">
                      Joined {formatJoinDate(profile.created_at)}
                    </div>
                  </CardContent>
                  
                  {/* Racing stripe accent */}
                  <div className="absolute top-0 left-0 w-full h-1 gradient-primary opacity-50 group-hover:opacity-100 transition-racing"></div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default FanProfiles;