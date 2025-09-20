import { Link, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, MapPin, Trophy, User, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Navigation from '@/components/Navigation';
import PageHeader from '@/components/PageHeader';
import { useTeam } from '@/hooks/useTeams';
import { useDrivers } from '@/hooks/useDrivers';
import { useTeamPrincipals } from '@/hooks/useTeamPrincipals';
import { RedditStyleCommentSection } from '@/components/RedditStyleCommentSection';
import { TeamCommentForm } from '@/components/TeamCommentForm';
import QuoteCard from '@/components/QuoteCard';
import { ExpandableBio } from '@/components/ExpandableBio';

const TeamDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { data: team, isLoading: teamLoading } = useTeam(id!);
  const { data: allDrivers } = useDrivers();
  const { data: allTeamPrincipals } = useTeamPrincipals();

  // Filter drivers for this team
  const teamDrivers = allDrivers?.filter(driver => driver.team_id === id) || [];
  
  // Find team principal for this team
  const teamPrincipal = allTeamPrincipals?.find(principal => principal.team_id === id);

  if (teamLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="pt-20 pb-12">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="mb-6">
              <Skeleton className="h-10 w-32 mb-4" />
              <Skeleton className="h-12 w-80" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
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
              <div>
                <Skeleton className="h-96 w-full" />
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="pt-20 pb-12">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="text-center py-12">
              <h1 className="text-2xl font-bold mb-4">Team Not Found</h1>
              <p className="text-muted-foreground mb-6">The team you're looking for doesn't exist.</p>
              <Link to="/teams">
                <Button>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Teams
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
        <title>{team.name} - Who's On Pole?</title>
        <meta name="description" content={`Learn about ${team.name}, their drivers, team principal, and championship standing. ${team.bio || ''}`} />
        
        {/* OpenGraph tags */}
        <meta property="og:title" content={`${team.name} - Who's On Pole?`} />
        <meta property="og:description" content={`Learn about ${team.name}, their drivers, team principal, and championship standing.`} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`https://whoonpole.com/teams/${team.id}`} />
        {team.logo_url && <meta property="og:image" content={team.logo_url} />}
        <meta property="og:site_name" content="Who's On Pole?" />
        
        {/* Twitter Card tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${team.name} - Who's On Pole?`} />
        <meta name="twitter:description" content={`Learn about ${team.name}, their drivers, team principal, and championship standing.`} />
        {team.logo_url && <meta name="twitter:image" content={team.logo_url} />}
        
        {/* Structured Data (JSON-LD) */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SportsTeam",
            "name": team.name,
            "description": team.bio || `${team.name} is a racing team from ${team.country}.`,
            "image": team.logo_url,
            "url": `https://whoonpole.com/teams/${team.id}`,
            "sport": "Motor Racing",
            "location": {
              "@type": "Country",
              "name": team.country
            },
            "mainEntityOfPage": {
              "@type": "WebPage",
              "@id": `https://whoonpole.com/teams/${team.id}`
            }
          })}
        </script>
      </Helmet>
      
      <Navigation />
      <PageHeader title={team.name} backButtonText="Back to Teams" />
      
      <main className="pb-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {/* Team Profile Card */}
              <Card>
                <CardContent className="p-8">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="w-32 h-32 rounded-lg bg-muted flex items-center justify-center overflow-hidden mx-auto md:mx-0">
                      {team.logo_url ? (
                        <img 
                          src={team.logo_url} 
                          alt={team.name}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-secondary rounded-lg flex items-center justify-center text-2xl font-bold">
                          {team.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 text-center md:text-left">
                      <h2 className="text-2xl font-bold mb-4">{team.name}</h2>
                      
                      <div className="flex flex-wrap gap-3 justify-center md:justify-start mb-4">
                        <Badge variant="secondary" className="text-sm">
                          <MapPin className="w-4 h-4 mr-1" />
                          {team.country}
                        </Badge>
                        {team.championship_standing && (
                          <Badge variant="outline" className="text-sm">
                            <Trophy className="w-4 h-4 mr-1" />
                            P{team.championship_standing}
                          </Badge>
                        )}
                      </div>

                      {(team.short_bio || team.bio) && (
                        <div>
                          <h3 className="font-semibold mb-2">About</h3>
                          <ExpandableBio 
                            shortBio={team.short_bio} 
                            fullBio={team.bio} 
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Team Principal Card */}
              {teamPrincipal && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Team Principal
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 p-4 rounded-lg border">
                      <Avatar className="w-16 h-16">
                        <AvatarImage src={teamPrincipal.photo_url || ''} alt={teamPrincipal.name} />
                        <AvatarFallback className="text-lg font-bold">
                          {teamPrincipal.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h4 className="font-semibold text-lg">{teamPrincipal.name}</h4>
                        <p className="text-sm text-muted-foreground mb-2">{teamPrincipal.country}</p>
                        {teamPrincipal.years_with_team && (
                          <p className="text-sm text-muted-foreground">
                            {teamPrincipal.years_with_team} years with team
                          </p>
                        )}
                        {teamPrincipal.bio && (
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-3">
                            {teamPrincipal.bio}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Drivers Card */}
              {teamDrivers.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Current Drivers
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {teamDrivers.map((driver) => (
                        <Link 
                          key={driver.id} 
                          to={`/drivers/${driver.id}`} 
                          className="group"
                        >
                          <div className="flex items-center gap-4 p-4 rounded-lg border hover:bg-accent transition-colors">
                            <Avatar className="w-12 h-12">
                              <AvatarImage src={driver.headshot_url || ''} alt={driver.name} />
                              <AvatarFallback className="font-bold">
                                {driver.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <h4 className="font-semibold group-hover:text-primary transition-colors">
                                {driver.name}
                              </h4>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                {driver.number && (
                                  <span>#{driver.number}</span>
                                )}
                                <span>{driver.country}</span>
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                )}

               {/* Quote Section */}
               {team.quote && (
                 <QuoteCard 
                   quote={team.quote} 
                   author={team.name}
                   quoteAuthor={team.quote_author}
                   context="Racing Team"
                 />
               )}
            </div>

            <div className="space-y-6">
              {/* Championship Standing Card */}
              {team.championship_standing && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Trophy className="w-5 h-5" />
                      Championship Standing
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className="text-4xl font-bold text-primary mb-2">
                        P{team.championship_standing}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Current Position
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Team Stats Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Team Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Country</span>
                    <span className="font-semibold">{team.country}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Active Drivers</span>
                    <span className="font-semibold">{teamDrivers.length}</span>
                  </div>
                  {team.championship_standing && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Championship Position</span>
                      <span className="font-semibold">P{team.championship_standing}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            {/* Team Comments Section */}
            <div className="lg:col-span-3">
              <RedditStyleCommentSection
                entityType="team"
                entityId={id!}
                entityName={team.name}
                commentForm={
                  <div>
                    <TeamCommentForm teamId={id!} teamName={team.name} />
                  </div>
                }
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TeamDetail;