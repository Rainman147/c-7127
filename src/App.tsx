
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { UIProvider } from "@/contexts/UIContext";
import { AuthProvider } from "@/contexts/auth/AuthContext";
import { AuthErrorBoundary } from "@/components/auth/AuthErrorBoundary";
import Router from "./Router";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <AuthErrorBoundary>
        <UIProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <Router />
          </TooltipProvider>
        </UIProvider>
      </AuthErrorBoundary>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
