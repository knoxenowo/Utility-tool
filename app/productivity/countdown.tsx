import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Platform, KeyboardAvoidingView, Vibration, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { createAudioPlayer, setAudioModeAsync, AudioPlayer } from 'expo-audio';
import { useTheme } from '../../hooks/useTheme';
import { spacing, typography } from '../../theme';

export default function CountdownScreen() {
  const theme = useTheme();
  
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');
  const [seconds, setSeconds] = useState('');
  
  const [timeLeft, setTimeLeft] = useState(0); // in seconds
  const [isRunning, setIsRunning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const soundRef = useRef<AudioPlayer | null>(null);

  useEffect(() => {
    // Setup audio session for iOS to play even if physical silent switch is flipped
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
    }).catch(console.error);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (soundRef.current) {
        soundRef.current.remove();
      }
    };
  }, []);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      timerRef.current = setTimeout(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (isRunning && timeLeft === 0) {
      handleTimerComplete();
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isRunning, timeLeft]);

  const handleTimerComplete = async () => {
    setIsRunning(false);
    
    // Vibrate intensely
    Vibration.vibrate([1000, 1000, 1000]);
    
    try {
      // Stream an alarm beep
      const player = createAudioPlayer('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
      player.loop = true;
      player.play();
      soundRef.current = player;
      
      Alert.alert('Time is up!', 'Your countdown has finished.', [
        { 
          text: 'Stop Alarm', 
          onPress: () => {
            if (soundRef.current) {
              soundRef.current.pause();
              soundRef.current.remove();
              soundRef.current = null;
            }
            Vibration.cancel();
          } 
        }
      ]);
    } catch (err) {
      console.error('Failed to load sound', err);
      // Fallback if no internet or audio fails
      Alert.alert('Time is up!', 'Your countdown has finished.');
    }
  };

  const startTimer = () => {
    if (isRunning) return;
    if (timeLeft === 0) {
      const h = parseInt(hours) || 0;
      const m = parseInt(minutes) || 0;
      const s = parseInt(seconds) || 0;
      const totalSeconds = h * 3600 + m * 60 + s;
      if (totalSeconds <= 0) return;
      setTimeLeft(totalSeconds);
    }
    setIsRunning(true);
  };

  const pauseTimer = () => {
    setIsRunning(false);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(0);
    setHours('');
    setMinutes('');
    setSeconds('');
    if (soundRef.current) {
      soundRef.current.pause();
      soundRef.current.remove();
      soundRef.current = null;
    }
    Vibration.cancel();
  };

  const formatTime = (totalSecs: number) => {
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <Stack.Screen options={{ 
        title: 'Countdown Timer',
        headerStyle: { backgroundColor: theme.background },
        headerTintColor: theme.textPrimary,
        headerShadowVisible: false,
      }} />
      <KeyboardAvoidingView 
        style={[styles.container, { backgroundColor: theme.background }]} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          
          <View style={[styles.timerCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            
            <View style={[styles.displayBox, { borderColor: theme.border }]}>
              <Text 
                style={[styles.timeText, { color: theme.primary }]}
                numberOfLines={1}
                adjustsFontSizeToFit={true}
              >
                {timeLeft > 0 ? formatTime(timeLeft) : '00:00:00'}
              </Text>
            </View>

            {timeLeft === 0 && !isRunning && (
              <View style={styles.inputRow}>
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: theme.textSecondary }]}>Hours</Text>
                  <TextInput
                    style={[styles.input, { color: theme.textPrimary, borderColor: theme.border, backgroundColor: theme.background }]}
                    value={hours}
                    onChangeText={setHours}
                    keyboardType="numeric"
                    maxLength={2}
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: theme.textSecondary }]}>Minutes</Text>
                  <TextInput
                    style={[styles.input, { color: theme.textPrimary, borderColor: theme.border, backgroundColor: theme.background }]}
                    value={minutes}
                    onChangeText={setMinutes}
                    keyboardType="numeric"
                    maxLength={2}
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: theme.textSecondary }]}>Seconds</Text>
                  <TextInput
                    style={[styles.input, { color: theme.textPrimary, borderColor: theme.border, backgroundColor: theme.background }]}
                    value={seconds}
                    onChangeText={setSeconds}
                    keyboardType="numeric"
                    maxLength={2}
                  />
                </View>
              </View>
            )}

            <View style={styles.actionRow}>
              {isRunning ? (
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.error }]} onPress={pauseTimer}>
                  <Ionicons name="pause" size={24} color={theme.background} />
                  <Text style={[styles.actionText, { color: theme.background }]}>Pause</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.primary }]} onPress={startTimer}>
                  <Ionicons name="play" size={24} color={theme.background} />
                  <Text style={[styles.actionText, { color: theme.background }]}>
                    {timeLeft > 0 ? 'Resume' : 'Start'}
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity style={[styles.resetBtn, { borderColor: theme.border }]} onPress={resetTimer}>
                <Ionicons name="refresh" size={24} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.l, paddingBottom: 80, justifyContent: 'center' },
  timerCard: {
    padding: spacing.xl,
    borderRadius: 24,
    borderWidth: 1,
    marginTop: spacing.xl,
  },
  displayBox: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderRadius: 20,
    borderStyle: 'dashed',
    marginBottom: spacing.xl,
  },
  timeText: {
    fontSize: 64,
    fontWeight: typography.weights.bold,
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    gap: spacing.m,
    marginBottom: spacing.xl,
  },
  inputGroup: {
    flex: 1,
    alignItems: 'center',
  },
  label: {
    fontSize: typography.sizes.s,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  input: {
    width: '100%',
    fontSize: typography.sizes.l,
    fontWeight: typography.weights.bold,
    textAlign: 'center',
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.m,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.m,
  },
  actionBtn: {
    flex: 1,
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
  resetBtn: {
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 16,
  },
});
