import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, MessageCircle, Camera } from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "@/components/ui/carousel";
import { useFanPosts } from "@/hooks/useFanPosts";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const FanPostsCarousel = () => {
  const { data: posts, isLoading } = useFanPosts("approved", 10);
  const navigate = useNavigate();
  const { user } = useAuth();

  if (isLoading) {
    return (
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Camera className="h-6 w-6 text-accent" />
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                Fan Features
              </h2>
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Amazing moments captured by our racing community
            </p>
          </div>
          <div className="flex gap-4 overflow-hidden">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex-shrink-0 w-80">
                <Card className="rounded-2xl overflow-hidden">
                  <div className="h-64 bg-muted animate-pulse" />
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
                      <div className="space-y-2">
                        <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                        <div className="h-3 w-16 bg-muted animate-pulse rounded" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Camera className="h-6 w-6 text-accent" />
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                Fan Features
              </h2>
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Amazing moments captured by our racing community
            </p>
          </div>
          
          <div className="text-center py-12">
            <Camera className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-medium text-foreground mb-2">
              No fan features yet
            </h3>
            <p className="text-muted-foreground mb-6">
              Be the first to share your racing moments!
            </p>
            {user ? (
              <Button 
                onClick={() => navigate("/submit-feature")}
                size="lg"
                className="rounded-2xl"
              >
                Submit Your Photo
              </Button>
            ) : (
              <Button 
                onClick={() => navigate("/auth")}
                size="lg"
                className="rounded-2xl"
              >
                Sign Up to Share
              </Button>
            )}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Camera className="h-6 w-6 text-accent" />
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Fan Features
            </h2>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Amazing moments captured by our racing community
          </p>
        </div>

        <Carousel className="w-full">
          <CarouselContent className="gap-6">
            {posts.map((post) => (
              <CarouselItem key={post.id} className="md:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                <Card className="rounded-2xl overflow-hidden shadow-racing transition-racing hover:shadow-glow">
                  <div className="relative">
                    <img 
                      src={post.image_url} 
                      alt="Fan post" 
                      className="w-full h-64 object-cover"
                    />
                  </div>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={post.profiles?.avatar_url} />
                        <AvatarFallback>
                          {post.profiles?.display_name?.[0] || post.profiles?.username?.[0] || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-foreground">
                          {post.profiles?.display_name || post.profiles?.username || "Racing Fan"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                    
                    {post.caption && (
                      <p className="text-foreground text-sm mb-3 line-clamp-2">
                        {post.caption}
                      </p>
                    )}
                    
                    <div className="flex items-center gap-4 text-muted-foreground">
                      <button className="flex items-center gap-1 hover:text-accent transition-colors">
                        <Heart className="h-4 w-4" />
                        <span className="text-sm">Like</span>
                      </button>
                      <button className="flex items-center gap-1 hover:text-accent transition-colors">
                        <MessageCircle className="h-4 w-4" />
                        <span className="text-sm">Comment</span>
                      </button>
                    </div>
                  </CardContent>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>

        <div className="text-center mt-8">
          {user ? (
            <Button 
              onClick={() => navigate("/submit-feature")}
              variant="outline" 
              size="lg" 
              className="rounded-2xl px-8"
            >
              Share Your Moment
            </Button>
          ) : (
            <Button 
              onClick={() => navigate("/auth")}
              variant="outline" 
              size="lg" 
              className="rounded-2xl px-8"
            >
              Sign Up to Share
            </Button>
          )}
        </div>
      </div>
    </section>
  );
};

export default FanPostsCarousel;