import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Platform, KeyboardAvoidingView, ActivityIndicator, Modal, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { spacing, typography } from '../../theme';

const POPULAR_CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'INR', 'AUD', 'CAD', 'SGD', 'CHF', 'CNY'];

export default function CurrencyConverterScreen() {
  const theme = useTheme();
  
  const [rates, setRates] = useState<Record<string, number>>({});
  const [currencies, setCurrencies] = useState<string[]>(POPULAR_CURRENCIES);
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('EUR');
  const [inputValue, setInputValue] = useState('1');
  const [result, setResult] = useState('');
  const [lastUpdated, setLastUpdated] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'from' | 'to' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchRates();
  }, []);

  const fetchRates = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('https://open.er-api.com/v6/latest/USD');
      const data = await res.json();
      if (data.result === 'success') {
        setRates(data.rates);
        
        const allKeys = Object.keys(data.rates);
        const sorted = [
          ...POPULAR_CURRENCIES.filter(c => allKeys.includes(c)),
          ...allKeys.filter(c => !POPULAR_CURRENCIES.includes(c))
        ];
        setCurrencies(sorted);
        
        const date = new Date(data.time_last_update_unix * 1000);
        setLastUpdated(date.toLocaleString());
      }
    } catch (e) {
      console.error(e);
      alert('Failed to fetch live exchange rates.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (Object.keys(rates).length === 0) return;

    const val = parseFloat(inputValue);
    if (isNaN(val)) {
      setResult('');
      return;
    }

    const fromRate = rates[fromCurrency];
    const toRate = rates[toCurrency];

    if (fromRate && toRate) {
      const baseUsd = val / fromRate;
      const converted = baseUsd * toRate;
      setResult(converted.toFixed(4));
    }
  }, [inputValue, fromCurrency, toCurrency, rates]);

  const swapCurrencies = () => {
    const temp = fromCurrency;
    setFromCurrency(toCurrency);
    setToCurrency(temp);
  };

  const openSelector = (type: 'from' | 'to') => {
    setModalType(type);
    setSearchQuery('');
    setModalVisible(true);
  };

  const renderCurrencySelector = (currentCurrency: string, type: 'from' | 'to') => {
    return (
      <TouchableOpacity 
        style={[styles.dropdownBtn, { borderColor: theme.border, backgroundColor: theme.surface }]} 
        onPress={() => openSelector(type)}
      >
        <Text style={{ color: theme.textPrimary, fontWeight: 'bold', fontSize: typography.sizes.m }}>
          {currentCurrency}
        </Text>
        <Ionicons name="chevron-down" size={20} color={theme.textSecondary} />
      </TouchableOpacity>
    );
  };

  const filteredCurrencies = currencies.filter(c => c.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleSelectCurrency = (c: string) => {
    if (modalType === 'from') setFromCurrency(c);
    if (modalType === 'to') setToCurrency(c);
    setModalVisible(false);
  };

  return (
    <>
      <Stack.Screen options={{ 
        title: 'Currency Converter',
        headerStyle: { backgroundColor: theme.background },
        headerTintColor: theme.textPrimary,
        headerShadowVisible: false,
      }} />
      <KeyboardAvoidingView 
        style={[styles.container, { backgroundColor: theme.background }]} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          
          <View style={[styles.headerRow, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View>
              <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Live Rates</Text>
              <Text style={[styles.headerSub, { color: theme.textSecondary }]}>
                {lastUpdated ? `Updated: ${lastUpdated}` : 'Fetching rates...'}
              </Text>
            </View>
            <TouchableOpacity onPress={fetchRates} disabled={isLoading} style={styles.refreshBtn}>
              {isLoading ? <ActivityIndicator color={theme.primary} /> : <Ionicons name="refresh" size={24} color={theme.primary} />}
            </TouchableOpacity>
          </View>

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
              {renderCurrencySelector(fromCurrency, 'from')}
            </View>

            <View style={styles.swapWrapper}>
              <View style={[styles.line, { backgroundColor: theme.border }]} />
              <TouchableOpacity style={[styles.swapBtn, { backgroundColor: theme.primary }]} onPress={swapCurrencies}>
                <Ionicons name="swap-vertical" size={24} color={theme.background} />
              </TouchableOpacity>
              <View style={[styles.line, { backgroundColor: theme.border }]} />
            </View>

            <View style={styles.inputSection}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>To</Text>
              <Text style={[styles.largeOutput, { color: theme.primary, borderBottomColor: theme.border }]}>
                {result || '0'}
              </Text>
              {renderCurrencySelector(toCurrency, 'to')}
            </View>

          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* Currency Selection Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Select Currency</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>
            
            <TextInput
              style={[styles.searchInput, { color: theme.textPrimary, borderColor: theme.border, backgroundColor: theme.surface }]}
              placeholder="Search currency (e.g. USD)"
              placeholderTextColor={theme.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="characters"
              autoCorrect={false}
            />
            
            <FlatList
              data={filteredCurrencies}
              keyExtractor={(item) => item}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={[styles.currencyItem, { borderBottomColor: theme.border }]} 
                  onPress={() => handleSelectCurrency(item)}
                >
                  <Text style={{ color: theme.textPrimary, fontSize: typography.sizes.m, fontWeight: 'bold' }}>{item}</Text>
                  {(modalType === 'from' && fromCurrency === item) || (modalType === 'to' && toCurrency === item) ? (
                    <Ionicons name="checkmark-circle" size={24} color={theme.primary} />
                  ) : null}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.l, paddingBottom: 80 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.m,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: spacing.xl,
  },
  headerTitle: { fontSize: typography.sizes.m, fontWeight: typography.weights.bold },
  headerSub: { fontSize: typography.sizes.xs, marginTop: 2 },
  refreshBtn: { padding: spacing.s },
  converterCard: { padding: spacing.l, borderRadius: 24, borderWidth: 1 },
  inputSection: { flex: 1, minHeight: 120 },
  label: { fontSize: typography.sizes.s, textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.xs },
  largeInput: { fontSize: 48, fontWeight: typography.weights.bold, paddingVertical: spacing.m, borderBottomWidth: 1, marginBottom: spacing.m },
  largeOutput: { fontSize: 48, fontWeight: typography.weights.bold, paddingVertical: spacing.m, borderBottomWidth: 1, marginBottom: spacing.m },
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.m,
    borderRadius: 12,
    borderWidth: 1,
  },
  swapWrapper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginVertical: spacing.l },
  line: { flex: 1, height: 1 },
  swapBtn: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginHorizontal: spacing.m },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '80%',
    padding: spacing.l,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.l,
  },
  modalTitle: {
    fontSize: typography.sizes.l,
    fontWeight: typography.weights.bold,
  },
  closeBtn: {
    padding: spacing.xs,
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.m,
    fontSize: typography.sizes.m,
    marginBottom: spacing.l,
  },
  currencyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.l,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
