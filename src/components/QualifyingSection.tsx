import { Card, CardContent } from "@/components/ui/card";
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem, 
  CarouselNext, 
  CarouselPrevious 
} from "@/components/ui/carousel";
import { Skeleton } from "@/components/ui/skeleton";
import { Flag, Zap } from "lucide-react";
import { useQualifyingEntities } from "@/hooks/useQualifyingEntities";
import { QualifyingEntityCard } from "./QualifyingEntityCard";

const LoadingSkeleton = () => (
  <Card className="h-full rounded-2xl">
    <CardContent className="p-6">
      <Skeleton className="w-full h-48 rounded-2xl mb-4" />
      <div className="space-y-3">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="grid grid-cols-2 gap-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </div>
        <Skeleton className="h-6 w-1/3 mx-auto" />
      </div>
    </CardContent>
  </Card>
);

const QualifyingSection = () => {
  const { data: entities, isLoading, error } = useQualifyingEntities(10);

  if (error) {
    return (
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-muted-foreground">Unable to load qualifying entities. Please try again later.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Flag className="h-6 w-6 text-accent" />
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Qualifying
            </h2>
            <Zap className="h-6 w-6 text-accent" />
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Who or what is taking pole today
          </p>
        </div>

        <Carousel className="w-full max-w-6xl mx-auto">
          <CarouselContent>
            {isLoading ? (
              // Show loading skeletons
              Array.from({ length: 5 }).map((_, index) => (
                <CarouselItem key={`skeleton-${index}`} className="md:basis-1/2 lg:basis-1/3">
                  <LoadingSkeleton />
                </CarouselItem>
              ))
            ) : entities && entities.length > 0 ? (
              // Show real entity data
              entities.map((entity, index) => (
                <CarouselItem key={`${entity.entity_type}-${entity.id}`} className="md:basis-1/2 lg:basis-1/3">
                  <QualifyingEntityCard entity={entity} position={index + 1} />
                </CarouselItem>
              ))
            ) : (
              // Show empty state
              <div className="w-full text-center py-12">
                <Flag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No qualifying entities found. Check back later!</p>
              </div>
            )}
          </CarouselContent>
          {!isLoading && entities && entities.length > 0 && (
            <>
              <CarouselPrevious className="rounded-2xl" />
              <CarouselNext className="rounded-2xl" />
            </>
          )}
        </Carousel>
      </div>
    </section>
  );
};

export default QualifyingSection;