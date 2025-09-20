import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import PersonalizedHome from "@/components/PersonalizedHome";
import QualifyingSection from "@/components/QualifyingSection";
import FanFeature from "@/components/FanFeature";
import FanPostsCarousel from "@/components/FanPostsCarousel";
import Polls from "@/components/Polls";
import Features from "@/components/Features";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main>
        {user ? <PersonalizedHome /> : <Hero />}
        <QualifyingSection />
        <FanFeature />
        <FanPostsCarousel />
        <Polls />
        <Features />
        {!user && <CTA />}
      </main>
      <Footer />
    </div>
  );
};

export default Index;
