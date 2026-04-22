import React, { useState, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Animated, Platform, KeyboardAvoidingView, Easing, Vibration } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import Svg, { Path, G, Text as SvgText } from 'react-native-svg';
import { useTheme } from '../../hooks/useTheme';
import { spacing, typography } from '../../theme';

const COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FDCB6E', 
  '#6C5CE7', '#FF8ED4', '#A8E6CF', '#FFD3B6', 
  '#FFAAA5', '#1DD1A1'
];

function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
  const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians)
  };
}

function describeArc(x: number, y: number, radius: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  // For slices > 180 degrees, large arc flag must be 1. Otherwise 0.
  // Actually, wait, if there's only 1 option, we shouldn't use this function (we draw a full circle).
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
  
  return [
    "M", start.x, start.y, 
    "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y,
    "L", x, y,
    "Z"
  ].join(" ");
}

export default function DecisionWheelScreen() {
  const theme = useTheme();
  
  const [options, setOptions] = useState<string[]>(['Yes', 'No', 'Maybe', 'Try Again']);
  const [newOption, setNewOption] = useState('');
  const [winner, setWinner] = useState<string | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  
  const spinValue = useRef(new Animated.Value(0)).current;

  const addOption = () => {
    if (newOption.trim() && options.length < 20) {
      setOptions([...options, newOption.trim()]);
      setNewOption('');
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    } else {
      alert("You need at least 2 options to spin!");
    }
  };

  const spinWheel = () => {
    if (options.length < 2 || isSpinning) return;
    
    setIsSpinning(true);
    setWinner(null);
    Vibration.vibrate();

    // Reset rotation to 0 internally
    spinValue.setValue(0);
    
    // Pick a random winner
    const winningIndex = Math.floor(Math.random() * options.length);
    const sliceAngle = 360 / options.length;
    
    // The pointer is exactly at 0 degrees (the top).
    // The slice for `winningIndex` starts at `winningIndex * sliceAngle` and ends at `(winningIndex + 1) * sliceAngle`.
    // We want the *center* of this slice to land precisely at 0 degrees (or 360 degrees, which is the top).
    // The center angle of the winning slice on the original wheel is:
    const centerAngle = (winningIndex * sliceAngle) + (sliceAngle / 2);
    
    // To move `centerAngle` to the top (0 degrees), the wheel must rotate backwards by `centerAngle`.
    // Since we rotate clockwise (positive degrees), the target positive rotation to place it at the top is `360 - centerAngle`.
    const targetRotation = 360 - centerAngle;
    
    // Add multiple full spins (e.g., 5 full spins = 1800 degrees) to create suspense
    const totalRotation = 1800 + targetRotation;

    Animated.timing(spinValue, {
      toValue: totalRotation,
      duration: 3000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setIsSpinning(false);
      setWinner(options[winningIndex]);
      Vibration.vibrate([0, 50, 100, 50]);
    });
  };

  const spinRotation = spinValue.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg']
  });

  const renderWheel = () => {
    const size = 300;
    const center = size / 2;
    const sliceAngle = 360 / options.length;

    return (
      <View style={styles.wheelContainer}>
        {/* Pointer Triangle */}
        <View style={styles.pointerContainer}>
          <Ionicons name="caret-down" size={40} color={theme.textPrimary} style={styles.pointer} />
        </View>

        <Animated.View style={{ transform: [{ rotate: spinRotation }] }}>
          <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {options.map((opt, i) => {
              const startAngle = i * sliceAngle;
              const endAngle = (i + 1) * sliceAngle;
              
              // Text rotation
              const midAngle = startAngle + (sliceAngle / 2);
              
              return (
                <G key={i}>
                  <Path
                    d={describeArc(center, center, center, startAngle, endAngle)}
                    fill={COLORS[i % COLORS.length]}
                    stroke={theme.background}
                    strokeWidth="2"
                  />
                  {/* Position Text halfway from center to edge */}
                  <G transform={`translate(${center}, ${center}) rotate(${midAngle - 90}) translate(${center * 0.6}, 0)`}>
                     <SvgText
                        fill="#FFF"
                        fontSize="16"
                        fontWeight="bold"
                        textAnchor="middle"
                        alignmentBaseline="middle"
                     >
                       {opt.length > 10 ? opt.substring(0, 8) + '..' : opt}
                     </SvgText>
                  </G>
                </G>
              );
            })}
          </Svg>
        </Animated.View>
        
        {/* Center dot */}
        <View style={[styles.centerDot, { backgroundColor: theme.background }]} />
      </View>
    );
  };

  return (
    <>
      <Stack.Screen options={{ 
        title: 'Decision Wheel',
        headerStyle: { backgroundColor: theme.background },
        headerTintColor: theme.textPrimary,
        headerShadowVisible: false,
      }} />
      <KeyboardAvoidingView 
        style={[styles.container, { backgroundColor: theme.background }]} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 80}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          
          {renderWheel()}

          {winner && !isSpinning && (
            <View style={[styles.winnerBanner, { backgroundColor: theme.primary }]}>
              <Text style={[styles.winnerText, { color: theme.background }]}>🏆 {winner}</Text>
            </View>
          )}

          <TouchableOpacity 
            style={[styles.spinBtn, { backgroundColor: theme.primary }, isSpinning && { opacity: 0.5 }]} 
            onPress={spinWheel}
            disabled={isSpinning || options.length < 2}
          >
            <Text style={[styles.spinText, { color: theme.background }]}>{isSpinning ? 'SPINNING...' : 'SPIN THE WHEEL!'}</Text>
          </TouchableOpacity>

          <View style={[styles.optionsCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Options ({options.length}/20)</Text>
            
            <View style={styles.addInputRow}>
              <TextInput
                style={[styles.input, { color: theme.textPrimary, borderColor: theme.border }]}
                placeholder="Add a new option..."
                placeholderTextColor={theme.textSecondary}
                value={newOption}
                onChangeText={setNewOption}
                onSubmitEditing={addOption}
              />
              <TouchableOpacity style={[styles.addBtn, { backgroundColor: theme.primary }]} onPress={addOption}>
                <Ionicons name="add" size={24} color={theme.background} />
              </TouchableOpacity>
            </View>

            <View style={styles.optionsList}>
              {options.map((opt, idx) => (
                <View key={idx} style={[styles.optionTag, { backgroundColor: COLORS[idx % COLORS.length] + '40', borderColor: COLORS[idx % COLORS.length] }]}>
                  <Text style={[styles.optionTagText, { color: theme.textPrimary }]} numberOfLines={1}>{opt}</Text>
                  <TouchableOpacity onPress={() => removeOption(idx)} style={styles.removeBtn}>
                    <Ionicons name="close" size={16} color={theme.textPrimary} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.l, paddingBottom: 80 },
  wheelContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.xl,
    position: 'relative',
    height: 300,
  },
  pointerContainer: {
    position: 'absolute',
    top: -20,
    zIndex: 10,
    alignItems: 'center',
  },
  pointer: {
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  centerDot: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  winnerBanner: {
    padding: spacing.m,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.l,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  winnerText: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
  },
  spinBtn: {
    padding: spacing.xl,
    borderRadius: 24,
    alignItems: 'center',
    marginBottom: spacing.xl,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  spinText: {
    fontSize: typography.sizes.l,
    fontWeight: typography.weights.bold,
    letterSpacing: 2,
  },
  optionsCard: {
    padding: spacing.l,
    borderRadius: 24,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: typography.sizes.m,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.m,
  },
  addInputRow: {
    flexDirection: 'row',
    gap: spacing.m,
    marginBottom: spacing.l,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.m,
    fontSize: typography.sizes.m,
  },
  addBtn: {
    width: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.s,
  },
  optionTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.s,
    borderRadius: 16,
    borderWidth: 1,
    maxWidth: '100%',
  },
  optionTagText: {
    fontSize: typography.sizes.s,
    fontWeight: typography.weights.medium,
    marginRight: spacing.xs,
  },
  removeBtn: {
    padding: 4,
  },
});
