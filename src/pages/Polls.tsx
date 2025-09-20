import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Users, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/Navigation";
import PageHeader from "@/components/PageHeader";

interface Poll {
  id: string;
  title: string;
  type: string;
  status: string;
  created_at: string;
  updated_at: string;
  total_votes?: number;
}

const Polls = () => {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchPolls();
  }, []);

  const fetchPolls = async () => {
    try {
      const { data: pollsData, error: pollsError } = await supabase
        .from('polls')
        .select('*')
        .order('created_at', { ascending: false });

      if (pollsError) throw pollsError;

      // Get vote counts for each poll
      const pollsWithVotes = await Promise.all(
        (pollsData || []).map(async (poll) => {
          const { count } = await supabase
            .from('votes')
            .select('*', { count: 'exact', head: true })
            .eq('poll_id', poll.id);

          return {
            ...poll,
            total_votes: count || 0
          };
        })
      );

      setPolls(pollsWithVotes);
    } catch (error) {
      console.error('Error fetching polls:', error);
      toast({
        title: "Error",
        description: "Failed to load polls",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live': return 'bg-success text-success-foreground';
      case 'closed': return 'bg-muted text-muted-foreground';
      case 'draft': return 'bg-warning text-warning-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <PageHeader title="Community Polls" />
        <div className="container mx-auto px-4 pb-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="rounded-2xl animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-3/4"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-4 bg-muted rounded w-full mb-2"></div>
                  <div className="h-4 bg-muted rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <PageHeader title="Community Polls" />
      <div className="container mx-auto px-4 pb-8">

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {polls.map((poll) => (
            <Card key={poll.id} className="rounded-2xl shadow-racing transition-racing hover:shadow-glow">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg font-bold text-foreground leading-tight">
                    {poll.title}
                  </CardTitle>
                  <Badge className={getStatusColor(poll.status)} variant="outline">
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
                    <span className="text-sm">{poll.total_votes} votes</span>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="capitalize">
                    {poll.type} choice
                  </Badge>
                  <Link to={`/polls/${poll.id}`}>
                    <Button 
                      className="rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground"
                      size="sm"
                    >
                      {poll.status === 'live' ? 'Vote Now' : 'View Results'}
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {polls.length === 0 && (
          <div className="text-center py-12">
            <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">No Polls Yet</h2>
            <p className="text-muted-foreground">
              Check back soon for community polls and voting opportunities!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Polls;