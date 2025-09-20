import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Grid3X3, TrendingUp, Trophy, Car, UserCheck, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Features = () => {
  const navigate = useNavigate();
  
  const features = [
    {
      icon: Car,
      title: "F1 Drivers",
      description: "Explore profiles of all Formula 1 drivers, their stats, teams, and racing achievements.",
      color: "text-primary",
      clickable: true,
      action: () => navigate('/drivers')
    },
    {
      icon: Users,
      title: "F1 Teams",
      description: "Discover the constructors competing for the championship, their history and team information.",
      color: "text-secondary",
      clickable: true,
      action: () => navigate('/teams')
    },
    {
      icon: UserCheck,
      title: "Team Principals",
      description: "Meet the leaders behind F1 teams, guiding their constructors to championship glory.",
      color: "text-accent",
      clickable: true,
      action: () => navigate('/team-principals')
    },
    {
      icon: MapPin,
      title: "Racing Circuits",
      description: "Explore the iconic tracks and circuits that host Formula 1 races around the world.",
      color: "text-primary",
      clickable: true,
      action: () => navigate('/tracks')
    },
    {
      icon: Grid3X3,
      title: "Dream Grid",
      description: "Drag and drop to create your ultimate F1 starting grid. Rank your top 10 drivers in race formation.",
      color: "text-secondary"
    },
    {
      icon: Trophy,
      title: "Community Polls",
      description: "Vote on who's the best driver, predict race winners, and share your racing opinions with the community.",
      color: "text-accent",
      clickable: true,
      action: () => navigate('/polls')
    }
  ];

  return (
    <section id="features" className="py-20 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-foreground mb-6 leading-tight">
            Racing Features for{" "}
            <span className="gradient-primary bg-clip-text text-transparent text-primary fallback-color">Every Fan</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            From creating your dream grid to following your racing heroes, 
            we've built everything you need to celebrate motorsport.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className={`relative overflow-hidden border-0 bg-card shadow-racing hover:shadow-glow transition-racing hover:scale-105 group ${
                feature.clickable ? 'cursor-pointer' : ''
              }`}
              onClick={feature.action}
            >
              <CardHeader className="pb-4">
                <div className={`w-12 h-12 rounded-lg bg-muted flex items-center justify-center mb-4 group-hover:scale-110 transition-racing ${feature.color}`}>
                  <feature.icon className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl font-bold text-foreground">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
              
              {/* Racing stripe accent */}
              <div className="absolute top-0 left-0 w-full h-1 gradient-primary opacity-50 group-hover:opacity-100 transition-racing"></div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;