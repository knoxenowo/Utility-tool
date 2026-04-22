import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 24 hour slots
export const DEFAULT_HOURS = Array.from({ length: 24 }, (_, i) => {
  const ampm = i >= 12 ? 'PM' : 'AM';
  const hour = i % 12 === 0 ? 12 : i % 12;
  return `${hour}:00 ${ampm}`;
});

interface PlannerState {
  schedule: Record<string, string>; // Maps "08:00 AM" to "Workout"
  updateSlot: (time: string, task: string) => void;
  clearAll: () => void;
}

export const usePlannerStore = create<PlannerState>()(
  persist(
    (set) => ({
      schedule: {},
      updateSlot: (time, task) => set((state) => ({
        schedule: { ...state.schedule, [time]: task }
      })),
      clearAll: () => set({ schedule: {} }),
    }),
    {
      name: 'utility-hub-planner',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
