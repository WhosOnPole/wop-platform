import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { useDriverFanPosts } from '@/hooks/useDriverFanPosts';
import { Skeleton } from '@/components/ui/skeleton';
import { Heart, MessageCircle, Share2 } from 'lucide-react';
import { UniversalLikeButton } from '@/components/UniversalLikeButton';
import { FanPostCommentSection } from '@/components/FanPostCommentSection';
import { useFanPostCommentCount } from '@/hooks/useFanPostComments';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';

interface DriverFanPostsProps {
  driverId: string;
  driverName: string;
}

interface PostInteractionsProps {
  fanPostId: string;
  onCommentClick: () => void;
}

const PostInteractions = ({ fanPostId, onCommentClick }: PostInteractionsProps) => {
  const { data: commentCount = 0 } = useFanPostCommentCount(fanPostId);

  return (
    <div className="flex items-center justify-between text-sm text-muted-foreground">
      <div className="flex items-center gap-4">
        <UniversalLikeButton id={fanPostId} type="fan_post" />
        <button 
          className="flex items-center gap-1 hover:text-blue-500 transition-colors"
          onClick={onCommentClick}
        >
          <MessageCircle className="h-4 w-4" />
          <span>{commentCount}</span>
        </button>
        <button className="flex items-center gap-1 hover:text-green-500 transition-colors">
          <Share2 className="h-4 w-4" />
          <span>Share</span>
        </button>
      </div>
    </div>
  );
};

export const DriverFanPosts = ({ driverId, driverName }: DriverFanPostsProps) => {
  const { data: fanPosts, isLoading } = useDriverFanPosts(driverId, 6);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Fan Highlights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!fanPosts || fanPosts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Fan Highlights</CardTitle>
          <p className="text-sm text-muted-foreground">
            Fan posts featuring {driverName}
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Heart className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Fan Posts Yet</h3>
            <p className="text-muted-foreground max-w-md">
              Be the first to create a fan post featuring {driverName}! Share your racing passion and connect with the community.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Fan Highlights</CardTitle>
        <p className="text-sm text-muted-foreground">
          {fanPosts.length} fan post{fanPosts.length !== 1 ? 's' : ''} featuring {driverName}
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {fanPosts.map((post) => (
            <div key={post.id} className="group cursor-pointer">
              <div className="relative overflow-hidden rounded-lg bg-muted aspect-[4/3] mb-4">
                <img
                  src={post.image_url}
                  alt={post.caption || 'Fan post'}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Avatar className="w-7 h-7">
                    <AvatarImage src={post.profiles.avatar_url || undefined} />
                    <AvatarFallback className="text-xs">
                      {post.profiles.display_name?.[0] || post.profiles.username[0]}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">
                    {post.profiles.display_name || post.profiles.username}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                  </Badge>
                </div>
                
                {post.caption && (
                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                    {post.caption}
                  </p>
                )}
                
                <PostInteractions 
                  fanPostId={post.id} 
                  onCommentClick={() => setSelectedPostId(post.id)}
                />
              </div>
            </div>
          ))}
        </div>
        
        {fanPosts.length >= 6 && (
          <div className="mt-6 text-center">
            <button className="text-sm text-primary hover:underline">
              View All Fan Posts Featuring {driverName}
            </button>
          </div>
        )}
      </CardContent>

      {/* Comment Dialog */}
      <Dialog open={!!selectedPostId} onOpenChange={(open) => !open && setSelectedPostId(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedPostId && (
            <FanPostCommentSection fanPostId={selectedPostId} isExpanded={true} />
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};