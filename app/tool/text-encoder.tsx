import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Animated, Platform, KeyboardAvoidingView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '../../hooks/useTheme';
import { spacing, typography } from '../../theme';

export default function BaseConverterScreen() {
  const theme = useTheme();
  
  const [values, setValues] = useState({ text: '', bin: '', dec: '', hex: '', oct: '' });
  const [activeInput, setActiveInput] = useState<string | null>(null);
  
  const [toastMessage, setToastMessage] = useState('');
  const toastOpacity = useRef(new Animated.Value(0)).current;

  const showToast = (message: string) => {
    setToastMessage(message);
    toastOpacity.setValue(0);
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(1500),
      Animated.timing(toastOpacity, { toValue: 0, duration: 200, useNativeDriver: true })
    ]).start();
  };

  const copyToClipboard = async (value: string, label: string) => {
    if (!value) return;
    await Clipboard.setStringAsync(value);
    showToast(`Copied ${label}!`);
  };

  const convertFrom = (sourceBase: string, rawValue: string) => {
    try {
      let numbers: number[] = [];

      if (sourceBase === 'text') {
        for (let i = 0; i < rawValue.length; i++) {
          numbers.push(rawValue.charCodeAt(i));
        }
      } else {
        // Split by spaces or commas for multi-character conversion
        const parts = rawValue.trim().split(/[\s,]+/);
        
        let radix = 10;
        if (sourceBase === 'bin') radix = 2;
        if (sourceBase === 'hex') radix = 16;
        if (sourceBase === 'oct') radix = 8;

        numbers = parts.map(p => parseInt(p, radix)).filter(n => !isNaN(n));
      }

      return {
        text: numbers.map(n => String.fromCharCode(n)).join(''),
        bin: numbers.map(n => n.toString(2).padStart(8, '0')).join(' '),
        dec: numbers.map(n => n.toString(10)).join(' '),
        hex: numbers.map(n => n.toString(16).toUpperCase().padStart(2, '0')).join(' '),
        oct: numbers.map(n => n.toString(8).padStart(3, '0')).join(' '),
      };
    } catch (e) {
      return null;
    }
  };

  const handleInputChange = (source: string, rawText: string) => {
    if (!rawText) {
      setValues({ text: '', bin: '', dec: '', hex: '', oct: '' });
      return;
    }

    const converted = convertFrom(source, rawText);
    
    if (converted) {
      setValues({
        ...converted,
        [source]: rawText // Always preserve exactly what the user is typing
      });
    } else {
      setValues(prev => ({ ...prev, [source]: rawText }));
    }
  };

  const clearAll = () => {
    setValues({ text: '', bin: '', dec: '', hex: '', oct: '' });
  };

  const renderInputCard = (id: keyof typeof values, title: string, placeholder: string, keyboardType: any = 'default') => {
    const isFocused = activeInput === id;
    
    return (
      <View key={id} style={[styles.card, { backgroundColor: theme.surface, borderColor: isFocused ? theme.primary : theme.border }]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardTitle, { color: isFocused ? theme.primary : theme.textSecondary }]}>{title}</Text>
          <TouchableOpacity 
            style={styles.copyBtn} 
            onPress={() => copyToClipboard(values[id], title)}
            disabled={!values[id]}
          >
            <Ionicons name="copy-outline" size={20} color={values[id] ? theme.textPrimary : theme.border} />
          </TouchableOpacity>
        </View>
        <TextInput
          style={[styles.inputArea, { color: theme.textPrimary, backgroundColor: theme.background }]}
          placeholder={placeholder}
          placeholderTextColor={theme.textSecondary}
          multiline
          keyboardType={keyboardType}
          value={values[id]}
          onFocus={() => setActiveInput(id)}
          onBlur={() => setActiveInput(null)}
          onChangeText={(text) => handleInputChange(id, text)}
        />
      </View>
    );
  };

  return (
    <>
      <Stack.Screen options={{ 
        title: 'Base Converter',
        headerStyle: { backgroundColor: theme.background },
        headerTintColor: theme.textPrimary,
        headerShadowVisible: false,
        headerRight: () => values.text || values.bin ? (
          <TouchableOpacity onPress={clearAll} style={{ padding: spacing.xs }}>
            <Ionicons name="trash-outline" size={24} color={theme.error} />
          </TouchableOpacity>
        ) : null
      }} />
      <KeyboardAvoidingView 
        style={[styles.container, { backgroundColor: theme.background }]} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 80}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          
          <Text style={[styles.instructions, { color: theme.textSecondary }]}>
            Type in any box to instantly convert to all other bases. Separate multiple values with spaces.
          </Text>

          <View style={styles.resultsGrid}>
            {renderInputCard('text', 'Text (ASCII)', 'e.g. Hello')}
            {renderInputCard('bin', 'Binary (Base 2)', 'e.g. 01001000 01101001', 'numeric')}
            {renderInputCard('hex', 'Hexadecimal (Base 16)', 'e.g. 48 69')}
            {renderInputCard('dec', 'Decimal (Base 10)', 'e.g. 72 105', 'numeric')}
            {renderInputCard('oct', 'Octal (Base 8)', 'e.g. 110 151', 'numeric')}
          </View>

        </ScrollView>

        {/* Floating Animated Toast */}
        <Animated.View style={[styles.toast, { opacity: toastOpacity, backgroundColor: theme.textPrimary }]} pointerEvents="none">
          <Ionicons name="checkmark-circle" size={20} color={theme.background} />
          <Text style={[styles.toastText, { color: theme.background }]}>{toastMessage}</Text>
        </Animated.View>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.l, paddingBottom: spacing.xxl },
  instructions: {
    fontSize: typography.sizes.s,
    marginBottom: spacing.l,
    fontStyle: 'italic',
  },
  resultsGrid: {
    gap: spacing.l,
  },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  cardTitle: {
    fontSize: typography.sizes.s,
    fontWeight: typography.weights.bold,
    textTransform: 'uppercase',
  },
  copyBtn: {
    padding: 4,
  },
  inputArea: {
    minHeight: 80,
    maxHeight: 150,
    padding: spacing.m,
    fontSize: typography.sizes.m,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    textAlignVertical: 'top',
  },
  toast: {
    position: 'absolute',
    bottom: 50,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.m,
    paddingHorizontal: spacing.l,
    borderRadius: 24,
    gap: spacing.s,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  toastText: {
    fontSize: typography.sizes.m,
    fontWeight: typography.weights.medium,
  },
});
