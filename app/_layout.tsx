import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import 'react-native-reanimated';

import { useTheme } from '../hooks/useTheme';
import { useAppStore } from '../store/useAppStore';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { isDark } = useTheme();
  const animationsEnabled = useAppStore(state => state.animationsEnabled);

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(isDark ? '#111827' : '#F9FAFB');
    
    // Explicitly hide the splash screen after a short delay to ensure UI is ready
    const timer = setTimeout(() => {
      SplashScreen.hideAsync();
    }, 300);
    
    return () => clearTimeout(timer);
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
