import { Button } from "@/components/ui/button";
import { Flag, Users, Trophy, Star } from "lucide-react";
import { Link } from "react-router-dom";
import heroRacing from "@/assets/hero-racing.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Hero Background */}
      <div className="absolute inset-0 z-0">
        <img 
          src={heroRacing} 
          alt="Racing cars in motion" 
          className="w-full h-full object-cover opacity-90"
        />
        <div className="absolute inset-0 gradient-hero opacity-80"></div>
        <div className="absolute inset-0 checkered-pattern animate-checkered-flag"></div>
      </div>

      {/* Hero Content */}
      <div className="relative z-10 text-center px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
        <div className="animate-slide-up">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white mb-6 tracking-tight font-racing leading-tight">
            Who's On{" "}
            <span className="text-accent animate-racing-pulse inline-block">Pole?</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-2xl mx-auto leading-relaxed">
            The ultimate social platform for racing fans. 
            Connect, rank, and celebrate the sport you love.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Link to="/my-grid">
              <Button variant="racing" size="lg" className="text-lg px-8 py-4 rounded-2xl">
                Build Your Grid
                <Flag className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/drivers">
              <Button variant="pole" size="lg" className="text-lg px-8 py-4 rounded-2xl">
                Discover Drivers
                <Trophy className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto text-white">
            <div className="text-center">
              <div className="text-3xl font-bold text-accent">10K+</div>
              <div className="text-sm opacity-80">Racing Fans</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-accent">500+</div>
              <div className="text-sm opacity-80">Driver Profiles</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-accent">50K+</div>
              <div className="text-sm opacity-80">Dream Grids</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-accent">24/7</div>
              <div className="text-sm opacity-80">Racing Buzz</div>
            </div>
          </div>
        </div>
      </div>

      {/* Speed Lines Effect */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-0 w-full h-1 bg-white/20 animate-speed-lines"></div>
        <div className="absolute top-2/4 left-0 w-full h-1 bg-accent/30 animate-speed-lines" style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute top-3/4 left-0 w-full h-1 bg-secondary/20 animate-speed-lines" style={{ animationDelay: '1s' }}></div>
      </div>
    </section>
  );
};

export default Hero;