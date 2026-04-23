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
  animationsEnabled: boolean;
  setAnimationsEnabled: (enabled: boolean) => void;
  convertApiKey: string | null;
  setConvertApiKey: (key: string | null) => void;
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
      animationsEnabled: true,
      setAnimationsEnabled: (enabled) => set({ animationsEnabled: enabled }),
      convertApiKey: null,
      setConvertApiKey: (key: string | null) => set({ convertApiKey: key }),
    }),
    {
      name: 'utility-hub-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
