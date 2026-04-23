import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Switch } from 'react-native';
import { useFocusEffect } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { useAppStore } from '../../store/useAppStore';
import { spacing, typography } from '../../theme';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { themeMode, setThemeMode, animationsEnabled, setAnimationsEnabled } = useAppStore();
  const [focusKey, setFocusKey] = useState(0);

  useFocusEffect(
    useCallback(() => {
      setFocusKey(prev => prev + 1);
    }, [])
  );


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
    <View key={focusKey} style={[styles.container, { backgroundColor: theme.background }]}>
      <Animated.View 
          style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}
        entering={animationsEnabled ? FadeInDown.delay(100).duration(400) : undefined}
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
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <Ionicons name="color-wand-outline" size={24} color={theme.primary} />
            <Text style={[styles.label, { color: theme.textPrimary }]}>Animations</Text>
          </View>
          <Switch 
            value={animationsEnabled} 
            onValueChange={setAnimationsEnabled}
            trackColor={{ false: theme.border, true: theme.primary }}
            thumbColor={'#ffffff'}
          />
        </View>
      </Animated.View>

      <Animated.View 
        style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border, marginTop: spacing.l }]}
        entering={animationsEnabled ? FadeInDown.delay(150).duration(400) : undefined}
      >
        <TouchableOpacity 
          style={styles.row}
          onPress={() => Linking.openURL('https://github.com/knoxenowo/Utility-tool')}
        >
          <View style={styles.rowLeft}>
            <Ionicons name="logo-github" size={24} color={theme.primary} />
            <Text style={[styles.label, { color: theme.textPrimary }]}>GitHub Repository</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
        </TouchableOpacity>
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
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
        entering={animationsEnabled ? FadeInDown.delay(200).duration(400) : undefined}
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
