import { Button } from "@/components/ui/button";
import { Flag, ArrowRight } from "lucide-react";

const CTA = () => {
  return (
    <section className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 gradient-hero opacity-10"></div>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 w-full">
        <div className="animate-slide-up">
          <Flag className="h-16 w-16 text-primary mx-auto mb-8 animate-racing-pulse" />
          
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-foreground mb-6 leading-tight">
            Ready to Join the{" "}
            <span className="gradient-primary bg-clip-text text-transparent text-primary fallback-color">Racing Community?</span>
          </h2>
          
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Connect with fellow racing fans, create your dream grid, and never miss a moment 
            of the action. Your pole position awaits.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button variant="racing" size="lg" className="text-lg px-8 py-4 group">
              Start Your Journey
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-racing" />
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 py-4">
              Learn More
            </Button>
          </div>
          
          <p className="text-sm text-muted-foreground mt-6">
            Free to join • No credit card required • Join 10,000+ racing fans
          </p>
        </div>
      </div>

      {/* Decorative racing elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 -left-20 w-40 h-1 bg-primary/20 rotate-12 animate-speed-lines"></div>
        <div className="absolute bottom-1/4 -right-20 w-40 h-1 bg-secondary/20 -rotate-12 animate-speed-lines" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/4 w-20 h-1 bg-accent/20 rotate-45 animate-speed-lines" style={{ animationDelay: '0.5s' }}></div>
      </div>
    </section>
  );
};

export default CTA;