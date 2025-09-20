import { Link, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, MapPin, Ruler, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import Navigation from '@/components/Navigation';
import { useTrack } from '@/hooks/useTracks';
import { RedditStyleCommentSection } from '@/components/RedditStyleCommentSection';
import { TrackCommentForm } from '@/components/TrackCommentForm';
import QuoteCard from '@/components/QuoteCard';

const TrackDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { data: track, isLoading } = useTrack(id!);

  if (isLoading) {
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
                <Skeleton className="h-64 w-full rounded-t-lg" />
                <CardContent className="p-8">
                  <div className="space-y-4">
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-24 w-full" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!track) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="pt-20 pb-12">
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="text-center py-12">
              <h1 className="text-2xl font-bold mb-4">Track Not Found</h1>
              <p className="text-muted-foreground mb-6">The track you're looking for doesn't exist.</p>
              <Link to="/tracks">
                <Button>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Tracks
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
        <title>{track.name} - Who's On Pole?</title>
        <meta name="description" content={`Discover ${track.name} circuit in ${track.country}. Learn about the track layout, length, and racing history.`} />
        
        {/* OpenGraph tags */}
        <meta property="og:title" content={`${track.name} - Who's On Pole?`} />
        <meta property="og:description" content={`Discover ${track.name} circuit in ${track.country}. Learn about the track layout, length, and racing history.`} />
        <meta property="og:type" content="place" />
        <meta property="og:url" content={`https://whoonpole.com/tracks/${track.id}`} />
        {track.image_url && <meta property="og:image" content={track.image_url} />}
        <meta property="og:site_name" content="Who's On Pole?" />
        
        {/* Twitter Card tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${track.name} - Who's On Pole?`} />
        <meta name="twitter:description" content={`Discover ${track.name} circuit in ${track.country}. Learn about the track layout, length, and racing history.`} />
        {track.image_url && <meta name="twitter:image" content={track.image_url} />}
        
        {/* Structured Data (JSON-LD) */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SportsActivityLocation",
            "name": track.name,
            "address": {
              "@type": "PostalAddress",
              "addressCountry": track.country
            },
            "description": track.description || `${track.name} is a racing circuit located in ${track.country}.`,
            "image": track.image_url,
            "url": `https://whoonpole.com/tracks/${track.id}`,
            "sport": "Motor Racing",
            ...(track.length_km && {
              "length": {
                "@type": "QuantitativeValue",
                "value": track.length_km,
                "unitCode": "KMT"
              }
            }),
            "mainEntityOfPage": {
              "@type": "WebPage",
              "@id": `https://whoonpole.com/tracks/${track.id}`
            }
          })}
        </script>
      </Helmet>
      
      <Navigation />
      
      <main className="pt-20 pb-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="mb-6">
            <Link to="/tracks">
              <Button variant="ghost" className="mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Tracks
              </Button>
            </Link>
            <h1 className="text-4xl font-bold font-racing">{track.name}</h1>
          </div>

          <div className="space-y-6">
            {/* Track Hero Card */}
            <Card className="overflow-hidden">
              <div className="aspect-video bg-muted relative overflow-hidden">
                {track.image_url ? (
                  <img 
                    src={track.image_url} 
                    alt={track.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                    <div className="text-6xl opacity-50">🏁</div>
                  </div>
                )}
              </div>
              
              <CardContent className="p-8">
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-bold mb-4">{track.name}</h2>
                    
                    <div className="flex flex-wrap gap-3 mb-6">
                      <Badge variant="secondary" className="text-sm">
                        <MapPin className="w-4 h-4 mr-1" />
                        {track.country}
                      </Badge>
                      {track.length_km && (
                        <Badge variant="outline" className="text-sm">
                          <Ruler className="w-4 h-4 mr-1" />
                          {track.length_km} km
                        </Badge>
                      )}
                    </div>

                    {track.description && (
                      <div>
                        <h3 className="font-semibold mb-3">About the Circuit</h3>
                        <p className="text-muted-foreground leading-relaxed">
                          {track.description}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Track Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    Location
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{track.country}</p>
                </CardContent>
              </Card>

              {track.length_km && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Ruler className="w-5 h-5" />
                      Circuit Length
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{track.length_km} km</p>
                    <p className="text-sm text-muted-foreground">
                      {(track.length_km * 0.621371).toFixed(2)} miles
                    </p>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Racing Calendar
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Check the official F1 calendar for upcoming races at this circuit.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Additional Information */}
            <Card>
              <CardHeader>
                <CardTitle>Circuit Information</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {track.name} is a motorsport circuit located in {track.country}. 
                  {track.length_km && ` The circuit measures ${track.length_km} kilometers in length.`}
                  {' '}This track is part of the Formula 1 racing calendar and hosts thrilling races 
                  that showcase the skill and speed of world-class drivers.
                </p>
              </CardContent>
            </Card>

             {/* Quote Section */}
             {track.quote && (
               <QuoteCard 
                 quote={track.quote} 
                 author={`About ${track.name}`}
                 quoteAuthor={track.quote_author}
                 context="Racing Circuit"
               />
             )}
            
            {/* Track Comments */}
            <RedditStyleCommentSection
              entityType="track"
              entityId={id!}
              entityName={track.name}
              commentForm={<TrackCommentForm trackId={id!} trackName={track.name} />}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default TrackDetail;