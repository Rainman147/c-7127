import React from 'react';
import { RealTimeProvider } from '@/features/realtime';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Index from './pages/Index';

const App = () => {
  return (
    <RealTimeProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Index />} />
        </Routes>
      </Router>
    </RealTimeProvider>
  );
};

export default App;