import { useColorScheme } from 'react-native';
import { useAppStore } from '../store/useAppStore';
import { colors, ThemeColors } from '../theme';

export function useTheme(): ThemeColors & { isDark: boolean } {
  const systemColorScheme = useColorScheme();
  const themeMode = useAppStore((state) => state.themeMode);

  const isDark = themeMode === 'system' ? systemColorScheme === 'dark' : themeMode === 'dark';

  return {
    ...colors[isDark ? 'dark' : 'light'],
    isDark,
  };
}
