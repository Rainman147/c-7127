import { createContext, useContext, useState, ReactNode } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  console.log('[AuthProvider] Initializing');
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const login = () => {
    console.log('[AuthProvider] Logging in');
    setIsAuthenticated(true);
  };

  const logout = () => {
    console.log('[AuthProvider] Logging out');
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}