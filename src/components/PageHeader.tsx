import { ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface PageHeaderProps {
  title: string;
  showBackButton?: boolean;
  backButtonText?: string;
  showHomeButton?: boolean;
}

const PageHeader = ({ 
  title, 
  showBackButton = true, 
  backButtonText = "Back", 
  showHomeButton = true 
}: PageHeaderProps) => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto px-4 pt-20 pb-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          {showBackButton && (
            <Button 
              variant="ghost" 
              onClick={() => navigate(-1)}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {backButtonText}
            </Button>
          )}
          {showHomeButton && (
            <Button 
              variant="ghost" 
              onClick={() => navigate('/')}
              className="text-muted-foreground hover:text-foreground"
            >
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
          )}
        </div>
        <h1 className="text-2xl md:text-3xl font-bold font-racing">{title}</h1>
      </div>
    </div>
  );
};

export default PageHeader;