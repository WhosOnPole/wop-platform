import { Link, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, MapPin, User, Briefcase, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Navigation from '@/components/Navigation';
import PageHeader from '@/components/PageHeader';
import { useTeamPrincipal } from '@/hooks/useTeamPrincipals';
import { useTeams } from '@/hooks/useTeams';
import TeamPrincipalComments from '@/components/TeamPrincipalComments';
import QuoteCard from '@/components/QuoteCard';

const TeamPrincipalDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { data: teamPrincipal, isLoading: principalLoading } = useTeamPrincipal(id!);
  const { data: allTeams } = useTeams();

  // Find the team for this principal
  const team = allTeams?.find(t => t.id === teamPrincipal?.team_id);

  if (principalLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="pt-20 pb-12">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="mb-6">
              <Skeleton className="h-10 w-32 mb-4" />
              <Skeleton className="h-12 w-80" />
            </div>
            <div className="space-y-6">
              <Card>
                <CardContent className="p-8">
                  <div className="flex flex-col md:flex-row gap-6">
                    <Skeleton className="w-32 h-32 rounded-lg mx-auto md:mx-0" />
                    <div className="flex-1 space-y-4">
                      <Skeleton className="h-8 w-64" />
                      <Skeleton className="h-6 w-32" />
                      <Skeleton className="h-6 w-40" />
                      <Skeleton className="h-24 w-full" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!teamPrincipal) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="pt-20 pb-12">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="text-center py-12">
              <h1 className="text-2xl font-bold mb-4">Team Principal Not Found</h1>
              <p className="text-muted-foreground mb-6">The team principal you're looking for doesn't exist.</p>
              <Link to="/team-principals">
                <Button>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Team Principals
                </Button>
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{teamPrincipal.name} - Who's On Pole?</title>
        <meta name="description" content={`Learn about ${teamPrincipal.name}, team principal from ${teamPrincipal.country}. ${teamPrincipal.bio || ''}`} />
        
        {/* OpenGraph tags */}
        <meta property="og:title" content={`${teamPrincipal.name} - Who's On Pole?`} />
        <meta property="og:description" content={`Learn about ${teamPrincipal.name}, team principal from ${teamPrincipal.country}.`} />
        <meta property="og:type" content="profile" />
        <meta property="og:url" content={`https://whoonpole.com/team-principals/${teamPrincipal.id}`} />
        {teamPrincipal.photo_url && <meta property="og:image" content={teamPrincipal.photo_url} />}
        <meta property="og:site_name" content="Who's On Pole?" />
        
        {/* Twitter Card tags */}
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={`${teamPrincipal.name} - Who's On Pole?`} />
        <meta name="twitter:description" content={`Learn about ${teamPrincipal.name}, team principal from ${teamPrincipal.country}.`} />
        {teamPrincipal.photo_url && <meta name="twitter:image" content={teamPrincipal.photo_url} />}
        
        {/* Structured Data (JSON-LD) */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Person",
            "name": teamPrincipal.name,
            "description": teamPrincipal.bio || `${teamPrincipal.name} is a team principal from ${teamPrincipal.country}.`,
            "image": teamPrincipal.photo_url,
            "url": `https://whoonpole.com/team-principals/${teamPrincipal.id}`,
            "nationality": teamPrincipal.country,
            "jobTitle": "Team Principal",
            "worksFor": team ? {
              "@type": "SportsTeam",
              "name": team.name
            } : undefined,
            "mainEntityOfPage": {
              "@type": "WebPage",
              "@id": `https://whoonpole.com/team-principals/${teamPrincipal.id}`
            }
          })}
        </script>
      </Helmet>
      
      <Navigation />
      <PageHeader title={teamPrincipal.name} backButtonText="Back to Team Principals" />
      
      <main className="pb-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {/* Team Principal Profile Card */}
              <Card>
                <CardContent className="p-8">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="w-32 h-32 rounded-lg bg-muted flex items-center justify-center overflow-hidden mx-auto md:mx-0">
                      {teamPrincipal.photo_url ? (
                        <Avatar className="w-32 h-32">
                          <AvatarImage src={teamPrincipal.photo_url} alt={teamPrincipal.name} />
                          <AvatarFallback className="text-2xl font-bold">
                            {teamPrincipal.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <div className="w-16 h-16 bg-secondary rounded-lg flex items-center justify-center text-2xl font-bold">
                          {teamPrincipal.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 text-center md:text-left">
                      <h2 className="text-2xl font-bold mb-4">{teamPrincipal.name}</h2>
                      
                      <div className="flex flex-wrap gap-3 justify-center md:justify-start mb-4">
                        <Badge variant="secondary" className="text-sm">
                          <MapPin className="w-4 h-4 mr-1" />
                          {teamPrincipal.country}
                        </Badge>
                        <Badge variant="outline" className="text-sm">
                          <User className="w-4 h-4 mr-1" />
                          Team Principal
                        </Badge>
                        {team && (
                          <Badge variant="outline" className="text-sm">
                            <Briefcase className="w-4 h-4 mr-1" />
                            {team.name}
                          </Badge>
                        )}
                        {teamPrincipal.years_with_team && (
                          <Badge variant="outline" className="text-sm">
                            <Clock className="w-4 h-4 mr-1" />
                            {teamPrincipal.years_with_team} years
                          </Badge>
                        )}
                      </div>

                      {teamPrincipal.bio && (
                        <div>
                          <h3 className="font-semibold mb-2">Biography</h3>
                          <p className="text-muted-foreground leading-relaxed">
                            {teamPrincipal.bio}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

               {/* Quote Section */}
               {teamPrincipal.quote && (
                 <QuoteCard 
                   quote={teamPrincipal.quote} 
                   author={teamPrincipal.name}
                   quoteAuthor={teamPrincipal.quote_author}
                   context="Team Principal"
                 />
               )}
            </div>

            <div className="space-y-6">
              {/* Stats Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Profile</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nationality</span>
                    <span className="font-semibold">{teamPrincipal.country}</span>
                  </div>
                  {team && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Current Team</span>
                      <span className="font-semibold">{team.name}</span>
                    </div>
                  )}
                  {teamPrincipal.years_with_team && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Years with Team</span>
                      <span className="font-semibold">{teamPrincipal.years_with_team}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Comments Section */}
            <div className="lg:col-span-3">
              <TeamPrincipalComments 
                teamPrincipalId={id!} 
                teamPrincipalName={teamPrincipal.name} 
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TeamPrincipalDetail;