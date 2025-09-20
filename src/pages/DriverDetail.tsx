import { Link, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, Hash, MapPin, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import Navigation from '@/components/Navigation';
import PageHeader from '@/components/PageHeader';
import { DriverFanPosts } from '@/components/DriverFanPosts';
import { RedditStyleCommentSection } from '@/components/RedditStyleCommentSection';
import { CommentForm } from '@/components/CommentForm';
import QuoteCard from '@/components/QuoteCard';
import { ExpandableBio } from '@/components/ExpandableBio';
import { TopFansGrid } from '@/components/TopFansGrid';
import { useDriver } from '@/hooks/useDrivers';
import { useTrendingDrivers } from '@/hooks/useTrendingDrivers';

const DriverDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { data: driver, isLoading: driverLoading } = useDriver(id!);
  const { data: trendingDrivers } = useTrendingDrivers(50); // Get more for sentiment data

  const trendingData = trendingDrivers?.find(td => td.id === id);

  if (driverLoading) {
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
                      <Skeleton className="w-32 h-32 rounded-full mx-auto md:mx-0" />
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

  if (!driver) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="pt-20 pb-12">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="text-center py-12">
              <h1 className="text-2xl font-bold mb-4">Driver Not Found</h1>
              <p className="text-muted-foreground mb-6">The driver you're looking for doesn't exist.</p>
              <Link to="/drivers">
                <Button>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Drivers
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
        <title>{driver.name} - Who's On Pole?</title>
        <meta name="description" content={`Learn about ${driver.name}, their career, team, and what fans think. Add them to your grid and track their performance.`} />
        
        {/* OpenGraph tags */}
        <meta property="og:title" content={`${driver.name} - Who's On Pole?`} />
        <meta property="og:description" content={`Learn about ${driver.name}, their career, team, and what fans think. Add them to your grid and track their performance.`} />
        <meta property="og:type" content="profile" />
        <meta property="og:url" content={`https://whoonpole.com/drivers/${driver.id}`} />
        {driver.headshot_url && <meta property="og:image" content={driver.headshot_url} />}
        <meta property="og:site_name" content="Who's On Pole?" />
        
        {/* Twitter Card tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${driver.name} - Who's On Pole?`} />
        <meta name="twitter:description" content={`Learn about ${driver.name}, their career, team, and what fans think. Add them to your grid and track their performance.`} />
        {driver.headshot_url && <meta name="twitter:image" content={driver.headshot_url} />}
        
        {/* Structured Data (JSON-LD) */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Person",
            "name": driver.name,
            "nationality": driver.country,
            "description": driver.bio || `${driver.name} is a racing driver from ${driver.country}.`,
            "image": driver.headshot_url,
            "identifier": driver.number?.toString(),
            "url": `https://whoonpole.com/drivers/${driver.id}`,
            "sport": "Motor Racing",
            "memberOf": driver.teams ? {
              "@type": "SportsTeam",
              "name": driver.teams.name,
              "url": `https://whoonpole.com/teams/${driver.teams.id}`
            } : undefined,
            "mainEntityOfPage": {
              "@type": "WebPage",
              "@id": `https://whoonpole.com/drivers/${driver.id}`
            }
          })}
        </script>
      </Helmet>
      
      <Navigation />
      <PageHeader title={driver.name} backButtonText="Back to Drivers" />
      
      <main className="pb-12">
        <div className="container mx-auto px-4 max-w-4xl">

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {/* Driver Profile Card */}
              <Card>
                <CardContent className="p-8">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center overflow-hidden mx-auto md:mx-0">
                      {driver.headshot_url ? (
                        <img 
                          src={driver.headshot_url} 
                          alt={driver.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center text-2xl font-bold">
                          {driver.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 text-center md:text-left">
                      <h2 className="text-2xl font-bold mb-4">{driver.name}</h2>
                      
                      <div className="flex flex-wrap gap-3 justify-center md:justify-start mb-4">
                        {driver.number && (
                          <Badge variant="outline" className="text-sm">
                            <Hash className="w-4 h-4 mr-1" />
                            {driver.number}
                          </Badge>
                        )}
                        <Badge variant="secondary" className="text-sm">
                          <MapPin className="w-4 h-4 mr-1" />
                          {driver.country}
                        </Badge>
                        {driver.teams && (
                          <Link to={`/teams/${driver.teams.id}`}>
                            <Badge variant="outline" className="text-sm hover:bg-accent cursor-pointer">
                              <Users className="w-4 h-4 mr-1" />
                              {driver.teams.name}
                            </Badge>
                          </Link>
                        )}
                      </div>


                      {(driver.short_bio || driver.bio) && (
                        <div>
                          <h3 className="font-semibold mb-2">About</h3>
                          <ExpandableBio 
                            shortBio={driver.short_bio} 
                            fullBio={driver.bio} 
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Team Card */}
              {driver.teams && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Current Team
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Link to={`/teams/${driver.teams.id}`} className="group">
                      <div className="flex items-center gap-4 p-4 rounded-lg border hover:bg-accent transition-colors">
                        {driver.teams.logo_url && (
                          <img 
                            src={driver.teams.logo_url} 
                            alt={`${driver.teams.name} logo`}
                            className="w-12 h-12 object-contain"
                          />
                        )}
                        <div>
                          <h4 className="font-semibold group-hover:text-primary transition-colors">
                            {driver.teams.name}
                          </h4>
                          <p className="text-sm text-muted-foreground">View team details →</p>
                        </div>
                      </div>
                    </Link>
                  </CardContent>
                </Card>
              )}

              {/* Top Fans Grid */}
              <TopFansGrid driverId={id!} />

              {/* Quote Section */}
              {driver.quote && (
                <QuoteCard 
                  quote={driver.quote} 
                  author={driver.name}
                  quoteAuthor={driver.quote_author}
                  context="Formula 1 Driver"
                />
              )}

              {/* Driver Comments Section */}
              <RedditStyleCommentSection
                entityType="driver"
                entityId={id!}
                entityName={driver.name}
                commentForm={<CommentForm driverId={id!} driverName={driver.name} />}
              />
            </div>

            {/* Driver Fan Posts */}
            <div>
              <DriverFanPosts driverId={id!} driverName={driver.name} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DriverDetail;