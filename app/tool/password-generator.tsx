import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Platform } from 'react-native';
import Slider from '@react-native-community/slider';
import * as FileSystem from 'expo-file-system/legacy';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { spacing, typography } from '../../theme';
import { shareFile, saveToDevice } from '../../utils/exportManager';

export default function PasswordGeneratorScreen() {
  const theme = useTheme();

  const [password, setPassword] = useState('');
  const [length, setLength] = useState(16);
  const [includeUppercase, setIncludeUppercase] = useState(true);
  const [includeLowercase, setIncludeLowercase] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [includeSymbols, setIncludeSymbols] = useState(true);
  const [copied, setCopied] = useState(false);

  const generatePassword = useCallback(() => {
    let chars = '';
    if (includeUppercase) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (includeLowercase) chars += 'abcdefghijklmnopqrstuvwxyz';
    if (includeNumbers) chars += '0123456789';
    if (includeSymbols) chars += '@!#$%&*?+-=';

    // Fallback if none selected
    if (!chars) {
      chars = 'abcdefghijklmnopqrstuvwxyz';
      setIncludeLowercase(true);
    }

    let newPassword = '';
    for (let i = 0; i < length; i++) {
      newPassword += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(newPassword);
    setCopied(false);
  }, [length, includeUppercase, includeLowercase, includeNumbers, includeSymbols]);

  useEffect(() => {
    generatePassword();
  }, [generatePassword]);

  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const exportPassword = async (action: 'share' | 'save') => {
    try {
      const filePath = FileSystem.cacheDirectory + 'password.txt';
      await FileSystem.writeAsStringAsync(filePath, password, {
        encoding: 'utf8',
      });
      
      if (action === 'share') {
        await shareFile(filePath, 'text/plain', 'Share Password');
      } else {
        await saveToDevice(filePath, `password_${Date.now()}.txt`, 'text/plain', 'Password Generator');
      }
    } catch (e) {
      console.error(e);
      alert('Failed to export password.');
    }
  };

  return (
    <>
      <Stack.Screen options={{ 
        title: 'Password Generator',
        headerStyle: { backgroundColor: theme.background },
        headerTintColor: theme.textPrimary,
        headerShadowVisible: false,
      }} />
      <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.content}>

          {/* Password Display */}
          <View style={[styles.displayContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.passwordText, { color: theme.textPrimary }]} selectable>
              {password}
            </Text>
            <View style={styles.displayActions}>
              <TouchableOpacity onPress={copyToClipboard} style={styles.iconBtn}>
                <Ionicons name={copied ? "checkmark" : "copy-outline"} size={24} color={copied ? theme.primary : theme.textSecondary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={generatePassword} style={styles.iconBtn}>
                <Ionicons name="refresh-outline" size={24} color={theme.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Config */}
          <View style={[styles.configCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.sliderHeader}>
              <Text style={[styles.label, { color: theme.textPrimary }]}>Length</Text>
              <Text style={[styles.value, { color: theme.primary }]}>{length}</Text>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={8}
              maximumValue={64}
              step={1}
              value={length}
              onValueChange={setLength}
              minimumTrackTintColor={theme.primary}
              maximumTrackTintColor={theme.border}
              thumbTintColor={theme.primary}
            />

            <View style={styles.divider} />

            <View style={styles.toggleRow}>
              <Text style={[styles.toggleLabel, { color: theme.textPrimary }]}>Uppercase (A-Z)</Text>
              <Switch value={includeUppercase} onValueChange={setIncludeUppercase} trackColor={{ false: theme.border, true: theme.primary }} />
            </View>
            <View style={styles.toggleRow}>
              <Text style={[styles.toggleLabel, { color: theme.textPrimary }]}>Lowercase (a-z)</Text>
              <Switch value={includeLowercase} onValueChange={setIncludeLowercase} trackColor={{ false: theme.border, true: theme.primary }} />
            </View>
            <View style={styles.toggleRow}>
              <Text style={[styles.toggleLabel, { color: theme.textPrimary }]}>Numbers (0-9)</Text>
              <Switch value={includeNumbers} onValueChange={setIncludeNumbers} trackColor={{ false: theme.border, true: theme.primary }} />
            </View>
            <View style={styles.toggleRow}>
              <Text style={[styles.toggleLabel, { color: theme.textPrimary }]}>Symbols (@!#%)</Text>
              <Switch value={includeSymbols} onValueChange={setIncludeSymbols} trackColor={{ false: theme.border, true: theme.primary }} />
            </View>
          </View>

          {/* Export Actions */}
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Export Options</Text>
          <View style={styles.actionRowGrid}>
            <TouchableOpacity 
              style={[styles.primaryActionBtn, { backgroundColor: theme.primary }]}
              onPress={() => exportPassword('share')}
            >
              <Ionicons name="share-outline" size={20} color={theme.background} />
              <Text style={{ color: theme.background, fontWeight: 'bold' }}>Share</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.primaryActionBtn, { backgroundColor: theme.primary }]}
              onPress={() => exportPassword('save')}
            >
              <Ionicons name="download-outline" size={20} color={theme.background} />
              <Text style={{ color: theme.background, fontWeight: 'bold' }}>Save as TXT</Text>
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.l, paddingBottom: 40 },
  displayContainer: {
    padding: spacing.xl,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 140,
  },
  passwordText: {
    fontSize: 28,
    fontWeight: typography.weights.bold,
    textAlign: 'center',
    marginBottom: spacing.l,
  },
  displayActions: {
    flexDirection: 'row',
    gap: spacing.l,
    position: 'absolute',
    bottom: spacing.m,
    right: spacing.m,
  },
  iconBtn: {
    padding: spacing.s,
  },
  configCard: {
    padding: spacing.l,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: spacing.xl,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.s,
  },
  label: {
    fontSize: typography.sizes.m,
    fontWeight: typography.weights.bold,
  },
  value: {
    fontSize: typography.sizes.l,
    fontWeight: typography.weights.bold,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(150,150,150,0.2)',
    marginVertical: spacing.m,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.s,
  },
  toggleLabel: {
    fontSize: typography.sizes.m,
    fontWeight: typography.weights.medium,
  },
  sectionTitle: {
    fontSize: typography.sizes.m,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.m,
  },
  actionRowGrid: {
    flexDirection: 'row',
    gap: spacing.m,
  },
  primaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.s,
    padding: spacing.m,
    borderRadius: 12,
  },
});
