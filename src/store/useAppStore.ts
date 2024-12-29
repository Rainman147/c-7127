import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface AppState {
  // UI State
  isSidebarOpen: boolean;
  isDarkMode: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
  setIsDarkMode: (isDark: boolean) => void;

  // Chat Session State
  activeSessionId: string | null;
  setActiveSessionId: (id: string | null) => void;
  
  // Template State
  activeTemplateId: string;
  setActiveTemplateId: (id: string) => void;
}

export const useAppStore = create<AppState>()(
  devtools(
    (set) => ({
      // UI State
      isSidebarOpen: false,
      isDarkMode: false,
      setIsSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
      setIsDarkMode: (isDark) => set({ isDarkMode: isDark }),

      // Chat Session State
      activeSessionId: null,
      setActiveSessionId: (id) => set({ activeSessionId: id }),

      // Template State
      activeTemplateId: 'live-session',
      setActiveTemplateId: (id) => set({ activeTemplateId: id }),
    }),
    { name: 'app-store' }
  )
);