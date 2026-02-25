import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navigation from "./components/Layout/Navigation";
import { PowerStripProvider } from "@/context/PowerStripContext";
import DashboardOverview from "./pages/DashboardOverview";
import DeviceMonitoring from "./pages/DeviceMonitoring";
import Consumption from "./pages/Consumption";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import "bootstrap/dist/css/bootstrap.min.css";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster
        richColors
        theme="dark"
        position="top-center"
        style={{ zIndex: 99999 }}
      />

      <PowerStripProvider>
        <BrowserRouter>
          <div className="min-vh-100 bg-slate-950">
            <Navigation />
            <Routes>
              <Route path="/" element={<DashboardOverview />} />
              <Route path="/devices" element={<DeviceMonitoring />} />
              <Route path="/consumption" element={<Consumption />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </BrowserRouter>
      </PowerStripProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;