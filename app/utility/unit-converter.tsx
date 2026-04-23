import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Modal } from 'react-native';
import KeyboardAwareScrollView from '../../components/KeyboardAwareScrollView';
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

  const [modalVisible, setModalVisible] = useState(false);
  const [activeSelector, setActiveSelector] = useState<'from' | 'to' | null>(null);

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

  const openDropdown = (type: 'from' | 'to') => {
    setActiveSelector(type);
    setModalVisible(true);
  };

  const selectUnit = (unit: string) => {
    if (activeSelector === 'from') setFromUnit(unit);
    else if (activeSelector === 'to') setToUnit(unit);
    setModalVisible(false);
  };

  const renderUnitDropdownButton = (currentUnit: string, type: 'from' | 'to') => {
    return (
      <TouchableOpacity 
        style={[styles.dropdownBtn, { backgroundColor: theme.surface, borderColor: theme.border }]} 
        onPress={() => openDropdown(type)}
      >
        <Text style={{ color: theme.textPrimary, fontSize: typography.sizes.m, fontWeight: 'bold' }}>{currentUnit}</Text>
        <Ionicons name="chevron-down" size={20} color={theme.textSecondary} />
      </TouchableOpacity>
    );
  };

  const renderModal = () => {
    const units = Object.keys(CONVERSIONS[category]);
    return (
      <Modal visible={modalVisible} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setModalVisible(false)}>
          <View style={[styles.modalContent, { backgroundColor: theme.surface, borderColor: theme.border }]} onStartShouldSetResponder={() => true}>
            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Select Unit</Text>
            <ScrollView style={{ maxHeight: 300, width: '100%' }}>
              {units.map((u) => {
                const isSelected = activeSelector === 'from' ? fromUnit === u : toUnit === u;
                return (
                  <TouchableOpacity
                    key={u}
                    style={[
                      styles.modalOption,
                      { backgroundColor: isSelected ? theme.primary + '15' : 'transparent' }
                    ]}
                    onPress={() => selectUnit(u)}
                  >
                    <Text style={{ 
                      color: isSelected ? theme.primary : theme.textPrimary,
                      fontWeight: isSelected ? 'bold' : 'normal',
                      fontSize: typography.sizes.m
                    }}>
                      {u}
                    </Text>
                    {isSelected && <Ionicons name="checkmark" size={20} color={theme.primary} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
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
      <KeyboardAwareScrollView style={[styles.container, { backgroundColor: theme.background }]}>
          
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
              {renderUnitDropdownButton(fromUnit, 'from')}
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
              {renderUnitDropdownButton(toUnit, 'to')}
            </View>

          </View>
          {renderModal()}
      </KeyboardAwareScrollView>
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
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s + 4,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: spacing.xs,
    width: 160,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.l,
    borderTopWidth: 1,
    maxHeight: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: typography.sizes.l,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.l,
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.m,
    paddingHorizontal: spacing.m,
    borderRadius: 12,
    marginBottom: spacing.xs,
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
