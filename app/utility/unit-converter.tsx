import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Platform, KeyboardAvoidingView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { spacing, typography } from '../../theme';

// Conversion Dictionary
const CONVERSIONS = {
  Length: {
    meters: 1,
    kilometers: 1000,
    centimeters: 0.01,
    millimeters: 0.001,
    miles: 1609.34,
    yards: 0.9144,
    feet: 0.3048,
    inches: 0.0254,
  },
  Weight: {
    kilograms: 1,
    grams: 0.001,
    milligrams: 0.000001,
    pounds: 0.453592,
    ounces: 0.0283495,
  },
  Data: {
    Bytes: 1,
    KB: 1024,
    MB: Math.pow(1024, 2),
    GB: Math.pow(1024, 3),
    TB: Math.pow(1024, 4),
  },
  Temperature: {
    Celsius: 'C',
    Fahrenheit: 'F',
    Kelvin: 'K',
  }
};

type Category = keyof typeof CONVERSIONS;

export default function UnitConverterScreen() {
  const theme = useTheme();
  
  const [category, setCategory] = useState<Category>('Length');
  const [fromUnit, setFromUnit] = useState('meters');
  const [toUnit, setToUnit] = useState('feet');
  const [inputValue, setInputValue] = useState('1');
  const [result, setResult] = useState('');

  // When category changes, reset units
  useEffect(() => {
    const units = Object.keys(CONVERSIONS[category]);
    setFromUnit(units[0]);
    setToUnit(units[1]);
  }, [category]);

  // Calculate result whenever inputs change
  useEffect(() => {
    const val = parseFloat(inputValue);
    if (isNaN(val)) {
      setResult('');
      return;
    }

    if (category === 'Temperature') {
      let c = 0;
      // Convert everything to Celsius first
      if (fromUnit === 'Celsius') c = val;
      else if (fromUnit === 'Fahrenheit') c = (val - 32) * 5/9;
      else if (fromUnit === 'Kelvin') c = val - 273.15;

      // Convert Celsius to target
      let res = 0;
      if (toUnit === 'Celsius') res = c;
      else if (toUnit === 'Fahrenheit') res = (c * 9/5) + 32;
      else if (toUnit === 'Kelvin') res = c + 273.15;
      
      setResult(parseFloat(res.toFixed(4)).toString());
    } else {
      const dict = CONVERSIONS[category] as Record<string, number>;
      const baseValue = val * dict[fromUnit];
      const convertedValue = baseValue / dict[toUnit];
      
      // Prevent massive floating point tails
      setResult(parseFloat(convertedValue.toFixed(6)).toString());
    }
  }, [inputValue, fromUnit, toUnit, category]);

  const swapUnits = () => {
    const temp = fromUnit;
    setFromUnit(toUnit);
    setToUnit(temp);
  };

  const renderUnitSelector = (currentUnit: string, setUnit: (u: string) => void) => {
    const units = Object.keys(CONVERSIONS[category]);
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.unitScroll}>
        <View style={styles.unitRow}>
          {units.map((u) => {
            const isSelected = currentUnit === u;
            return (
              <TouchableOpacity
                key={u}
                style={[
                  styles.unitChip, 
                  { 
                    backgroundColor: isSelected ? theme.primary : theme.surface,
                    borderColor: isSelected ? theme.primary : theme.border 
                  }
                ]}
                onPress={() => setUnit(u)}
              >
                <Text style={{ 
                  color: isSelected ? theme.background : theme.textSecondary,
                  fontWeight: isSelected ? 'bold' : 'normal'
                }}>
                  {u}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    );
  };

  return (
    <>
      <Stack.Screen options={{ 
        title: 'Unit Converter',
        headerStyle: { backgroundColor: theme.background },
        headerTintColor: theme.textPrimary,
        headerShadowVisible: false,
      }} />
      <KeyboardAvoidingView 
        style={[styles.container, { backgroundColor: theme.background }]} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          
          {/* Category Selector */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
            <View style={styles.catRow}>
              {(Object.keys(CONVERSIONS) as Category[]).map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.catTab,
                    { borderBottomColor: category === cat ? theme.primary : 'transparent' }
                  ]}
                  onPress={() => setCategory(cat)}
                >
                  <Text style={{ 
                    fontSize: typography.sizes.m, 
                    fontWeight: category === cat ? 'bold' : 'normal',
                    color: category === cat ? theme.textPrimary : theme.textSecondary 
                  }}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Conversion Interface */}
          <View style={[styles.converterCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            
            <View style={styles.inputSection}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>From</Text>
              <TextInput
                style={[styles.largeInput, { color: theme.textPrimary, borderBottomColor: theme.border }]}
                value={inputValue}
                onChangeText={setInputValue}
                keyboardType="numeric"
                returnKeyType="done"
              />
              {renderUnitSelector(fromUnit, setFromUnit)}
            </View>

            <View style={styles.swapWrapper}>
              <View style={[styles.line, { backgroundColor: theme.border }]} />
              <TouchableOpacity style={[styles.swapBtn, { backgroundColor: theme.primary }]} onPress={swapUnits}>
                <Ionicons name="swap-vertical" size={24} color={theme.background} />
              </TouchableOpacity>
              <View style={[styles.line, { backgroundColor: theme.border }]} />
            </View>

            <View style={styles.inputSection}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>To</Text>
              <Text style={[styles.largeOutput, { color: theme.primary, borderBottomColor: theme.border }]}>
                {result || '0'}
              </Text>
              {renderUnitSelector(toUnit, setToUnit)}
            </View>

          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.l,
    paddingBottom: 80,
  },
  catScroll: {
    marginBottom: spacing.xl,
  },
  catRow: {
    flexDirection: 'row',
    gap: spacing.l,
  },
  catTab: {
    paddingVertical: spacing.s,
    borderBottomWidth: 2,
  },
  converterCard: {
    padding: spacing.l,
    borderRadius: 24,
    borderWidth: 1,
    minHeight: 400,
  },
  inputSection: {
    flex: 1,
    minHeight: 120,
  },
  label: {
    fontSize: typography.sizes.s,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  largeInput: {
    fontSize: 48,
    fontWeight: typography.weights.bold,
    paddingVertical: spacing.m,
    borderBottomWidth: 1,
    marginBottom: spacing.m,
  },
  largeOutput: {
    fontSize: 48,
    fontWeight: typography.weights.bold,
    paddingVertical: spacing.m,
    borderBottomWidth: 1,
    marginBottom: spacing.m,
  },
  unitScroll: {
    flexGrow: 0,
  },
  unitRow: {
    flexDirection: 'row',
    gap: spacing.s,
    paddingBottom: spacing.s,
  },
  unitChip: {
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    borderRadius: 20,
    borderWidth: 1,
  },
  swapWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.l,
  },
  line: {
    flex: 1,
    height: 1,
  },
  swapBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing.m,
  },
});
