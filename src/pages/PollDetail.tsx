import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Users, Clock, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import Navigation from "@/components/Navigation";
import PageHeader from "@/components/PageHeader";
import { PodiumDisplay } from "@/components/PodiumDisplay";

interface Poll {
  id: string;
  title: string;
  type: 'single' | 'bracket';
  status: 'draft' | 'live' | 'closed';
  created_at: string;
}

interface PollOption {
  id: string;
  poll_id: string;
  label: string;
  metadata: any;
  vote_count?: number;
  percentage?: number;
}

interface Vote {
  id: string;
  poll_id: string;
  option_id: string;
  user_id: string;
}

const PollDetail = () => {
  const { pollId } = useParams<{ pollId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [poll, setPoll] = useState<Poll | null>(null);
  const [options, setOptions] = useState<PollOption[]>([]);
  const [userVote, setUserVote] = useState<Vote | null>(null);
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [totalVotes, setTotalVotes] = useState(0);

  useEffect(() => {
    if (pollId) {
      console.log('Poll ID from URL params:', pollId);
      fetchPollData();
    } else {
      console.error('No poll ID in URL params');
      setLoading(false);
    }
  }, [pollId]);

  useEffect(() => {
    if (!pollId) return;

    // Set up real-time subscription for votes
    const channel = supabase
      .channel('poll-votes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'votes',
          filter: `poll_id=eq.${pollId}`
        },
        () => {
          fetchVoteCounts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [pollId]);

  const fetchPollData = async () => {
    if (!pollId) {
      console.error('No poll ID provided');
      setLoading(false);
      return;
    }

    console.log('Fetching poll data for ID:', pollId);
    
    try {
      const [pollResult, optionsResult, userVoteResult] = await Promise.all([
        supabase.from('polls').select('*').eq('id', pollId).maybeSingle(),
        supabase.from('poll_options').select('*').eq('poll_id', pollId),
        user ? supabase.from('votes').select('*').eq('poll_id', pollId).eq('user_id', user.id).maybeSingle() : { data: null, error: null }
      ]);

      console.log('Poll query result:', pollResult);
      console.log('Options query result:', optionsResult);
      console.log('User vote query result:', userVoteResult);

      if (pollResult.error) {
        console.error('Poll query error:', pollResult.error);
        throw pollResult.error;
      }
      if (optionsResult.error) {
        console.error('Options query error:', optionsResult.error);
        throw optionsResult.error;
      }

      if (!pollResult.data) {
        console.error('Poll not found for ID:', pollId);
        setPoll(null);
        setLoading(false);
        return;
      }

      setPoll(pollResult.data as Poll);
      setOptions(optionsResult.data || []);
      setUserVote(userVoteResult.data);

      if (userVoteResult.data) {
        setSelectedOption(userVoteResult.data.option_id);
      }

      await fetchVoteCounts();
    } catch (error) {
      console.error('Error fetching poll data:', error);
      toast({
        title: "Error", 
        description: "Failed to load poll data",
        variant: "destructive",
      });
      setPoll(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchVoteCounts = async () => {
    if (!pollId) return;

    try {
      const { data: votes, error } = await supabase
        .from('votes')
        .select('option_id')
        .eq('poll_id', pollId);

      if (error) throw error;

      const voteCounts = (votes || []).reduce((acc, vote) => {
        acc[vote.option_id] = (acc[vote.option_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const total = Object.values(voteCounts).reduce((sum, count) => sum + count, 0);
      setTotalVotes(total);

      setOptions(prev => prev.map(option => ({
        ...option,
        vote_count: voteCounts[option.id] || 0,
        percentage: total > 0 ? Math.round(((voteCounts[option.id] || 0) / total) * 100) : 0
      })));
    } catch (error) {
      console.error('Error fetching vote counts:', error);
    }
  };

  const handleVote = async () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to vote",
        variant: "destructive",
      });
      return;
    }

    if (!selectedOption) {
      toast({
        title: "No option selected",
        description: "Please select an option to vote",
        variant: "destructive",
      });
      return;
    }

    setVoting(true);
    try {
      console.log('Casting vote via edge function:', { poll_id: pollId, option_id: selectedOption });
      
      // Use the castVote edge function instead of direct database operations
      const { data, error } = await supabase.functions.invoke('castVote', {
        body: {
          poll_id: pollId,
          option_id: selectedOption
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Failed to cast vote');
      }

      if (!data.success) {
        console.error('Vote casting failed:', data.error);
        throw new Error(data.error || 'Failed to cast vote');
      }

      console.log('Vote cast successfully:', data);

      // Update local state with the response from edge function
      setUserVote(data.vote);
      setTotalVotes(data.totalVotes);

      // Update options with new vote counts and percentages
      if (data.voteCounts) {
        setOptions(prev => prev.map(option => {
          const voteCount = data.voteCounts[option.id] || 0;
          const percentage = data.totalVotes > 0 ? Math.round((voteCount / data.totalVotes) * 100) : 0;
          return {
            ...option,
            vote_count: voteCount,
            percentage: percentage
          };
        }));
      }

      // Show success message
      const isUpdate = data.updated === 'updated';
      toast({
        title: isUpdate ? "Vote updated!" : "Vote cast!",
        description: isUpdate ? "Your vote has been updated successfully" : "Thank you for participating in this poll",
      });

    } catch (error) {
      console.error('Error voting:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to cast vote. Please try again.",
        variant: "destructive",
      });
    } finally {
      setVoting(false);
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
        <PageHeader title="Loading Poll..." />
        <div className="container mx-auto px-4 pb-8">
          <div className="max-w-2xl mx-auto">
            <Card className="rounded-2xl">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-3/4 animate-pulse"></div>
                <div className="h-4 bg-muted rounded w-1/2 animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-12 bg-muted rounded animate-pulse"></div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">Poll not found</h2>
          <p className="text-muted-foreground mb-4">The poll you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/polls')} className="rounded-2xl">
            Back to Polls
          </Button>
        </div>
      </div>
    );
  }

  const canVote = poll.status === 'live' && user;
  const showResults = poll.status === 'closed' || userVote;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <PageHeader title={poll.title} backButtonText="Back to Polls" />
      <div className="container mx-auto px-4 pb-8">
        <div className="max-w-2xl mx-auto">

          <Card className="rounded-2xl shadow-racing">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <CardTitle className="text-2xl font-bold text-foreground mb-2">
                    {poll.title}
                  </CardTitle>
                  <div className="flex items-center gap-4">
                    <Badge className={getStatusColor(poll.status)} variant="outline">
                      {poll.status}
                    </Badge>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm">{getTimeAgo(poll.created_at)}</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span className="text-sm">{totalVotes} votes</span>
                    </div>
                  </div>
                </div>
                {userVote && (
                  <div className="flex items-center gap-2 text-success">
                    <CheckCircle className="h-5 w-5" />
                    <span className="text-sm font-medium">Voted</span>
                  </div>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {canVote && !userVote ? (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Cast your vote:</h3>
                  <RadioGroup value={selectedOption} onValueChange={setSelectedOption}>
                    {options.map((option) => (
                      <div key={option.id} className="flex items-center space-x-2">
                        <RadioGroupItem value={option.id} id={option.id} />
                        <Label htmlFor={option.id} className="text-foreground">
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                  <Button
                    onClick={handleVote}
                    disabled={!selectedOption || voting}
                    className="w-full rounded-2xl bg-primary hover:bg-primary/90"
                  >
                    {voting ? "Voting..." : "Cast Vote"}
                  </Button>
                </div>
              ) : (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-foreground">Results:</h3>
                  
                  {/* Podium Display for Closed Polls */}
                  {poll.status === 'closed' && options.length > 0 && (
                    <div className="mb-6">
                      <PodiumDisplay 
                        options={options.map(opt => ({
                          id: opt.id,
                          label: opt.label,
                          vote_count: opt.vote_count || 0,
                          percentage: opt.percentage || 0
                        }))}
                      />
                    </div>
                  )}
                  
                  {/* Detailed Results */}
                  <div className="space-y-4">
                    {options.map((option) => (
                      <div key={option.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className={`font-medium ${userVote?.option_id === option.id ? 'text-primary' : 'text-foreground'}`}>
                            {option.label}
                            {userVote?.option_id === option.id && " (Your vote)"}
                          </span>
                          <span className="text-muted-foreground">
                            {option.percentage || 0}% ({option.vote_count || 0} votes)
                          </span>
                        </div>
                        <Progress 
                          value={option.percentage || 0} 
                          className="h-3 rounded-2xl"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {canVote && userVote && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Change your vote:</h3>
                  <RadioGroup value={selectedOption} onValueChange={setSelectedOption}>
                    {options.map((option) => (
                      <div key={option.id} className="flex items-center space-x-2">
                        <RadioGroupItem value={option.id} id={`change-${option.id}`} />
                        <Label htmlFor={`change-${option.id}`} className="text-foreground">
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                  <Button
                    onClick={handleVote}
                    disabled={selectedOption === userVote.option_id || voting}
                    className="w-full rounded-2xl bg-primary hover:bg-primary/90"
                  >
                    {voting ? "Updating..." : "Update Vote"}
                  </Button>
                </div>
              )}

              {!user && poll.status === 'live' && (
                <div className="text-center p-4 bg-muted rounded-2xl">
                  <p className="text-muted-foreground mb-2">Sign in to participate in this poll</p>
                  <Button variant="outline" className="rounded-2xl">
                    Sign In
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PollDetail;