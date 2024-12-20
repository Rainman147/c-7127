import React, { createContext, useContext, useState, useEffect } from 'react';

interface SidebarContextType {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

const SIDEBAR_STATE_KEY = 'sidebar_state';

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  // Initialize state from localStorage if available
  const [isOpen, setIsOpen] = useState(() => {
    const savedState = localStorage.getItem(SIDEBAR_STATE_KEY);
    return savedState ? JSON.parse(savedState) : true;
  });

  // Persist state changes to localStorage
  useEffect(() => {
    console.log('[SidebarContext] Persisting state:', { isOpen });
    localStorage.setItem(SIDEBAR_STATE_KEY, JSON.stringify(isOpen));
  }, [isOpen]);

  const open = () => {
    console.log('[SidebarContext] Opening sidebar');
    setIsOpen(true);
  };

  const close = () => {
    console.log('[SidebarContext] Closing sidebar');
    setIsOpen(false);
  };

  return (
    <SidebarContext.Provider value={{ isOpen, open, close }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
}