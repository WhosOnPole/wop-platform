import { Button } from "@/components/ui/button";
import { Menu, X, User, Shield, ChevronDown } from "lucide-react";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAdmin } from "@/hooks/useAdmin";
import NotificationBell from "@/components/NotificationBell";
import SearchBar from "@/components/SearchBar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();

  const handleAuthAction = () => {
    if (user) {
      signOut();
    } else {
      navigate('/auth');
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border shadow-racing">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <img 
              src="/lovable-uploads/689ae240-71f1-4d08-863c-1239ae9eded2.png" 
              alt="Who's On Pole Racing Logo" 
              className="h-8 w-8"
            />
            <span className="text-xl font-bold text-primary font-racing">Who's On Pole?</span>
          </Link>

          {/* Search Bar - Desktop */}
          <div className="hidden md:block flex-1 max-w-xl mx-8">
            <SearchBar />
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link to="/" className="text-foreground hover:text-primary transition-racing font-medium">
              Home
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="text-foreground hover:text-accent transition-colors">
                  Find Your Favorites
                  <ChevronDown className="ml-1 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48 bg-background border-border shadow-racing z-50">
                <DropdownMenuItem asChild>
                  <Link to="/drivers" className="w-full">
                    Drivers
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/teams" className="w-full">
                    Teams
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/tracks" className="w-full">
                    Tracks
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Link to="/feed" className="text-foreground hover:text-accent transition-colors">
              Feed
            </Link>
            <Link to="/polls" className="text-foreground hover:text-accent transition-colors">
              Polls
            </Link>
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {user && (
              <>
                <NotificationBell />
                <Button 
                  variant="ghost"
                  onClick={() => navigate('/profile')}
                >
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </Button>
              </>
            )}
            {isAdmin && (
              <Button 
                variant="ghost"
                onClick={() => navigate('/admin')}
              >
                <Shield className="w-4 h-4 mr-2" />
                Admin Panel
              </Button>
            )}
            <Button 
              variant="ghost"
              onClick={handleAuthAction}
            >
              {user ? 'Sign Out' : 'Sign In'}
            </Button>
            {!user && <Button variant="racing" onClick={() => navigate('/auth')}>Get Started</Button>}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-md text-foreground hover:text-primary transition-racing"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 right-0 bg-background/95 backdrop-blur-md border-b border-border shadow-racing">
            <div className="px-4 py-6 space-y-4">
              <Link to="/" className="block text-foreground hover:text-primary transition-racing font-medium">
                Home
              </Link>
              <div className="space-y-2">
                <p className="text-sm font-semibold text-muted-foreground px-2">Find Your Favorites</p>
                <Link to="/drivers" className="block text-foreground hover:text-accent transition-colors pl-4">
                  Drivers
                </Link>
                <Link to="/teams" className="block text-foreground hover:text-accent transition-colors pl-4">
                  Teams
                </Link>
                <Link to="/tracks" className="block text-foreground hover:text-accent transition-colors pl-4">
                  Tracks
                </Link>
              </div>
              <Link to="/feed" className="block text-foreground hover:text-accent transition-colors">
                Feed
              </Link>
              <Link to="/polls" className="block text-foreground hover:text-accent transition-colors">
                Polls
              </Link>
              
              {/* Search Bar - Mobile */}
              <div className="py-4">
                <SearchBar />
              </div>
              
              <div className="pt-4 space-y-2">
                {user && (
                  <>
                    <div className="flex justify-center pb-2">
                      <NotificationBell />
                    </div>
                    <Button 
                      variant="ghost" 
                      className="w-full"
                      onClick={() => navigate('/profile')}
                    >
                      <User className="w-4 h-4 mr-2" />
                      Profile
                    </Button>
                  </>
                )}
                {isAdmin && (
                  <Button 
                    variant="ghost" 
                    className="w-full"
                    onClick={() => navigate('/admin')}
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    Admin Panel
                  </Button>
                )}
                <Button 
                  variant="ghost" 
                  className="w-full"
                  onClick={handleAuthAction}
                >
                  {user ? 'Sign Out' : 'Sign In'}
                </Button>
                {!user && <Button variant="racing" className="w-full" onClick={() => navigate('/auth')}>Get Started</Button>}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;