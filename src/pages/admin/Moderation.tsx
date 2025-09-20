import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Check, X, Eye, Clock, CheckCircle, XCircle, MessageSquare, Image, Star, Tag } from "lucide-react";
import { useFanPosts, useUpdateFanPostStatus } from "@/hooks/useFanPosts";
import { useSetSpotlight, useRemoveSpotlight, useSpotlightPost } from "@/hooks/useSpotlight";
import { useDriverCommentsModeration, useUpdateDriverCommentStatus } from "@/hooks/useDriverComments";
import { useTeamCommentsModeration, useUpdateTeamCommentStatus } from "@/hooks/useTeamCommentsModeration";
import { useTeamPrincipalCommentsModeration, useUpdateTeamPrincipalCommentStatus } from "@/hooks/useTeamPrincipalCommentsModeration";
import { useTrackCommentsModeration, useUpdateTrackCommentStatus } from "@/hooks/useTrackCommentsModeration";
import { useFanPostCommentsModeration, useUpdateFanPostCommentStatus } from "@/hooks/useFanPostCommentsModeration";
import { useTagDriversInPost, usePostDrivers } from "@/hooks/useDriverFanPosts";
import { useDrivers } from "@/hooks/useDrivers";
import { formatDistanceToNow } from "date-fns";
import AdminLayout from "@/components/AdminLayout";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { DriverTagSelector } from "@/components/DriverTagSelector";

const Moderation = () => {
  const [activeTab, setActiveTab] = useState("pending");
  const { data: pendingPosts, isLoading: pendingLoading } = useFanPosts("pending", 50);
  const { data: approvedPosts, isLoading: approvedLoading } = useFanPosts("approved", 50);
  const { data: rejectedPosts, isLoading: rejectedLoading } = useFanPosts("rejected", 50);
  const updateStatus = useUpdateFanPostStatus();
  
  const { data: driverComments, isLoading: commentsLoading } = useDriverCommentsModeration();
  const updateCommentStatus = useUpdateDriverCommentStatus();
  
  const { data: teamComments, isLoading: teamCommentsLoading } = useTeamCommentsModeration();
  const updateTeamCommentStatus = useUpdateTeamCommentStatus();
  
  const { data: teamPrincipalComments, isLoading: teamPrincipalCommentsLoading } = useTeamPrincipalCommentsModeration();
  const updateTeamPrincipalCommentStatus = useUpdateTeamPrincipalCommentStatus();
  
  const { data: trackComments, isLoading: trackCommentsLoading } = useTrackCommentsModeration();
  const updateTrackCommentStatus = useUpdateTrackCommentStatus();
  
  const { data: fanPostComments, isLoading: fanPostCommentsLoading } = useFanPostCommentsModeration();
  const updateFanPostCommentStatus = useUpdateFanPostCommentStatus();
  
  const { data: spotlightPost } = useSpotlightPost();
  const setSpotlight = useSetSpotlight();
  const removeSpotlight = useRemoveSpotlight();
  
  const pendingDriverComments = driverComments?.filter(c => c.status === 'pending') || [];
  const approvedDriverComments = driverComments?.filter(c => c.status === 'approved') || [];
  const rejectedDriverComments = driverComments?.filter(c => c.status === 'rejected') || [];
  
  const pendingTeamComments = teamComments?.filter(c => c.status === 'pending') || [];
  const approvedTeamComments = teamComments?.filter(c => c.status === 'approved') || [];
  const rejectedTeamComments = teamComments?.filter(c => c.status === 'rejected') || [];
  
  const pendingTeamPrincipalComments = teamPrincipalComments?.filter(c => c.status === 'pending') || [];
  const approvedTeamPrincipalComments = teamPrincipalComments?.filter(c => c.status === 'approved') || [];
  const rejectedTeamPrincipalComments = teamPrincipalComments?.filter(c => c.status === 'rejected') || [];
  
  const pendingTrackComments = trackComments?.filter(c => c.status === 'pending') || [];
  const approvedTrackComments = trackComments?.filter(c => c.status === 'approved') || [];
  const rejectedTrackComments = trackComments?.filter(c => c.status === 'rejected') || [];
  
  const pendingFanPostComments = fanPostComments?.filter(c => c.status === 'pending') || [];
  const approvedFanPostComments = fanPostComments?.filter(c => c.status === 'approved') || [];
  const rejectedFanPostComments = fanPostComments?.filter(c => c.status === 'rejected') || [];

  const handleApprove = (postId: string) => {
    updateStatus.mutate({ id: postId, status: "approved" });
  };

  const handleReject = (postId: string) => {
    updateStatus.mutate({ id: postId, status: "rejected" });
  };

  const handleCommentApprove = (commentId: string) => {
    updateCommentStatus.mutate({ commentId, status: "approved" });
  };

  const handleCommentReject = (commentId: string) => {
    updateCommentStatus.mutate({ commentId, status: "rejected" });
  };

  const handleTeamCommentApprove = (commentId: string) => {
    updateTeamCommentStatus.mutate({ commentId, status: "approved" });
  };

  const handleTeamCommentReject = (commentId: string) => {
    updateTeamCommentStatus.mutate({ commentId, status: "rejected" });
  };

  const handleTeamPrincipalCommentApprove = (commentId: string) => {
    updateTeamPrincipalCommentStatus.mutate({ commentId, status: "approved" });
  };

  const handleTeamPrincipalCommentReject = (commentId: string) => {
    updateTeamPrincipalCommentStatus.mutate({ commentId, status: "rejected" });
  };

  const handleTrackCommentApprove = (commentId: string) => {
    updateTrackCommentStatus.mutate({ commentId, status: "approved" });
  };

  const handleTrackCommentReject = (commentId: string) => {
    updateTrackCommentStatus.mutate({ commentId, status: "rejected" });
  };

  const handleFanPostCommentApprove = (commentId: string) => {
    updateFanPostCommentStatus.mutate({ commentId, status: "approved" });
  };

  const handleFanPostCommentReject = (commentId: string) => {
    updateFanPostCommentStatus.mutate({ commentId, status: "rejected" });
  };

  const handleSetSpotlight = (postId: string) => {
    setSpotlight.mutate(postId);
  };

  const handleRemoveSpotlight = (postId: string) => {
    removeSpotlight.mutate(postId);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "approved":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500";
      case "approved":
        return "bg-green-500";
      case "rejected":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const PostCard = ({ post, showActions = false }: { post: any; showActions?: boolean }) => (
    <Card key={post.id} className="rounded-2xl">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={post.profiles?.avatar_url} />
              <AvatarFallback>
                {post.profiles?.display_name?.[0] || post.profiles?.username?.[0] || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-foreground">
                {post.profiles?.display_name || post.profiles?.username || "Anonymous"}
              </p>
              <p className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {post.is_spotlight && (
              <Badge className="bg-yellow-500 text-white flex items-center gap-1">
                <Star className="h-3 w-3" />
                Spotlight
              </Badge>
            )}
            <Badge variant="secondary" className="flex items-center gap-1">
              {getStatusIcon(post.status)}
              <span className="capitalize">{post.status}</span>
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-2xl overflow-hidden">
          <img 
            src={post.image_url} 
            alt="Fan post" 
            className="w-full h-64 object-cover"
          />
        </div>
        
        {post.caption && (
          <p className="text-foreground">{post.caption}</p>
        )}

        {showActions && (
          <div className="space-y-2">
            <div className="flex gap-2">
              <Button
                onClick={() => handleApprove(post.id)}
                disabled={updateStatus.isPending}
                size="sm"
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                <Check className="h-4 w-4 mr-2" />
                Approve
              </Button>
              <Button
                onClick={() => handleReject(post.id)}
                disabled={updateStatus.isPending}
                variant="destructive"
                size="sm"
                className="flex-1"
              >
                <X className="h-4 w-4 mr-2" />
                Reject
              </Button>
            </div>
          </div>
        )}
        
        {post.status === 'approved' && (
          <div className="pt-2 border-t border-border space-y-3">
            {post.is_spotlight ? (
              <Button
                onClick={() => handleRemoveSpotlight(post.id)}
                disabled={removeSpotlight.isPending}
                variant="outline"
                size="sm"
                className="w-full"
              >
                <Star className="h-4 w-4 mr-2" />
                Remove from Spotlight
              </Button>
            ) : (
              <Button
                onClick={() => handleSetSpotlight(post.id)}
                disabled={setSpotlight.isPending || !!spotlightPost}
                variant="outline"
                size="sm"
                className="w-full"
              >
                <Star className="h-4 w-4 mr-2" />
                {spotlightPost ? 'Another post is spotlighted' : 'Set as Spotlight'}
              </Button>
            )}
            
            <DriverTagSelector fanPostId={post.id} />
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Content Moderation</h1>
          <p className="text-muted-foreground">
            Review and moderate fan-submitted posts and driver comments
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">Pending Posts</span>
              <span className="sm:hidden">Posts</span>
              ({pendingPosts?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="approved" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Approved Posts</span>
              <span className="sm:hidden">✓ Posts</span>
              ({approvedPosts?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="rejected" className="flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Rejected Posts</span>
              <span className="sm:hidden">✗ Posts</span>
              ({rejectedPosts?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="pending-driver-comments" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Driver Comments</span>
              <span className="sm:hidden">Driver</span>
              ({pendingDriverComments?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="pending-team-comments" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Team Comments</span>
              <span className="sm:hidden">Team</span>
              ({pendingTeamComments?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="pending-track-comments" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Track Comments</span>
              <span className="sm:hidden">Track</span>
              ({pendingTrackComments?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {pendingLoading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading pending posts...</p>
              </div>
            ) : pendingPosts?.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No pending posts to review</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pendingPosts?.map((post) => (
                  <PostCard key={post.id} post={post} showActions />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="approved" className="space-y-4">
            {approvedLoading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading approved posts...</p>
              </div>
            ) : approvedPosts?.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No approved posts yet</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {approvedPosts?.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="rejected" className="space-y-4">
            {rejectedLoading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading rejected posts...</p>
              </div>
            ) : rejectedPosts?.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No rejected posts</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rejectedPosts?.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Driver Comments */}
          <TabsContent value="pending-driver-comments" className="space-y-4">
            {commentsLoading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading pending driver comments...</p>
              </div>
            ) : pendingDriverComments?.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No pending driver comments to review</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingDriverComments?.map((comment) => (
                  <DriverCommentModerationCard 
                    key={comment.id} 
                    comment={comment} 
                    onApprove={handleCommentApprove}
                    onReject={handleCommentReject}
                    showActions 
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Team Comments */}
          <TabsContent value="pending-team-comments" className="space-y-4">
            {teamCommentsLoading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading pending team comments...</p>
              </div>
            ) : pendingTeamComments?.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No pending team comments to review</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingTeamComments?.map((comment) => (
                  <TeamCommentModerationCard 
                    key={comment.id} 
                    comment={comment} 
                    onApprove={handleTeamCommentApprove}
                    onReject={handleTeamCommentReject}
                    showActions 
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Track Comments */}
          <TabsContent value="pending-track-comments" className="space-y-4">
            {trackCommentsLoading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading pending track comments...</p>
              </div>
            ) : pendingTrackComments?.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No pending track comments to review</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingTrackComments?.map((comment) => (
                  <TrackCommentModerationCard 
                    key={comment.id} 
                    comment={comment} 
                    onApprove={handleTrackCommentApprove}
                    onReject={handleTrackCommentReject}
                    showActions 
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );

  // Driver Comment Moderation Card Component
  function DriverCommentModerationCard({ comment, onApprove, onReject, showActions = false }: { 
    comment: any; 
    onApprove: (id: string) => void;
    onReject: (id: string) => void;
    showActions?: boolean; 
  }) {
    return (
      <Card className="rounded-2xl">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={comment.profiles?.avatar_url} />
                <AvatarFallback>
                  {comment.profiles?.display_name?.[0] || comment.profiles?.username?.[0] || "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-foreground">
                  {comment.profiles?.display_name || comment.profiles?.username || "Anonymous"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                </p>
                <p className="text-sm text-muted-foreground">
                  Comment on: <span className="font-medium">{comment.drivers?.name}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="flex items-center gap-1">
                {getStatusIcon(comment.status)}
                <span className="capitalize">{comment.status}</span>
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-foreground whitespace-pre-wrap">{comment.content}</p>
          </div>

          {showActions && (
            <div className="flex gap-2 pt-2">
              <Button
                onClick={() => onApprove(comment.id)}
                disabled={updateCommentStatus.isPending}
                size="sm"
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                <Check className="h-4 w-4 mr-2" />
                Approve
              </Button>
              <Button
                onClick={() => onReject(comment.id)}
                disabled={updateCommentStatus.isPending}
                variant="destructive"
                size="sm"
                className="flex-1"
              >
                <X className="h-4 w-4 mr-2" />
                Reject
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Team Comment Moderation Card Component
  function TeamCommentModerationCard({ comment, onApprove, onReject, showActions = false }: { 
    comment: any; 
    onApprove: (id: string) => void;
    onReject: (id: string) => void;
    showActions?: boolean; 
  }) {
    return (
      <Card className="rounded-2xl">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={comment.profiles?.avatar_url} />
                <AvatarFallback>
                  {comment.profiles?.display_name?.[0] || comment.profiles?.username?.[0] || "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-foreground">
                  {comment.profiles?.display_name || comment.profiles?.username || "Anonymous"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                </p>
                <p className="text-sm text-muted-foreground">
                  Comment on team: <span className="font-medium">{comment.teams?.name || 'Unknown Team'}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="flex items-center gap-1">
                {getStatusIcon(comment.status)}
                <span className="capitalize">{comment.status}</span>
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-foreground whitespace-pre-wrap">{comment.content}</p>
          </div>

          {showActions && (
            <div className="flex gap-2 pt-2">
              <Button
                onClick={() => onApprove(comment.id)}
                disabled={updateTeamCommentStatus.isPending}
                size="sm"
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                <Check className="h-4 w-4 mr-2" />
                Approve
              </Button>
              <Button
                onClick={() => onReject(comment.id)}
                disabled={updateTeamCommentStatus.isPending}
                variant="destructive"
                size="sm"
                className="flex-1"
              >
                <X className="h-4 w-4 mr-2" />
                Reject
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Track Comment Moderation Card Component
  function TrackCommentModerationCard({ comment, onApprove, onReject, showActions = false }: { 
    comment: any; 
    onApprove: (id: string) => void;
    onReject: (id: string) => void;
    showActions?: boolean; 
  }) {
    return (
      <Card className="rounded-2xl">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={comment.profiles?.avatar_url} />
                <AvatarFallback>
                  {comment.profiles?.display_name?.[0] || comment.profiles?.username?.[0] || "U"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-foreground">
                  {comment.profiles?.display_name || comment.profiles?.username || "Anonymous"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                </p>
                <p className="text-sm text-muted-foreground">
                  Comment on track: <span className="font-medium">{comment.tracks?.name || 'Unknown Track'}</span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="flex items-center gap-1">
                {getStatusIcon(comment.status)}
                <span className="capitalize">{comment.status}</span>
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-foreground whitespace-pre-wrap">{comment.content}</p>
          </div>

          {showActions && (
            <div className="flex gap-2 pt-2">
              <Button
                onClick={() => onApprove(comment.id)}
                disabled={updateTrackCommentStatus.isPending}
                size="sm"
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                <Check className="h-4 w-4 mr-2" />
                Approve
              </Button>
              <Button
                onClick={() => onReject(comment.id)}
                disabled={updateTrackCommentStatus.isPending}
                variant="destructive"
                size="sm"
                className="flex-1"
              >
                <X className="h-4 w-4 mr-2" />
                Reject
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }
};

export default Moderation;