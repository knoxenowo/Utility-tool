import React from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import KeyboardAwareScrollView from '../../components/KeyboardAwareScrollView';
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { spacing, typography } from '../../theme';
import { usePlannerStore, DEFAULT_HOURS } from '../../store/usePlannerStore';

export default function DailyPlannerScreen() {
  const theme = useTheme();
  const { schedule, updateSlot, clearAll } = usePlannerStore();

  const confirmClear = () => {
    Alert.alert('Clear Planner', 'Are you sure you want to clear your entire schedule?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: clearAll }
    ]);
  };

  return (
    <>
      <Stack.Screen options={{ 
        title: 'Daily Planner',
        headerStyle: { backgroundColor: theme.background },
        headerTintColor: theme.textPrimary,
        headerShadowVisible: false,
        headerRight: () => (
          <TouchableOpacity onPress={confirmClear} style={styles.clearBtn}>
            <Ionicons name="trash-outline" size={24} color={theme.error} />
          </TouchableOpacity>
        )
      }} />
      <KeyboardAwareScrollView style={[styles.container, { backgroundColor: theme.background }]}>
          
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={[styles.header, { borderBottomColor: theme.border }]}>
              <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Today's Schedule</Text>
              <Text style={[styles.headerSub, { color: theme.textSecondary }]}>
                {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
              </Text>
            </View>

            {DEFAULT_HOURS.map((time, index) => {
              // highlight the current active hour dynamically
              const isCurrentHour = new Date().getHours() === index;

              return (
                <View key={time} style={[
                  styles.slotRow, 
                  { borderBottomColor: theme.border },
                  isCurrentHour && { backgroundColor: theme.primary + '15' } // 15 adds a slight transparent tint
                ]}>
                  <View style={styles.timeWrapper}>
                    <Text style={[
                      styles.timeText, 
                      { color: isCurrentHour ? theme.primary : theme.textSecondary },
                      isCurrentHour && { fontWeight: 'bold' }
                    ]}>
                      {time}
                    </Text>
                  </View>
                  <TextInput
                    style={[styles.input, { color: theme.textPrimary }]}
                    placeholder="Plan this hour..."
                    placeholderTextColor={theme.border}
                    value={schedule[time] || ''}
                    onChangeText={(text) => updateSlot(time, text)}
                    multiline
                    returnKeyType="done"
                    blurOnSubmit
                  />
                </View>
              );
            })}
          </View>
      </KeyboardAwareScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.l, paddingBottom: 80 },
  clearBtn: { padding: spacing.xs },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    padding: spacing.l,
    borderBottomWidth: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: typography.sizes.l,
    fontWeight: typography.weights.bold,
  },
  headerSub: {
    fontSize: typography.sizes.s,
    marginTop: spacing.xs,
  },
  slotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: 60,
  },
  timeWrapper: {
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.m,
  },
  timeText: {
    fontSize: typography.sizes.s,
  },
  input: {
    flex: 1,
    fontSize: typography.sizes.m,
    paddingVertical: spacing.m,
    paddingRight: spacing.m,
    minHeight: 60,
  },
});
