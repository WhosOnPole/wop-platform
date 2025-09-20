import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/AuthContext";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";

import Index from "./pages/Index";
import Auth from "./pages/Auth";
import MyGrid from "./pages/MyGrid";
import ShareGrid from "./pages/ShareGrid";
import Profile from "./pages/Profile";
import UserProfile from "./pages/UserProfile";
import FanProfiles from "./pages/FanProfiles";
import Feed from "./pages/Feed";
import Polls from "./pages/Polls";
import PollDetail from "./pages/PollDetail";
import SubmitFeature from "./pages/SubmitFeature";
import Drivers from "./pages/Drivers";
import DriverDetail from "./pages/DriverDetail";
import TrackDetail from "./pages/TrackDetail";
import Teams from "./pages/Teams";
import TeamDetail from "./pages/TeamDetail";
import TeamPrincipalDetail from "./pages/TeamPrincipalDetail";
import TeamPrincipals from "./pages/TeamPrincipals";
import Tracks from "./pages/Tracks";
import NotFound from "./pages/NotFound";

// Admin pages
import AdminDashboard from "./pages/admin/Dashboard";
import AdminDrivers from "./pages/admin/Drivers";
import AdminTeams from "./pages/admin/Teams";
import AdminTeamPrincipals from "./pages/admin/TeamPrincipals";
import AdminTracks from "./pages/admin/Tracks";
import Moderation from "./pages/admin/Moderation";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/my-grid" element={<MyGrid />} />
              
              <Route path="/profile" element={<Profile />} />
              <Route path="/u/:username" element={<UserProfile />} />
              <Route path="/u/:username/grid" element={<ShareGrid />} />
              <Route path="/fans" element={<FanProfiles />} />
              <Route path="/feed" element={<Feed />} />
              <Route path="/polls" element={<Polls />} />
              <Route path="/polls/:pollId" element={<PollDetail />} />
              <Route path="/submit-feature" element={<SubmitFeature />} />
              <Route path="/drivers" element={<Drivers />} />
              <Route path="/drivers/:id" element={<DriverDetail />} />
              <Route path="/teams" element={<Teams />} />
              <Route path="/teams/:id" element={<TeamDetail />} />
              <Route path="/team-principals/:id" element={<TeamPrincipalDetail />} />
              <Route path="/team-principals" element={<TeamPrincipals />} />
              <Route path="/tracks" element={<Tracks />} />
              <Route path="/tracks/:id" element={<TrackDetail />} />
              
              {/* Admin routes */}
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/drivers" element={<AdminDrivers />} />
              <Route path="/admin/teams" element={<AdminTeams />} />
              <Route path="/admin/team-principals" element={<AdminTeamPrincipals />} />
              <Route path="/admin/tracks" element={<AdminTracks />} />
              <Route path="/admin/moderation" element={<Moderation />} />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Toaster />
          </BrowserRouter>
        </AuthProvider>
      </HelmetProvider>
    </QueryClientProvider>
  </StrictMode>
);
