import React, { createContext, useContext, useState, useCallback } from 'react';

interface UIContextType {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;
  openSidebar: () => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider = ({ children }: { children: React.ReactNode }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = useCallback(() => {
    console.log('[UIContext] Toggling sidebar');
    setIsSidebarOpen(prev => !prev);
  }, []);

  const closeSidebar = useCallback(() => {
    console.log('[UIContext] Closing sidebar');
    setIsSidebarOpen(false);
  }, []);

  const openSidebar = useCallback(() => {
    console.log('[UIContext] Opening sidebar');
    setIsSidebarOpen(true);
  }, []);

  return (
    <UIContext.Provider 
      value={{ 
        isSidebarOpen, 
        toggleSidebar, 
        closeSidebar, 
        openSidebar 
      }}
    >
      {children}
    </UIContext.Provider>
  );
};

export const useUI = () => {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
};