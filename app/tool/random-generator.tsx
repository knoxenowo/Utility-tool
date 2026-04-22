import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Platform, KeyboardAvoidingView, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { spacing, typography } from '../../theme';

type Mode = 'number' | 'dice' | 'coin';

export default function RandomGeneratorScreen() {
  const theme = useTheme();
  
  const [mode, setMode] = useState<Mode>('number');
  
  // Number State
  const [minVal, setMinVal] = useState('1');
  const [maxVal, setMaxVal] = useState('100');
  const [numResult, setNumResult] = useState<number | null>(null);

  // Dice State
  const [diceCount, setDiceCount] = useState(1);
  const [diceResults, setDiceResults] = useState<number[]>([]);

  // Coin State
  const [coinResult, setCoinResult] = useState<'Heads' | 'Tails' | null>(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [spinValue] = useState(new Animated.Value(0));

  const triggerAnimation = (callback: () => void) => {
    setIsGenerating(true);
    spinValue.setValue(0);
    Animated.timing(spinValue, {
      toValue: 1,
      duration: 400,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setIsGenerating(false);
      callback();
    });
  };

  const generateNumber = () => {
    const min = parseInt(minVal) || 0;
    const max = parseInt(maxVal) || 100;
    const actualMin = Math.min(min, max);
    const actualMax = Math.max(min, max);
    triggerAnimation(() => {
      setNumResult(Math.floor(Math.random() * (actualMax - actualMin + 1)) + actualMin);
    });
  };

  const rollDice = () => {
    triggerAnimation(() => {
      const rolls = Array.from({ length: diceCount }, () => Math.floor(Math.random() * 6) + 1);
      setDiceResults(rolls);
    });
  };

  const flipCoin = () => {
    triggerAnimation(() => {
      setCoinResult(Math.random() > 0.5 ? 'Heads' : 'Tails');
    });
  };

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  return (
    <>
      <Stack.Screen options={{ 
        title: 'Random Generator',
        headerStyle: { backgroundColor: theme.background },
        headerTintColor: theme.textPrimary,
        headerShadowVisible: false,
      }} />
      <KeyboardAvoidingView 
        style={[styles.container, { backgroundColor: theme.background }]} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          
          {/* Mode Selector */}
          <View style={[styles.tabContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            {(['number', 'dice', 'coin'] as Mode[]).map(m => (
              <TouchableOpacity
                key={m}
                style={[styles.tabBtn, mode === m && { backgroundColor: theme.primary }]}
                onPress={() => setMode(m)}
              >
                <Text style={[styles.tabText, { 
                  color: mode === m ? theme.background : theme.textSecondary,
                  textTransform: 'capitalize' 
                }]}>
                  {m}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={[styles.mainCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            
            {mode === 'number' && (
              <View style={styles.section}>
                <View style={styles.numberInputs}>
                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: theme.textSecondary }]}>Min</Text>
                    <TextInput
                      style={[styles.input, { color: theme.textPrimary, borderColor: theme.border }]}
                      value={minVal}
                      onChangeText={setMinVal}
                      keyboardType="numeric"
                      returnKeyType="done"
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: theme.textSecondary }]}>Max</Text>
                    <TextInput
                      style={[styles.input, { color: theme.textPrimary, borderColor: theme.border }]}
                      value={maxVal}
                      onChangeText={setMaxVal}
                      keyboardType="numeric"
                      returnKeyType="done"
                    />
                  </View>
                </View>
                <View style={[styles.resultBox, { borderColor: theme.border }]}>
                  <Animated.Text style={[
                    styles.hugeText, 
                    { color: theme.primary, transform: [{ scale: spinValue.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 0.5, 1] }) }] }
                  ]}>
                    {numResult !== null ? numResult : '-'}
                  </Animated.Text>
                </View>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.primary }]} onPress={generateNumber} disabled={isGenerating}>
                  <Ionicons name="shuffle" size={24} color={theme.background} />
                  <Text style={[styles.actionText, { color: theme.background }]}>Generate Number</Text>
                </TouchableOpacity>
              </View>
            )}

            {mode === 'dice' && (
              <View style={styles.section}>
                <Text style={[styles.label, { color: theme.textSecondary, textAlign: 'center', marginBottom: spacing.m }]}>
                  How many dice?
                </Text>
                <View style={styles.diceCountRow}>
                  {[1, 2, 3, 4, 5, 6].map(num => (
                    <TouchableOpacity
                      key={num}
                      style={[
                        styles.diceCountBtn,
                        { borderColor: theme.border, backgroundColor: diceCount === num ? theme.primary : 'transparent' }
                      ]}
                      onPress={() => setDiceCount(num)}
                    >
                      <Text style={{ 
                        color: diceCount === num ? theme.background : theme.textPrimary, 
                        fontWeight: 'bold' 
                      }}>
                        {num}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                
                <View style={[styles.diceResultBox, { borderColor: theme.border }]}>
                  {diceResults.length > 0 ? (
                    <Animated.View style={[styles.diceGrid, { transform: [{ rotate: spin }] }]}>
                      {diceResults.map((roll, i) => (
                        <View key={i} style={[styles.diceBox, { borderColor: theme.border }]}>
                          <Text style={[styles.diceText, { color: theme.primary }]}>{roll}</Text>
                        </View>
                      ))}
                    </Animated.View>
                  ) : (
                    <Ionicons name="cube-outline" size={64} color={theme.border} />
                  )}
                  {diceResults.length > 0 && (
                    <Text style={[styles.diceSum, { color: theme.textSecondary }]}>
                      Total: {diceResults.reduce((a, b) => a + b, 0)}
                    </Text>
                  )}
                </View>

                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.primary }]} onPress={rollDice} disabled={isGenerating}>
                  <Ionicons name="cube" size={24} color={theme.background} />
                  <Text style={[styles.actionText, { color: theme.background }]}>Roll Dice</Text>
                </TouchableOpacity>
              </View>
            )}

            {mode === 'coin' && (
              <View style={styles.section}>
                <View style={[styles.coinResultBox, { borderColor: theme.border }]}>
                  <Animated.View style={[
                    styles.coin, 
                    { 
                      borderColor: theme.primary, 
                      backgroundColor: coinResult ? theme.surface : theme.background,
                      transform: [{ rotateY: spin }] 
                    }
                  ]}>
                    {coinResult ? (
                      <Text style={[styles.coinText, { color: theme.primary }]}>{coinResult}</Text>
                    ) : (
                      <Ionicons name="help" size={64} color={theme.border} />
                    )}
                  </Animated.View>
                </View>

                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.primary }]} onPress={flipCoin} disabled={isGenerating}>
                  <Ionicons name="disc" size={24} color={theme.background} />
                  <Text style={[styles.actionText, { color: theme.background }]}>Flip Coin</Text>
                </TouchableOpacity>
              </View>
            )}

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.l, paddingBottom: 80 },
  tabContainer: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    padding: 4,
    marginBottom: spacing.xl,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: spacing.m,
    borderRadius: 12,
    alignItems: 'center',
  },
  tabText: { fontSize: typography.sizes.m, fontWeight: typography.weights.bold },
  mainCard: {
    padding: spacing.xl,
    borderRadius: 24,
    borderWidth: 1,
    minHeight: 400,
  },
  section: {
    flex: 1,
    justifyContent: 'space-between',
  },
  label: { fontSize: typography.sizes.s, textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.xs },
  numberInputs: {
    flexDirection: 'row',
    gap: spacing.l,
    marginBottom: spacing.l,
  },
  inputGroup: { flex: 1 },
  input: {
    fontSize: typography.sizes.l,
    fontWeight: typography.weights.bold,
    padding: spacing.m,
    borderWidth: 1,
    borderRadius: 12,
    textAlign: 'center',
  },
  resultBox: {
    flex: 1,
    minHeight: 150,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    marginBottom: spacing.xl,
    borderStyle: 'dashed',
  },
  hugeText: {
    fontSize: 64,
    fontWeight: typography.weights.bold,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.s,
    padding: spacing.l,
    borderRadius: 16,
  },
  actionText: {
    fontSize: typography.sizes.l,
    fontWeight: typography.weights.bold,
  },
  diceCountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  diceCountBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  diceResultBox: {
    flex: 1,
    minHeight: 200,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    marginBottom: spacing.xl,
    padding: spacing.l,
  },
  diceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.m,
  },
  diceBox: {
    width: 60,
    height: 60,
    borderWidth: 2,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  diceText: {
    fontSize: 32,
    fontWeight: typography.weights.bold,
  },
  diceSum: {
    marginTop: spacing.xl,
    fontSize: typography.sizes.m,
    fontWeight: typography.weights.bold,
  },
  coinResultBox: {
    flex: 1,
    minHeight: 250,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  coin: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  coinText: {
    fontSize: 32,
    fontWeight: typography.weights.bold,
  },
});
