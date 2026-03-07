import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import DashboardPage from "./pages/DashboardPage";
import AlertsPage from "./pages/AlertsPage";
import VehiclesPage from "./pages/VehiclesPage";
import VehicleDetailPage from "./pages/VehicleDetailPage";
import LiveTelemetryPage from "./pages/LiveTelemetryPage";
import LiveEvaluationPage from "./pages/LiveEvaluationPage";
import InsightsPage from "./pages/InsightsPage";
import NotFound from "./pages/NotFound";
import LandingPage from "./pages/LandingPage";

const queryClient = new QueryClient();

function PageTransition(props: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] as const }}
    >
      {props.children}
    </motion.div>
  );
}

function AppRoutes() {
  const location = useLocation();
  return (
    <LayoutGroup>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<PageTransition><LandingPage /></PageTransition>} />
          <Route path="/dashboard" element={<PageTransition><DashboardPage /></PageTransition>} />
          <Route path="/alerts" element={<PageTransition><AlertsPage /></PageTransition>} />
          <Route path="/vehicles" element={<PageTransition><VehiclesPage /></PageTransition>} />
          <Route path="/vehicles/:id" element={<PageTransition><VehicleDetailPage /></PageTransition>} />
          <Route path="/telemetry" element={<PageTransition><LiveTelemetryPage /></PageTransition>} />
          <Route path="/evaluation" element={<PageTransition><LiveEvaluationPage /></PageTransition>} />
          <Route path="/insights" element={<PageTransition><InsightsPage /></PageTransition>} />
          <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
        </Routes>
      </AnimatePresence>
    </LayoutGroup>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
