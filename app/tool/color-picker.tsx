import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Platform, Animated } from 'react-native';
import KeyboardAwareScrollView from '../../components/KeyboardAwareScrollView';
import Slider from '@react-native-community/slider';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { spacing, typography } from '../../theme';

export default function ColorPickerScreen() {
  const theme = useTheme();
  
  const [r, setR] = useState(99);
  const [g, setG] = useState(102);
  const [b, setB] = useState(241); // Default to a nice indigo
  const [hexInput, setHexInput] = useState('#6366F1');
  const [toastOpacity] = useState(new Animated.Value(0));

  // Convert RGB to HEX
  const rgbToHex = (red: number, green: number, blue: number) => {
    return '#' + [red, green, blue].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('').toUpperCase();
  };

  // Convert RGB to HSL
  const rgbToHsl = (r: number, g: number, b: number) => {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
  };

  // Sync sliders to Hex text
  useEffect(() => {
    const hex = rgbToHex(r, g, b);
    setHexInput(hex);
  }, [r, g, b]);

  // Handle Hex manual input
  const handleHexSubmit = () => {
    let hex = hexInput.replace('#', '');
    if (hex.length === 3) {
      hex = hex.split('').map(char => char + char).join('');
    }
    if (hex.length === 6 && /^[0-9A-Fa-f]{6}$/i.test(hex)) {
      setR(parseInt(hex.substring(0, 2), 16));
      setG(parseInt(hex.substring(2, 4), 16));
      setB(parseInt(hex.substring(4, 6), 16));
    } else {
      // Revert back to valid state
      setHexInput(rgbToHex(r, g, b));
    }
  };

  const copyToClipboard = async (text: string) => {
    await Clipboard.setStringAsync(text);
    
    // Show Toast
    toastOpacity.setValue(0);
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(1500),
      Animated.timing(toastOpacity, { toValue: 0, duration: 200, useNativeDriver: true })
    ]).start();
  };

  const currentColorHex = rgbToHex(r, g, b);
  const currentColorRgb = `rgb(${r}, ${g}, ${b})`;
  const currentColorHsl = rgbToHsl(r, g, b);

  return (
    <>
      <Stack.Screen options={{ 
        title: 'Color Picker',
        headerStyle: { backgroundColor: theme.background },
        headerTintColor: theme.textPrimary,
        headerShadowVisible: false,
      }} />
      <KeyboardAwareScrollView style={[styles.container, { backgroundColor: theme.background }]}>
          
          <View style={[styles.previewCard, { backgroundColor: currentColorHex, borderColor: theme.border }]} />

          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            
            <View style={styles.inputRow}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>HEX</Text>
              <View style={[styles.hexInputWrapper, { borderColor: theme.border }]}>
                <TextInput
                  style={[styles.hexInput, { color: theme.textPrimary }]}
                  value={hexInput}
                  onChangeText={setHexInput}
                  onBlur={handleHexSubmit}
                  onSubmitEditing={handleHexSubmit}
                  autoCapitalize="characters"
                  maxLength={7}
                />
                <TouchableOpacity onPress={() => copyToClipboard(currentColorHex)}>
                  <Ionicons name="copy-outline" size={20} color={theme.primary} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.slidersWrapper}>
              
              {/* Red Slider */}
              <View style={styles.sliderGroup}>
                <View style={styles.sliderHeader}>
                  <Text style={[styles.label, { color: theme.textSecondary }]}>Red</Text>
                  <Text style={[styles.valueText, { color: theme.textPrimary }]}>{r}</Text>
                </View>
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={255}
                  step={1}
                  value={r}
                  onValueChange={setR}
                  minimumTrackTintColor="#FF3B30"
                  maximumTrackTintColor={theme.border}
                  thumbTintColor="#FF3B30"
                />
              </View>

              {/* Green Slider */}
              <View style={styles.sliderGroup}>
                <View style={styles.sliderHeader}>
                  <Text style={[styles.label, { color: theme.textSecondary }]}>Green</Text>
                  <Text style={[styles.valueText, { color: theme.textPrimary }]}>{g}</Text>
                </View>
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={255}
                  step={1}
                  value={g}
                  onValueChange={setG}
                  minimumTrackTintColor="#34C759"
                  maximumTrackTintColor={theme.border}
                  thumbTintColor="#34C759"
                />
              </View>

              {/* Blue Slider */}
              <View style={styles.sliderGroup}>
                <View style={styles.sliderHeader}>
                  <Text style={[styles.label, { color: theme.textSecondary }]}>Blue</Text>
                  <Text style={[styles.valueText, { color: theme.textPrimary }]}>{b}</Text>
                </View>
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={255}
                  step={1}
                  value={b}
                  onValueChange={setB}
                  minimumTrackTintColor="#007AFF"
                  maximumTrackTintColor={theme.border}
                  thumbTintColor="#007AFF"
                />
              </View>

            </View>
          </View>

          <View style={[styles.formatsCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Export Formats</Text>
            
            <TouchableOpacity style={[styles.formatRow, { borderBottomColor: theme.border }]} onPress={() => copyToClipboard(currentColorRgb)}>
              <Text style={[styles.formatLabel, { color: theme.textSecondary }]}>RGB</Text>
              <Text style={[styles.formatValue, { color: theme.textPrimary }]} numberOfLines={1}>{currentColorRgb}</Text>
              <Ionicons name="copy-outline" size={20} color={theme.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.formatRow} onPress={() => copyToClipboard(currentColorHsl)}>
              <Text style={[styles.formatLabel, { color: theme.textSecondary }]}>HSL</Text>
              <Text style={[styles.formatValue, { color: theme.textPrimary }]} numberOfLines={1}>{currentColorHsl}</Text>
              <Ionicons name="copy-outline" size={20} color={theme.textSecondary} />
            </TouchableOpacity>

          </View>
      </KeyboardAwareScrollView>

      <Animated.View style={[styles.toast, { opacity: toastOpacity, backgroundColor: theme.textPrimary }]} pointerEvents="none">
        <Text style={[styles.toastText, { color: theme.background }]}>Copied to clipboard!</Text>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.l, paddingBottom: 80 },
  previewCard: {
    height: 150,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: spacing.xl,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  card: {
    padding: spacing.xl,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: spacing.xl,
  },
  inputRow: {
    marginBottom: spacing.xl,
  },
  label: {
    fontSize: typography.sizes.s,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.xs,
    fontWeight: typography.weights.bold,
  },
  hexInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: spacing.m,
  },
  hexInput: {
    flex: 1,
    fontSize: typography.sizes.l,
    fontWeight: typography.weights.bold,
    paddingVertical: spacing.m,
  },
  slidersWrapper: {
    gap: spacing.m,
  },
  sliderGroup: {
    marginBottom: spacing.m,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  valueText: {
    fontSize: typography.sizes.m,
    fontWeight: typography.weights.bold,
    fontVariant: ['tabular-nums'],
  },
  slider: {
    width: '100%',
    height: 40,
  },
  formatsCard: {
    padding: spacing.l,
    borderRadius: 24,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: typography.sizes.m,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.m,
  },
  formatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.m,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  formatLabel: {
    width: 50,
    fontSize: typography.sizes.s,
    fontWeight: typography.weights.bold,
  },
  formatValue: {
    flex: 1,
    fontSize: typography.sizes.m,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  toast: {
    position: 'absolute',
    bottom: 50,
    alignSelf: 'center',
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.m,
    borderRadius: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  toastText: {
    fontSize: typography.sizes.m,
    fontWeight: typography.weights.bold,
  },
});
