import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Upload, User, Save, Trophy, Flag, Star, Share, Grid3X3, Calendar, Edit, BarChart3, Camera, Clock, Heart, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import RacingFormation from '@/components/RacingFormation';
import { useUserVotedPolls, useUserFanPosts } from '@/hooks/useUserActivity';
import { formatDistanceToNow } from 'date-fns';
import Navigation from '@/components/Navigation';
import PageHeader from '@/components/PageHeader';
import { useTracks, Track } from '@/hooks/useTracks';
import { TrackSelector } from '@/components/TrackSelector';
import { RegionSelector } from '@/components/RegionSelector';
import { UserFanBadges } from '@/components/UserFanBadges';
import { FavoriteTracksDisplay } from '@/components/FavoriteTracksDisplay';

interface Profile {
  id: string;
  user_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  region: string | null;
  favorite_team: string | null;
  favorite_driver: string | null;
  favorite_team_id: string | null;
  favorite_driver_id: string | null;
  favorite_track_ids: string[];
  setup_completed: boolean;
  created_at: string;
}

interface Team {
  id: string;
  name: string;
  country: string;
  logo_url: string | null;
}

interface Driver {
  id: string;
  name: string;
  country: string;
  number: number | null;
  headshot_url: string | null;
}

interface GridItem {
  driver_id: string;
  rank: number;
  stars: number;
  driver?: Driver;
}

interface Grid {
  id: string;
  created_at: string;
  items: any; // Keep as any to match database type
  note: string | null;
}

const Profile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [userGrid, setUserGrid] = useState<Grid | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Fetch user activity data
  const { data: votedPolls } = useUserVotedPolls(user?.id || '');
  const { data: fanPosts } = useUserFanPosts(user?.id || '');
  
  // Fetch tracks data
  const { data: tracks = [] } = useTracks();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
      Promise.all([
        fetchProfile(),
        fetchTeams(),
        fetchDrivers(),
        fetchUserGrid()
      ]);
  }, [user, navigate]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        toast({
          title: "Error",
          description: "Failed to load profile",
          variant: "destructive",
        });
        return;
      }

      if (data) {
        setProfile({
          ...data,
          favorite_track_ids: Array.isArray(data.favorite_track_ids) 
            ? data.favorite_track_ids.filter((id): id is string => typeof id === 'string')
            : []
        });
        setIsFirstTime(!data.setup_completed);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeams = async () => {
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .order('name');

    if (!error && data) {
      setTeams(data);
    }
  };

  const fetchDrivers = async () => {
    const { data, error } = await supabase
      .from('drivers')
      .select('*')
      .order('name');

    if (!error && data) {
      setDrivers(data);
    }
  };

  const fetchUserGrid = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('grids')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!error && data) {
      // Fetch driver details for each grid item
      const gridWithDrivers = { ...data } as Grid;
      if (data.items && Array.isArray(data.items)) {
        const driverIds = data.items.map((item: any) => item.driver_id);
        const { data: driversData } = await supabase
          .from('drivers')
          .select(`
            id,
            name,
            country,
            number,
            headshot_url,
            teams:team_id (
              name
            )
          `)
          .in('id', driverIds);

        if (driversData) {
          gridWithDrivers.items = data.items.map((item: any) => ({
            ...item,
            driver: driversData.find((driver: any) => driver.id === item.driver_id)
          }));
        }
      }
      setUserGrid(gridWithDrivers);
    }
  };

  const handleInputChange = (field: keyof Profile, value: string) => {
    if (!profile) return;
    setProfile({ ...profile, [field]: value });
  };

  const handleSelectChange = (field: keyof Profile, value: string) => {
    if (!profile) return;
    setProfile({ ...profile, [field]: value });
  };

  const handleFavoriteTracksChange = (trackIds: string[]) => {
    if (!profile) return;
    setProfile({ ...profile, favorite_track_ids: trackIds });
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || !event.target.files[0] || !user) return;

    const file = event.target.files[0];
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/avatar.${fileExt}`;

    setUploading(true);

    try {
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: data.publicUrl })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      setProfile(prev => prev ? { ...prev, avatar_url: data.publicUrl } : null);
      
      toast({
        title: "Success",
        description: "Avatar updated successfully",
      });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Error",
        description: "Failed to upload avatar",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!profile || !user) return;

    setSaving(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          username: profile.username,
          display_name: profile.display_name,
          bio: profile.bio,
          region: profile.region,
          favorite_team_id: profile.favorite_team_id,
          favorite_driver_id: profile.favorite_driver_id,
          favorite_track_ids: profile.favorite_track_ids || [],
          setup_completed: true,
        })
        .eq('user_id', user.id);

      if (error) throw error;

      setIsFirstTime(false);
      setIsEditing(false);
      toast({
        title: "Success",
        description: isFirstTime ? "Profile setup completed!" : "Profile updated successfully",
      });

      if (isFirstTime) {
        navigate('/my-grid');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const shareProfile = async () => {
    if (!profile) return;
    
    const profileUrl = `${window.location.origin}/u/${profile.username}`;
    
    try {
      await navigator.clipboard.writeText(profileUrl);
      toast({
        title: "Success",
        description: "Profile link copied to clipboard!",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy profile link",
        variant: "destructive",
      });
    }
  };

  const favoriteTeam = teams.find(t => t.id === profile?.favorite_team_id);
  const favoriteDriver = drivers.find(d => d.id === profile?.favorite_driver_id);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center">Profile not found</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <PageHeader title="My Profile" />
      <div className="container mx-auto px-4 pb-8">
      <div className="max-w-7xl mx-auto">
        {isFirstTime && (
          <div className="mb-8 p-6 gradient-primary rounded-2xl border text-primary-foreground">
            <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
              <Flag className="h-6 w-6" />
              Welcome to Who's On Pole!
            </h1>
            <p className="opacity-90">
              Let's set up your profile! Choose your favorite team and driver, then you'll be ready to build your first grid.
            </p>
          </div>
        )}

        {/* Main Content - Side by Side Layout */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Side - Profile Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Display or Edit Mode */}
            {!isFirstTime && !isEditing ? (
              <Card className="shadow-racing">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-primary" />
                      Racing Profile
                    </CardTitle>
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row gap-6">
                    <Avatar className="h-24 w-24 mx-auto sm:mx-0 ring-2 ring-primary/20">
                      <AvatarImage src={profile.avatar_url || undefined} />
                      <AvatarFallback className="text-lg">
                        {profile.display_name?.charAt(0) || profile.username.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 text-center sm:text-left">
                      <h2 className="text-2xl font-bold">{profile.display_name || profile.username}</h2>
                      <p className="text-muted-foreground">@{profile.username}</p>
                      
                      {/* Fan Leadership Badges */}
                      <div className="mt-2">
                        <UserFanBadges size="sm" maxDisplay={2} />
                      </div>
                      
                      {profile.bio && (
                        <p className="mt-3 text-sm leading-relaxed">{profile.bio}</p>
                      )}
                      
                      <div className="flex flex-wrap gap-4 mt-4 justify-center sm:justify-start">
                        {favoriteTeam && (
                          <div className="flex items-center gap-2">
                            <Flag className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium">Team:</span>
                            <Badge variant="secondary" className="flex items-center gap-1">
                              {favoriteTeam.logo_url && (
                                <img src={favoriteTeam.logo_url} alt={favoriteTeam.name} className="w-4 h-4" />
                              )}
                              {favoriteTeam.name}
                            </Badge>
                          </div>
                        )}
                        
                        {favoriteDriver && (
                          <div className="flex items-center gap-2">
                            <Star className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium">Driver:</span>
                            <Badge variant="secondary" className="flex items-center gap-1">
                              {favoriteDriver.headshot_url && (
                                <img src={favoriteDriver.headshot_url} alt={favoriteDriver.name} className="w-4 h-4 rounded-full" />
                              )}
                              {favoriteDriver.name}
                            </Badge>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-primary" />
                          <span className="text-sm text-muted-foreground">
                            Joined {new Date(profile.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2 mt-6 justify-center sm:justify-start">
                        <Button variant="outline" onClick={shareProfile}>
                          <Share className="h-4 w-4 mr-2" />
                          Share Profile
                        </Button>
                        {userGrid && (
                          <Button variant="outline" onClick={() => navigate('/my-grid')}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Grid
                          </Button>
                         )}
                       </div>
                     </div>
                   </div>

                   {/* Favorite Tracks Display */}
                   {profile.favorite_track_ids && profile.favorite_track_ids.length > 0 && (
                     <div className="mt-6">
                       <FavoriteTracksDisplay 
                         tracks={tracks}
                         favoriteTrackIds={profile.favorite_track_ids}
                       />
                     </div>
                   )}
                 </CardContent>
               </Card>
            ) : (
              /* Edit Mode */
              <Card className="shadow-racing">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    {isFirstTime ? 'Complete Your Profile' : 'Edit Profile'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Avatar Section */}
                  <div className="flex flex-col items-center space-y-4">
                    <Avatar className="h-24 w-24 ring-2 ring-primary/20">
                      <AvatarImage src={profile.avatar_url || undefined} />
                      <AvatarFallback>
                        {profile.display_name?.charAt(0) || profile.username.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                        id="avatar-upload"
                      />
                      <Label htmlFor="avatar-upload">
                        <Button
                          variant="outline"
                          className="cursor-pointer"
                          disabled={uploading}
                          asChild
                        >
                          <span>
                            <Upload className="h-4 w-4 mr-2" />
                            {uploading ? 'Uploading...' : 'Upload Avatar'}
                          </span>
                        </Button>
                      </Label>
                    </div>
                  </div>

                  {/* Form Fields */}
                  <div className="grid gap-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="username">Username</Label>
                        <Input
                          id="username"
                          value={profile.username}
                          onChange={(e) => handleInputChange('username', e.target.value)}
                          placeholder="Enter username"
                        />
                      </div>

                      <div>
                        <Label htmlFor="display_name">Display Name</Label>
                        <Input
                          id="display_name"
                          value={profile.display_name || ''}
                          onChange={(e) => handleInputChange('display_name', e.target.value)}
                          placeholder="Enter display name"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        value={profile.bio || ''}
                        onChange={(e) => handleInputChange('bio', e.target.value)}
                        placeholder="Tell us about yourself and your racing passion"
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="favorite_team">Favorite Team</Label>
                        <Select
                          value={profile.favorite_team_id || ''}
                          onValueChange={(value) => handleSelectChange('favorite_team_id', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Choose your favorite team" />
                          </SelectTrigger>
                          <SelectContent>
                            {teams.map((team) => (
                              <SelectItem key={team.id} value={team.id}>
                                <div className="flex items-center gap-2">
                                  {team.logo_url && (
                                    <img src={team.logo_url} alt={team.name} className="w-6 h-6" />
                                  )}
                                  {team.name}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="favorite_driver">Favorite Driver</Label>
                        <Select
                          value={profile.favorite_driver_id || ''}
                          onValueChange={(value) => handleSelectChange('favorite_driver_id', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Choose your favorite driver" />
                          </SelectTrigger>
                          <SelectContent>
                            {drivers.map((driver) => (
                              <SelectItem key={driver.id} value={driver.id}>
                                <div className="flex items-center gap-2">
                                  {driver.headshot_url && (
                                    <img src={driver.headshot_url} alt={driver.name} className="w-6 h-6 rounded-full" />
                                  )}
                                  {driver.name}
                                  {driver.number && <span className="text-muted-foreground">#{driver.number}</span>}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                       </div>
                     </div>

                      {/* Favorite Tracks Section */}
                      <div>
                        <Label>Favorite Tracks (up to 5)</Label>
                        <TrackSelector
                          tracks={tracks}
                          selectedTrackIds={profile.favorite_track_ids || []}
                          onSelectionChange={handleFavoriteTracksChange}
                          maxSelection={5}
                        />
                      </div>

                      {/* Region Selection */}
                      <RegionSelector 
                        value={profile.region || ''}
                        onChange={(region) => handleInputChange('region', region)}
                      />
                   </div>

                   <div className="flex gap-4">
                    <Button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex-1"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {saving ? 'Saving...' : isFirstTime ? 'Complete Setup & Build Grid' : 'Save Profile'}
                    </Button>
                    
                    {!isFirstTime && (
                      <Button
                        variant="outline"
                        onClick={() => setIsEditing(false)}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Side - Racing Grid Formation */}
          <div className="lg:col-span-1">
            <Card className="shadow-racing h-fit">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flag className="h-5 w-5 text-primary" />
                  Starting Formation
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!userGrid ? (
                  <div className="text-center py-8">
                    <Grid3X3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-semibold mb-2">No Grid Yet!</h3>
                    <p className="text-muted-foreground text-sm mb-4">Create your racing grid to see your drivers in formation</p>
                    <Button onClick={() => navigate('/my-grid')} className="transition-racing">
                      <Flag className="h-4 w-4 mr-2" />
                      Create Your Grid
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userGrid.items && Array.isArray(userGrid.items) && userGrid.items.length > 0 ? (
                      <>
                        <RacingFormation items={userGrid.items} />
                        {userGrid.note && (
                          <div className="mt-4 p-3 bg-muted/30 rounded-lg">
                            <p className="text-sm text-muted-foreground italic">"{userGrid.note}"</p>
                          </div>
                        )}
                        <div className="flex gap-2 pt-4">
                          <Button size="sm" variant="outline" onClick={() => navigate('/my-grid')} className="flex-1">
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => navigate(`/u/${profile.username}/grid`)} className="flex-1">
                            <Share className="h-4 w-4 mr-1" />
                            Share
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-muted-foreground text-sm">Grid is empty</p>
                        <Button size="sm" onClick={() => navigate('/my-grid')} className="mt-2">
                          Add Drivers
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Activity Feed - Only show if not first time and not editing */}
        {!isFirstTime && !isEditing && (votedPolls?.length || fanPosts?.length) && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-primary" />
              Recent Activity
            </h2>
            
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Voted Polls Section */}
              {votedPolls && votedPolls.length > 0 && (
                <Card className="shadow-racing">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-primary" />
                      Recent Poll Votes
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {votedPolls.slice(0, 3).map((poll) => (
                      <div key={poll.id} className="p-4 bg-muted/30 rounded-lg">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h4 className="font-medium text-sm leading-tight">{poll.title}</h4>
                          <Badge variant="outline" className="text-xs">
                            {poll.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <Star className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium">Voted for:</span>
                          <Badge variant="secondary" className="text-xs">
                            {poll.selected_option.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span className="text-xs">
                            Voted {formatDistanceToNow(new Date(poll.voted_at), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    ))}
                    {votedPolls.length > 3 && (
                      <Button size="sm" variant="outline" className="w-full">
                        View All Poll Activity
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Fan Posts Section */}
              {fanPosts && fanPosts.length > 0 && (
                <Card className="shadow-racing">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Camera className="h-5 w-5 text-primary" />
                      Featured Posts
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {fanPosts.slice(0, 3).map((post) => (
                      <div key={post.id} className="flex gap-3">
                        <img 
                          src={post.image_url} 
                          alt="Fan post" 
                          className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          {post.caption && (
                            <p className="text-sm font-medium line-clamp-2 mb-1">
                              {post.caption}
                            </p>
                          )}
                          <div className="flex items-center gap-3 text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span className="text-xs">
                                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              <button className="flex items-center gap-1 hover:text-primary transition-colors">
                                <Heart className="h-3 w-3" />
                                <span>Like</span>
                              </button>
                              <button className="flex items-center gap-1 hover:text-primary transition-colors">
                                <MessageCircle className="h-3 w-3" />
                                <span>Comment</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {fanPosts.length > 3 && (
                      <Button size="sm" variant="outline" className="w-full">
                        View All Posts
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default Profile;