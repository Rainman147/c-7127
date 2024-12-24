import { Routes, Route, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { logger, LogCategory } from '@/utils/logging';
import Index from '@/pages/Index';
import Auth from '@/pages/Auth';
import MainLayout from '@/components/layout/MainLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useToast } from '@/hooks/use-toast';

const AppRoutes = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    logger.info(LogCategory.ROUTING, 'AppRoutes', 'Setting up route change listener');
    
    // Handle any invalid route states
    const handleInvalidRoute = () => {
      const path = window.location.pathname;
      if (path.startsWith('/c/') && !path.match(/^\/c\/[0-9a-fA-F-]+$/)) {
        logger.warn(LogCategory.ROUTING, 'AppRoutes', 'Invalid session route detected, redirecting to home', {
          path,
          timestamp: new Date().toISOString()
        });
        
        toast({
          title: "Invalid Route",
          description: "Redirecting to home page",
          variant: "destructive"
        });
        
        navigate('/', { replace: true });
      }
    };

    handleInvalidRoute();
  }, [navigate, toast]);

  return (
    <Routes>
      <Route path="/auth" element={<Auth />} />
      
      <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        <Route path="/" element={<Index />} />
        <Route path="/c/:sessionId" element={<Index />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;