import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import KeyboardAwareScrollView from '../../components/KeyboardAwareScrollView';
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import * as Speech from 'expo-speech';
import Slider from '@react-native-community/slider';
import { useTheme } from '../../hooks/useTheme';
import { spacing, typography } from '../../theme';

export default function TTSScreen() {
  const theme = useTheme();
  
  const [text, setText] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  
  const [rate, setRate] = useState(1.0);
  const [pitch, setPitch] = useState(1.0);

  useEffect(() => {
    return () => {
      // Clean up speech when leaving screen
      Speech.stop();
    };
  }, []);

  const handlePlay = async () => {
    if (!text.trim()) {
      alert('Please enter some text to read aloud.');
      return;
    }

    if (isPaused) {
      Speech.resume();
      setIsPaused(false);
      setIsSpeaking(true);
      return;
    }

    // Stop anything currently playing before starting fresh
    Speech.stop();

    Speech.speak(text, {
      rate: rate,
      pitch: pitch,
      onStart: () => {
        setIsSpeaking(true);
        setIsPaused(false);
      },
      onDone: () => {
        setIsSpeaking(false);
        setIsPaused(false);
      },
      onStopped: () => {
        setIsSpeaking(false);
        setIsPaused(false);
      },
      onError: (e) => {
        console.error(e);
        setIsSpeaking(false);
        setIsPaused(false);
      }
    });
  };

  const handlePause = async () => {
    const speaking = await Speech.isSpeakingAsync();
    if (speaking) {
      Speech.pause();
      setIsPaused(true);
      setIsSpeaking(false);
    }
  };

  const handleStop = () => {
    Speech.stop();
    setIsSpeaking(false);
    setIsPaused(false);
  };

  return (
    <>
      <Stack.Screen options={{ 
        title: 'Text-to-Speech',
        headerStyle: { backgroundColor: theme.background },
        headerTintColor: theme.textPrimary,
        headerShadowVisible: false,
      }} />
      <KeyboardAwareScrollView style={[styles.container, { backgroundColor: theme.background }]}>
          
          <View style={[styles.textCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <TextInput
              style={[styles.textArea, { color: theme.textPrimary }]}
              placeholder="Type or paste any text here to read aloud..."
              placeholderTextColor={theme.textSecondary}
              value={text}
              onChangeText={setText}
              multiline
              textAlignVertical="top"
            />

            {text.length > 0 && (
              <TouchableOpacity onPress={() => setText('')} style={styles.clearBtn}>
                <Ionicons name="close-circle" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          <View style={[styles.controlsCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            
            {/* Speed Slider */}
            <View style={styles.sliderGroup}>
              <View style={styles.sliderHeader}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>Speed</Text>
                <Text style={[styles.valueText, { color: theme.textPrimary }]}>{rate.toFixed(1)}x</Text>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={0.5}
                maximumValue={2.0}
                step={0.1}
                value={rate}
                onValueChange={setRate}
                minimumTrackTintColor={theme.primary}
                maximumTrackTintColor={theme.border}
                thumbTintColor={theme.primary}
              />
            </View>

            {/* Pitch Slider */}
            <View style={styles.sliderGroup}>
              <View style={styles.sliderHeader}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>Pitch</Text>
                <Text style={[styles.valueText, { color: theme.textPrimary }]}>{pitch.toFixed(1)}</Text>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={0.5}
                maximumValue={2.0}
                step={0.1}
                value={pitch}
                onValueChange={setPitch}
                minimumTrackTintColor={theme.primary}
                maximumTrackTintColor={theme.border}
                thumbTintColor={theme.primary}
              />
            </View>

            {/* Media Controls */}
            <View style={styles.mediaRow}>
              <TouchableOpacity 
                style={[styles.mediaBtn, { backgroundColor: theme.error }]} 
                onPress={handleStop}
                disabled={!isSpeaking && !isPaused}
              >
                <Ionicons name="stop" size={24} color={theme.background} />
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.playBtn, { backgroundColor: theme.primary }]} 
                onPress={isSpeaking ? handlePause : handlePlay}
              >
                <Ionicons name={isSpeaking ? "pause" : "play"} size={40} color={theme.background} />
              </TouchableOpacity>
            </View>

          </View>
      </KeyboardAwareScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.l, paddingBottom: 80 },
  textCard: {
    padding: spacing.m,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: spacing.xl,
    minHeight: 250,
  },
  textArea: {
    flex: 1,
    fontSize: typography.sizes.m,
    lineHeight: 24,
  },
  clearBtn: {
    position: 'absolute',
    top: spacing.m,
    right: spacing.m,
  },
  controlsCard: {
    padding: spacing.xl,
    borderRadius: 24,
    borderWidth: 1,
  },
  sliderGroup: {
    marginBottom: spacing.l,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  label: {
    fontSize: typography.sizes.s,
    textTransform: 'uppercase',
    fontWeight: typography.weights.bold,
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
  mediaRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xl,
    marginTop: spacing.m,
  },
  mediaBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
});
