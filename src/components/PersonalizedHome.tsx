import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Flag, Users, Eye, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const PersonalizedHome = () => {
  const { user } = useAuth();
  
  return (
    <section className="relative pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Welcome Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-black text-foreground mb-4 tracking-tight font-racing">
            Welcome Back, {user?.user_metadata?.username || 'Racer'}!
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Ready to dive into the latest racing action?
          </p>
          
          {/* Quick Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/my-grid">
              <Button variant="racing" size="lg" className="text-lg px-8 py-4 rounded-2xl">
                <Plus className="mr-2 h-5 w-5" />
                Build Your Grid
              </Button>
            </Link>
            <Link to="/feed">
              <Button variant="outline" size="lg" className="text-lg px-8 py-4 rounded-2xl">
                <Eye className="mr-2 h-5 w-5" />
                View Full Feed
              </Button>
            </Link>
          </div>
        </div>

      </div>
    </section>
  );
};

export default PersonalizedHome;