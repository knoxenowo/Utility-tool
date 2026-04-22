import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Note {
  id: string;
  title: string;
  content: string;
  updatedAt: number;
}

interface NotesState {
  notes: Note[];
  addNote: (title: string, content: string) => Note;
  updateNote: (id: string, title: string, content: string) => void;
  deleteNote: (id: string) => void;
}

export const useNotesStore = create<NotesState>()(
  persist(
    (set) => ({
      notes: [],
      addNote: (title, content) => {
        const newNote = { id: Date.now().toString(), title, content, updatedAt: Date.now() };
        set((state) => ({
          notes: [newNote, ...state.notes]
        }));
        return newNote;
      },
      updateNote: (id, title, content) => set((state) => ({
        notes: state.notes.map(n => n.id === id ? { ...n, title, content, updatedAt: Date.now() } : n)
          .sort((a, b) => b.updatedAt - a.updatedAt) // push most recently updated to the top
      })),
      deleteNote: (id) => set((state) => ({
        notes: state.notes.filter(n => n.id !== id)
      })),
    }),
    {
      name: 'utility-hub-notes',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
