import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { useAppStore } from '../../store/useAppStore';
import { spacing, typography } from '../../theme';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { themeMode, setThemeMode } = useAppStore();

  const handleThemeChange = () => {
    if (themeMode === 'light') setThemeMode('dark');
    else if (themeMode === 'dark') setThemeMode('system');
    else setThemeMode('light');
  };

  const getThemeText = () => {
    if (themeMode === 'light') return 'Light Mode';
    if (themeMode === 'dark') return 'Dark Mode';
    return 'System Default';
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Animated.View 
          style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}
        entering={FadeInDown.delay(100).duration(400)}
      >
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Ionicons name="moon-outline" size={24} color={theme.primary} />
            <Text style={[styles.label, { color: theme.textPrimary }]}>Appearance</Text>
          </View>
          <TouchableOpacity style={styles.themeToggle} onPress={handleThemeChange}>
            <Text style={[styles.themeValue, { color: theme.textSecondary }]}>{getThemeText()}</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>
      </Animated.View>

      <Animated.View 
        style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border, marginTop: spacing.l }]}
        entering={FadeInDown.delay(150).duration(400)}
      >
        <TouchableOpacity 
          style={styles.row}
          onPress={() => Linking.openURL('https://ko-fi.com/knoxen')}
        >
          <View style={styles.rowLeft}>
            <Ionicons name="cafe-outline" size={24} color={theme.primary} />
            <Text style={[styles.label, { color: theme.textPrimary }]}>Buy me a coffee</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
        </TouchableOpacity>
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <TouchableOpacity 
          style={styles.row}
          onPress={() => router.push('/privacy')}
        >
          <View style={styles.rowLeft}>
            <Ionicons name="shield-checkmark-outline" size={24} color={theme.primary} />
            <Text style={[styles.label, { color: theme.textPrimary }]}>Privacy Policy</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
        </TouchableOpacity>
      </Animated.View>
      
      <Animated.Text 
        style={[styles.footer, { color: theme.textSecondary }]}
        entering={FadeInDown.delay(200).duration(400)}
      >
        Utility Hub v1.0.0{'\n'}100% Free & Open
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.l,
  },
  section: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.m,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.m,
  },
  label: {
    fontSize: typography.sizes.m,
    fontWeight: typography.weights.medium,
  },
  themeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  themeValue: {
    fontSize: typography.sizes.s,
  },
  divider: {
    height: 1,
    marginLeft: spacing.xl + spacing.m, // Align with text
  },
  footer: {
    marginTop: spacing.xl,
    textAlign: 'center',
    fontSize: typography.sizes.xs,
    lineHeight: 18,
  }
});
