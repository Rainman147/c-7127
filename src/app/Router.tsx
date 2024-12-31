import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Auth from '@/pages/Auth/LoginPage';
import ChatPage from '@/pages/Chat/ChatPage';
import ProtectedRoute from '@/components/ProtectedRoute';

const Router = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

export default Router;