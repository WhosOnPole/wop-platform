import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Heart, Share } from "lucide-react";
import { useSpotlightPost } from "@/hooks/useSpotlight";
import { formatDistanceToNow } from "date-fns";

const FanFeature = () => {
  const { data: spotlightPost, isLoading } = useSpotlightPost();

  if (isLoading) {
    return (
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-4 rounded-2xl bg-accent text-accent-foreground">
              Fan Feature
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Spotlight: Racing Passion
            </h2>
            <p className="text-lg text-muted-foreground">
              Celebrating the voices and stories of our amazing racing community
            </p>
          </div>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </section>
    );
  }

  if (!spotlightPost) {
    return (
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <Badge className="mb-4 rounded-2xl bg-accent text-accent-foreground">
              Fan Feature
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Spotlight: Racing Passion
            </h2>
            <p className="text-lg text-muted-foreground">
              Celebrating the voices and stories of our amazing racing community
            </p>
          </div>
          <Card className="rounded-2xl shadow-racing overflow-hidden">
            <div className="p-12 text-center">
              <h3 className="text-xl font-semibold text-muted-foreground mb-2">
                No Spotlight Post Yet
              </h3>
              <p className="text-muted-foreground">
                Check back soon for featured content from our amazing community!
              </p>
            </div>
          </Card>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 px-4 bg-muted/30">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <Badge className="mb-4 rounded-2xl bg-accent text-accent-foreground">
            Fan Feature
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Spotlight: Racing Passion
          </h2>
          <p className="text-lg text-muted-foreground">
            Celebrating the voices and stories of our amazing racing community
          </p>
        </div>

        <Card className="rounded-2xl shadow-racing overflow-hidden">
          <div className="grid md:grid-cols-2 gap-0">
            {/* Image Side */}
            <div className="relative h-64 md:h-auto">
              <img
                src={spotlightPost.image_url}
                alt="Spotlight fan post"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 gradient-hero opacity-20"></div>
            </div>

            {/* Content Side */}
            <div className="p-8 flex flex-col justify-center">
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <img
                    src={spotlightPost.profiles?.avatar_url || "https://images.unsplash.com/photo-1494790108755-2616b612b1a8?w=60&h=60&fit=crop&crop=face"}
                    alt={`${spotlightPost.profiles?.username || 'Fan'} profile`}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <h3 className="font-bold text-foreground">
                      @{spotlightPost.profiles?.username || 'RacingFan'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {spotlightPost.profiles?.display_name || 'Racing Enthusiast'} • {formatDistanceToNow(new Date(spotlightPost.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                
                <blockquote className="text-lg md:text-xl text-foreground leading-relaxed font-medium">
                  {spotlightPost.caption || "Sharing the passion for racing! 🏁"}
                </blockquote>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Heart className="h-4 w-4" />
                    <span className="text-sm">Featured</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <MessageCircle className="h-4 w-4" />
                    <span className="text-sm">Community</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Share className="h-4 w-4" />
                    <span className="text-sm">Love</span>
                  </div>
                </div>
                
                <Badge className="rounded-2xl bg-secondary text-secondary-foreground">
                  Spotlight Post
                </Badge>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
};

export default FanFeature;