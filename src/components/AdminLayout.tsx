import { ReactNode } from 'react';
import { Link, useLocation } from "react-router-dom";
import { BarChart3, Users, Car, MapPin, Shield, Crown } from "lucide-react";
import { useAdmin } from '@/hooks/useAdmin';
import { Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

interface AdminLayoutProps {
  children: ReactNode;
}

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  const { isAdmin, isLoading } = useAdmin();
  const { signOut } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse text-lg">Loading...</div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <div className="flex gap-4">
            <nav className="flex gap-2">
              <Link 
                to="/admin" 
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  location.pathname === '/admin' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'hover:bg-accent/10'
                }`}
              >
                <BarChart3 className="h-4 w-4" />
                Dashboard
              </Link>
              <Link 
                to="/admin/drivers" 
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  location.pathname === '/admin/drivers' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'hover:bg-accent/10'
                }`}
              >
                <Car className="h-4 w-4" />
                Drivers
              </Link>
              <Link 
                to="/admin/teams" 
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  location.pathname === '/admin/teams' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'hover:bg-accent/10'
                }`}
              >
                <Users className="h-4 w-4" />
                Teams
              </Link>
              <Link 
                to="/admin/team-principals" 
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  location.pathname === '/admin/team-principals' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'hover:bg-accent/10'
                }`}
              >
                <Crown className="h-4 w-4" />
                Principals
              </Link>
              <Link 
                to="/admin/tracks" 
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  location.pathname === '/admin/tracks' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'hover:bg-accent/10'
                }`}
              >
                <MapPin className="h-4 w-4" />
                Tracks
              </Link>
              <Link 
                to="/admin/moderation" 
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  location.pathname === '/admin/moderation' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'hover:bg-accent/10'
                }`}
              >
                <Shield className="h-4 w-4" />
                Moderation
              </Link>
            </nav>
            <Button onClick={signOut} variant="outline">
              Sign Out
            </Button>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;