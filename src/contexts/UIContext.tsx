import React, { createContext, useContext, useState, useEffect } from 'react';

// Define explicit types for our context
interface UIState {
  isSidebarOpen: boolean;
  isDesktop: boolean;
}

interface UIContextType extends UIState {
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

const DESKTOP_BREAKPOINT = 768; // Matches the existing breakpoint

export function UIProvider({ children }: { children: React.ReactNode }) {
  console.log('[UIProvider] Initializing');
  
  // Combine related state
  const [state, setState] = useState<UIState>(() => {
    const isDesktop = window.innerWidth >= DESKTOP_BREAKPOINT;
    return {
      isSidebarOpen: isDesktop, // Default open on desktop, closed on mobile
      isDesktop,
    };
  });

  useEffect(() => {
    console.log('[UIProvider] Setting up resize listener');
    
    const handleResize = () => {
      const isDesktop = window.innerWidth >= DESKTOP_BREAKPOINT;
      console.log('[UIProvider] Window resized, isDesktop:', isDesktop);
      
      setState(prevState => {
        // Only update if there's a change in device type
        if (prevState.isDesktop !== isDesktop) {
          console.log('[UIProvider] Device type changed, updating sidebar state');
          return {
            isDesktop,
            // Auto-close on mobile, auto-open on desktop
            isSidebarOpen: isDesktop,
          };
        }
        return prevState;
      });
    };

    window.addEventListener('resize', handleResize);
    return () => {
      console.log('[UIProvider] Cleaning up resize listener');
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const toggleSidebar = () => {
    console.log('[UIProvider] Toggling sidebar');
    setState(prev => ({
      ...prev,
      isSidebarOpen: !prev.isSidebarOpen,
    }));
  };

  const setSidebarOpen = (open: boolean) => {
    console.log('[UIProvider] Setting sidebar open:', open);
    setState(prev => ({
      ...prev,
      isSidebarOpen: open,
    }));
  };

  const value = {
    ...state,
    toggleSidebar,
    setSidebarOpen,
  };

  return (
    <UIContext.Provider value={value}>
      {children}
    </UIContext.Provider>
  );
}

export function useUI() {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
}