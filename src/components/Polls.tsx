import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, Users, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { usePolls } from "@/hooks/usePolls";
import { formatDistanceToNow } from "date-fns";
import { PodiumDisplay } from "@/components/PodiumDisplay";

const getTimeAgo = (dateString: string) => {
  return formatDistanceToNow(new Date(dateString), { addSuffix: true });
};

const formatVoteCount = (count: number) => {
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k votes`;
  }
  return `${count} votes`;
};

const Polls = () => {
  const { data: polls, isLoading, error } = usePolls(3);

  if (isLoading) {
    return (
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-2 mb-4">
              <BarChart3 className="h-6 w-6 text-accent" />
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                Hot Polls
              </h2>
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Vote on the biggest racing debates and see what the community thinks
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="rounded-2xl">
                <CardHeader className="pb-4">
                  <Skeleton className="h-6 w-3/4" />
                  <div className="flex gap-4 mt-3">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[1, 2, 3, 4].map((j) => (
                    <div key={j} className="space-y-2">
                      <div className="flex justify-between">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-8" />
                      </div>
                      <Skeleton className="h-2 w-full rounded-2xl" />
                    </div>
                  ))}
                  <Skeleton className="h-8 w-full rounded-2xl mt-6" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error || !polls || polls.length === 0) {
    return (
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-2 mb-4">
              <BarChart3 className="h-6 w-6 text-accent" />
              <h2 className="text-3xl md:text-4xl font-bold text-foreground">
                Hot Polls
              </h2>
            </div>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Vote on the biggest racing debates and see what the community thinks
            </p>
          </div>

          <div className="text-center py-12">
            <p className="text-muted-foreground">No active polls at the moment. Check back soon!</p>
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
            <BarChart3 className="h-6 w-6 text-accent" />
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Hot Polls
            </h2>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Vote on the biggest racing debates and see what the community thinks
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {polls.map((poll) => (
            <Card key={poll.id} className="rounded-2xl shadow-racing transition-racing hover:shadow-glow">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg font-bold text-foreground leading-tight">
                    {poll.title}
                  </CardTitle>
                  <Badge 
                    variant="secondary" 
                    className="text-xs font-medium capitalize"
                  >
                    {poll.status}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">{getTimeAgo(poll.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span className="text-sm">{formatVoteCount(poll.vote_count)}</span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Poll Display */}
                {poll.status === 'closed' && poll.options.length > 0 ? (
                  <div className="mb-4">
                    <PodiumDisplay 
                      options={poll.options.map(opt => ({
                        id: opt.id,
                        label: opt.label,
                        vote_count: opt.vote_count || 0,
                        percentage: opt.percentage || 0
                      }))}
                      compact
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {poll.options.slice(0, 4).map((option) => (
                      <div key={option.id} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-foreground">{option.label}</span>
                          <span className="text-muted-foreground">{option.percentage}%</span>
                        </div>
                        <Progress 
                          value={option.percentage} 
                          className="h-2 rounded-2xl"
                        />
                      </div>
                    ))}
                  </div>
                )}

                <Link to={`/polls/${poll.id}`}>
                  <Button 
                    className="w-full mt-6 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground"
                    size="sm"
                  >
                    {poll.status === 'closed' ? 'View Results' : 'Cast Your Vote'}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link to="/polls">
            <Button variant="outline" size="lg" className="rounded-2xl px-8">
              View All Polls
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Polls;