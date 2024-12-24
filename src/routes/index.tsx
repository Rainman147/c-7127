import { Routes, Route, useNavigate } from 'react-router-dom';
import Index from '@/pages/Index';
import Auth from '@/pages/Auth';
import MainLayout from '@/components/layout/MainLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useEffect } from 'react';
import { logger, LogCategory } from '@/utils/logging';

const AppRoutes = () => {
  const navigate = useNavigate();

  useEffect(() => {
    logger.info(LogCategory.ROUTING, 'AppRoutes', 'Setting up route change listener');
    
    // Handle any invalid route states
    const handleInvalidRoute = () => {
      const path = window.location.pathname;
      if (path.startsWith('/c/') && !path.match(/^\/c\/[0-9a-fA-F-]+$/)) {
        logger.warn(LogCategory.ROUTING, 'AppRoutes', 'Invalid session route detected, redirecting to home');
        navigate('/');
      }
    };

    handleInvalidRoute();
  }, [navigate]);

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