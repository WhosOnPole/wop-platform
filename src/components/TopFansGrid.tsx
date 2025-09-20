import { useState, useEffect } from "react";
import { Trophy, Users, ChevronDown, ChevronUp, Globe, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TopFanCard } from "./TopFanCard";
import { FanPointsBadge } from "./FanPointsBadge";
import { useTopFans, useUserFanRank, useDriverFanCount } from "@/hooks/useTopFans";
import { useRegionalTopFans, useUserRegionalRank } from "@/hooks/useRegionalTopFans";
import { useDriverRegions } from "@/hooks/useDriverRegions";
import { supabase } from "@/integrations/supabase/client";

interface TopFansGridProps {
  driverId: string;
  className?: string;
}

export const TopFansGrid: React.FC<TopFansGridProps> = ({ driverId, className = "" }) => {
  const [showExtended, setShowExtended] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<string>("");
  const [activeTab, setActiveTab] = useState("global");
  const [userRegion, setUserRegion] = useState<string | null>(null);
  
  const limit = showExtended ? 50 : 10;
  
  // Global data
  const { data: topFans, isLoading, error } = useTopFans(driverId, limit);
  const { data: userRank } = useUserFanRank(driverId);
  const { data: fanCount } = useDriverFanCount(driverId);
  
  // Regional data
  const { data: availableRegions } = useDriverRegions(driverId);
  const { data: regionalFans, isLoading: regionalLoading } = useRegionalTopFans(
    driverId, 
    activeTab === "regional" ? userRegion || "" : selectedRegion, 
    limit
  );
  const { data: userRegionalRank } = useUserRegionalRank(driverId);

  // Get user's region
  useEffect(() => {
    const fetchUserRegion = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("region")
        .eq("user_id", user.id)
        .single();

      if (profile?.region) {
        setUserRegion(profile.region);
      }
    };

    fetchUserRegion();
  }, []);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Top Fans
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Top Fans
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Unable to load fan rankings at the moment.
          </p>
        </CardContent>
      </Card>
    );
  }

  const getDisplayData = () => {
    if (activeTab === "global") {
      return {
        fans: topFans || [],
        loading: isLoading,
        userRankData: userRank,
        totalCount: fanCount
      };
    } else if (activeTab === "regional" && userRegion) {
      return {
        fans: regionalFans || [],
        loading: regionalLoading,
        userRankData: userRegionalRank,
        totalCount: regionalFans?.length
      };
    } else if (activeTab === "browse" && selectedRegion) {
      return {
        fans: regionalFans || [],
        loading: regionalLoading,
        userRankData: null,
        totalCount: regionalFans?.length
      };
    }
    return { fans: [], loading: false, userRankData: null, totalCount: 0 };
  };

  const { fans: displayFans, loading: currentLoading, userRankData, totalCount } = getDisplayData();
  const hasMoreFans = displayFans.length >= 10 && !showExtended;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Trophy className="h-6 w-6 text-primary" />
            Top Fans
            {totalCount !== undefined && (
              <span className="text-sm font-normal text-muted-foreground">
                ({totalCount} {activeTab === "global" ? "total" : `in ${activeTab === "regional" ? userRegion : selectedRegion}`})
              </span>
            )}
          </CardTitle>
          
          {userRankData && (
            <FanPointsBadge
              points={userRankData.total_points}
              rank={'rank_position' in userRankData ? userRankData.rank_position : userRankData.rank}
              showRank={true}
              variant="compact"
              size="sm"
            />
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="global" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              <span className="hidden sm:inline">Global</span>
              <span className="sm:hidden">All</span>
            </TabsTrigger>
            <TabsTrigger 
              value="regional" 
              className="flex items-center gap-2"
              disabled={!userRegion}
            >
              <MapPin className="h-4 w-4" />
              <span className="hidden sm:inline">My Region</span>
              <span className="sm:hidden">Mine</span>
            </TabsTrigger>
            <TabsTrigger value="browse" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Browse</span>
              <span className="sm:hidden">Regions</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="global">
            {renderFansList(isLoading)}
          </TabsContent>

          <TabsContent value="regional">
            {!userRegion ? (
              <div className="text-center py-12">
                <MapPin className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                  Set Your Region
                </h3>
                <p className="text-muted-foreground max-w-sm mx-auto">
                  Add your location in your profile to compete with local fans.
                </p>
              </div>
            ) : (
              renderFansList(regionalLoading)
            )}
          </TabsContent>

          <TabsContent value="browse" className="space-y-4">
            <div className="flex items-center gap-3">
              <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select a region to explore..." />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {availableRegions?.map((region) => (
                    <SelectItem key={region.region} value={region.region}>
                      <div className="flex items-center justify-between w-full">
                        <span>{region.region}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {region.fan_count} fans
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedRegion ? (
              renderFansList(regionalLoading)
            ) : (
              <div className="text-center py-12">
                <Globe className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                  Explore Regional Rankings
                </h3>
                <p className="text-muted-foreground max-w-sm mx-auto">
                  Select a region above to see how fans rank in different areas.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );

  function renderFansList(loading: boolean) {
    if (loading) {
      return (
        <div className="grid gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <p className="text-muted-foreground text-center py-8">
          Unable to load fan rankings at the moment.
        </p>
      );
    }

    if (displayFans.length === 0) {
      const regionName = activeTab === "regional" ? userRegion : selectedRegion;
      const emptyMessage = regionName 
        ? `Be the first fan in ${regionName}!` 
        : "No fans yet!";
      
      return (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-muted-foreground mb-2">
            {emptyMessage}
          </h3>
          <p className="text-muted-foreground max-w-sm mx-auto">
            {regionName 
              ? "Start engaging with this driver's content to become the top regional fan." 
              : "Be the first to show your support by engaging with this driver's content."
            }
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {/* Podium Top 3 */}
        {displayFans.length >= 3 && (
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Podium
            </h4>
            <div className="grid gap-3">
              {displayFans.slice(0, 3).map((fan) => (
                <TopFanCard
                  key={fan.user_id}
                  fan={fan}
                  showPodiumHighlight={true}
                  size="md"
                />
              ))}
            </div>
          </div>
        )}

        {/* Remaining fans */}
        {displayFans.length > 3 && (
          <div>
            <h4 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
              <Users className="h-4 w-4" />
              {showExtended ? "Extended Rankings" : "Top 10"}
            </h4>
            <div className="grid gap-2">
              {displayFans.slice(3).map((fan) => (
                <TopFanCard
                  key={fan.user_id}
                  fan={fan}
                  showPodiumHighlight={false}
                  size="sm"
                />
              ))}
            </div>
          </div>
        )}

        {/* Show all fans if less than 3 */}
        {displayFans.length > 0 && displayFans.length < 3 && (
          <div className="grid gap-3">
            {displayFans.map((fan) => (
              <TopFanCard
                key={fan.user_id}
                fan={fan}
                showPodiumHighlight={true}
                size="md"
              />
            ))}
          </div>
        )}

        {/* Show More Button */}
        {hasMoreFans && (
          <Button
            variant="outline"
            className="w-full mt-4"
            onClick={() => setShowExtended(true)}
          >
            <ChevronDown className="h-4 w-4 mr-2" />
            Show More Rankings
          </Button>
        )}

        {/* Show Less Button */}
        {showExtended && (
          <Button
            variant="outline"
            className="w-full mt-4"
            onClick={() => setShowExtended(false)}
          >
            <ChevronUp className="h-4 w-4 mr-2" />
            Show Less
          </Button>
        )}
      </div>
    );
  }
};