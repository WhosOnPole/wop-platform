import { Heart, Twitter, Instagram, Music } from "lucide-react";
import { Link } from "react-router-dom";
// Using the new uploaded logo

const Footer = () => {
  return (
    <footer className="bg-card border-t border-border mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <img 
                src="/lovable-uploads/689ae240-71f1-4d08-863c-1239ae9eded2.png" 
                alt="Who's On Pole Racing Logo" 
                className="h-6 w-6"
              />
              <span className="text-lg font-bold text-primary font-racing">Who's On Pole?</span>
            </div>
            <p className="text-muted-foreground text-sm">
              The inclusive community for racing fans to build grids, share takes, and celebrate motorsport together.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-muted-foreground hover:text-primary transition-racing">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-racing">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-racing">
                <Music className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Navigate</h3>
            <div className="space-y-2">
              <a href="#home" className="block text-muted-foreground hover:text-primary transition-racing text-sm">
                Home
              </a>
              <a href="#drivers" className="block text-muted-foreground hover:text-primary transition-racing text-sm">
                Drivers
              </a>
              <a href="#polls" className="block text-muted-foreground hover:text-primary transition-racing text-sm">
                Polls
              </a>
              <a href="#fan-feature" className="block text-muted-foreground hover:text-primary transition-racing text-sm">
                Fan Feature
              </a>
            </div>
          </div>

          {/* Community */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Community</h3>
            <div className="space-y-2">
              <Link to="/my-grid" className="block text-muted-foreground hover:text-primary transition-racing text-sm">
                Build Your Grid
              </Link>
              <a href="#" className="block text-muted-foreground hover:text-primary transition-racing text-sm">
                Fan Stories
              </a>
              <a href="#" className="block text-muted-foreground hover:text-primary transition-racing text-sm">
                Racing Polls
              </a>
              <a href="#" className="block text-muted-foreground hover:text-primary transition-racing text-sm">
                Community Guidelines
              </a>
            </div>
          </div>

          {/* Support */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Support</h3>
            <div className="space-y-2">
              <a href="#" className="block text-muted-foreground hover:text-primary transition-racing text-sm">
                Help Center
              </a>
              <a href="#" className="block text-muted-foreground hover:text-primary transition-racing text-sm">
                Contact Us
              </a>
              <a href="#" className="block text-muted-foreground hover:text-primary transition-racing text-sm">
                Privacy Policy
              </a>
              <a href="#" className="block text-muted-foreground hover:text-primary transition-racing text-sm">
                Terms of Service
              </a>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-8 pt-8 border-t border-border flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
          <p className="text-muted-foreground text-sm">
            © 2024 Who's On Pole? Made with <Heart className="h-4 w-4 inline text-primary" /> for racing fans everywhere.
          </p>
          <div className="flex space-x-6">
            <a href="#" className="text-muted-foreground hover:text-primary transition-racing text-sm">
              Privacy
            </a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-racing text-sm">
              Terms
            </a>
            <a href="#" className="text-muted-foreground hover:text-primary transition-racing text-sm">
              Cookies
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;