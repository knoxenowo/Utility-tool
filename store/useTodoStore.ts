import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
}

interface TodoState {
  todos: TodoItem[];
  addTodo: (text: string) => void;
  toggleTodo: (id: string) => void;
  deleteTodo: (id: string) => void;
  clearCompleted: () => void;
}

export const useTodoStore = create<TodoState>()(
  persist(
    (set) => ({
      todos: [],
      addTodo: (text: string) => set((state) => ({
        todos: [
          { id: Date.now().toString(), text, completed: false, createdAt: Date.now() },
          ...state.todos,
        ],
      })),
      toggleTodo: (id: string) => set((state) => ({
        todos: state.todos.map((todo) =>
          todo.id === id ? { ...todo, completed: !todo.completed } : todo
        ),
      })),
      deleteTodo: (id: string) => set((state) => ({
        todos: state.todos.filter((todo) => todo.id !== id),
      })),
      clearCompleted: () => set((state) => ({
        todos: state.todos.filter((todo) => !todo.completed),
      })),
    }),
    {
      name: 'utility-hub-todos',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
