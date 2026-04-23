import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useTheme } from '../hooks/useTheme';
import { useAppStore } from '../store/useAppStore';

export default function RootLayout() {
  const { isDark } = useTheme();
  const animationsEnabled = useAppStore(state => state.animationsEnabled);

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(isDark ? '#111827' : '#F9FAFB');
  }, [isDark]);

  return (
    <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{
        animation: animationsEnabled ? 'slide_from_right' : 'none',
        animationDuration: animationsEnabled ? 200 : undefined,
        contentStyle: { backgroundColor: isDark ? '#111827' : '#F9FAFB' }
      }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" options={{ title: 'Oops!' }} />
      </Stack>
      <StatusBar style={isDark ? "light" : "dark"} />
    </ThemeProvider>
  );
}
