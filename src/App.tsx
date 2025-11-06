import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navigation from "./components/Layout/Navigation";
import DashboardOverview from "./pages/DashboardOverview";
import DeviceMonitoring from "./pages/DeviceMonitoring";
import RiskAlerts from "./pages/RiskAlerts";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import "bootstrap/dist/css/bootstrap.min.css";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="min-vh-100 bg-dark">
          <Navigation />
          <Routes>
            <Route path="/" element={<DashboardOverview />} />
            <Route path="/devices" element={<DeviceMonitoring />} />
            <Route path="/alerts" element={<RiskAlerts />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
