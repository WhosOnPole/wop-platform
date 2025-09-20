import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import MyGrid from "./pages/MyGrid";
import ShareGrid from "./pages/ShareGrid";
import FanProfiles from "./pages/FanProfiles";
import UserProfile from "./pages/UserProfile";
import Drivers from "./pages/Drivers";
import DriverDetail from "./pages/DriverDetail";
import Polls from "./pages/Polls";
import PollDetail from "./pages/PollDetail";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/admin/Dashboard";
import TeamsAdmin from "./pages/admin/Teams";
import DriversAdmin from "./pages/admin/Drivers";
import TracksAdmin from "./pages/admin/Tracks";
import Teams from "./pages/Teams";
import Tracks from "./pages/Tracks";
import TrackDetail from "./pages/TrackDetail";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/my-grid" element={<MyGrid />} />
            <Route path="/profiles" element={<FanProfiles />} />
            <Route path="/u/:username" element={<UserProfile />} />
            <Route path="/u/:username/grid/:grid_id" element={<ShareGrid />} />
            <Route path="/drivers" element={<Drivers />} />
            <Route path="/drivers/:id" element={<DriverDetail />} />
            <Route path="/teams" element={<Teams />} />
            <Route path="/tracks" element={<Tracks />} />
            <Route path="/tracks/:id" element={<TrackDetail />} />
            <Route path="/polls" element={<Polls />} />
            <Route path="/polls/:id" element={<PollDetail />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/teams" element={<TeamsAdmin />} />
            <Route path="/admin/drivers" element={<DriversAdmin />} />
            <Route path="/admin/tracks" element={<TracksAdmin />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
