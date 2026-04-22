import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type ThemeMode = 'system' | 'light' | 'dark';

interface AppState {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  recentTools: string[];
  addRecentTool: (toolId: string) => void;
  clearRecentTools: () => void;
  exportDirectoryUri: string | null;
  setExportDirectoryUri: (uri: string | null) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      themeMode: 'system',
      setThemeMode: (mode) => set({ themeMode: mode }),
      recentTools: [],
      addRecentTool: (toolId) => set((state) => {
        const filtered = state.recentTools.filter(id => id !== toolId);
        return { recentTools: [toolId, ...filtered].slice(0, 10) }; // Keep max 10
      }),
      clearRecentTools: () => set({ recentTools: [] }),
      exportDirectoryUri: null,
      setExportDirectoryUri: (uri: string | null) => set({ exportDirectoryUri: uri }),
    }),
    {
      name: 'utility-hub-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
