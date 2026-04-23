import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import KeyboardAwareScrollView from '../../components/KeyboardAwareScrollView';
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { spacing, typography } from '../../theme';
import { useTodoStore } from '../../store/useTodoStore';

type FilterType = 'All' | 'Active' | 'Completed';

export default function TodoListScreen() {
  const theme = useTheme();
  const { todos, addTodo, toggleTodo, deleteTodo, clearCompleted } = useTodoStore();
  const [inputText, setInputText] = useState('');
  const [filter, setFilter] = useState<FilterType>('All');

  const handleAdd = () => {
    if (inputText.trim()) {
      addTodo(inputText.trim());
      setInputText('');
    }
  };

  const filteredTodos = todos.filter(todo => {
    if (filter === 'Active') return !todo.completed;
    if (filter === 'Completed') return todo.completed;
    return true;
  });

  const activeCount = todos.filter(t => !t.completed).length;

  const renderTodo = ({ item }: { item: any }) => (
    <View style={[styles.todoItem, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <TouchableOpacity 
        style={styles.checkboxWrapper} 
        onPress={() => toggleTodo(item.id)}
      >
        <Ionicons 
          name={item.completed ? "checkmark-circle" : "ellipse-outline"} 
          size={28} 
          color={item.completed ? theme.primary : theme.textSecondary} 
        />
      </TouchableOpacity>
      
      <Text 
        style={[
          styles.todoText, 
          { color: item.completed ? theme.textSecondary : theme.textPrimary },
          item.completed && { textDecorationLine: 'line-through' }
        ]}
      >
        {item.text}
      </Text>

      <TouchableOpacity 
        style={styles.deleteBtn} 
        onPress={() => deleteTodo(item.id)}
      >
        <Ionicons name="trash-outline" size={20} color={theme.error} />
      </TouchableOpacity>
    </View>
  );

  return (
    <>
      <Stack.Screen options={{ 
        title: 'To-Do List',
        headerStyle: { backgroundColor: theme.background },
        headerTintColor: theme.textPrimary,
        headerShadowVisible: false,
      }} />
      <KeyboardAwareScrollView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.content}>
          
          <View style={[styles.inputContainer, { borderColor: theme.border, backgroundColor: theme.surface }]}>
            <TextInput
              style={[styles.input, { color: theme.textPrimary }]}
              placeholder="What needs to be done?"
              placeholderTextColor={theme.textSecondary}
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={handleAdd}
              returnKeyType="done"
            />
            <TouchableOpacity 
              style={[styles.addBtn, { backgroundColor: inputText.trim() ? theme.primary : theme.border }]} 
              onPress={handleAdd}
              disabled={!inputText.trim()}
            >
              <Ionicons name="add" size={24} color={theme.background} />
            </TouchableOpacity>
          </View>

          <View style={styles.filterRow}>
            {(['All', 'Active', 'Completed'] as FilterType[]).map(f => (
              <TouchableOpacity 
                key={f}
                style={[
                  styles.filterChip, 
                  { 
                    backgroundColor: filter === f ? theme.primary : theme.surface,
                    borderColor: filter === f ? theme.primary : theme.border
                  }
                ]}
                onPress={() => setFilter(f)}
              >
                <Text style={{ 
                  color: filter === f ? theme.background : theme.textPrimary,
                  fontWeight: filter === f ? 'bold' : 'normal'
                }}>
                  {f}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <FlatList
            data={filteredTodos}
            keyExtractor={item => item.id}
            renderItem={renderTodo}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="checkmark-done-circle-outline" size={64} color={theme.border} />
                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                  {filter === 'Completed' ? "No completed tasks yet." : "You're all caught up!"}
                </Text>
              </View>
            }
          />

          {todos.length > 0 && (
            <View style={[styles.footer, { borderTopColor: theme.border, backgroundColor: theme.surface }]}>
              <Text style={{ color: theme.textSecondary }}>{activeCount} item{activeCount !== 1 ? 's' : ''} left</Text>
              {todos.length - activeCount > 0 && (
                <TouchableOpacity onPress={clearCompleted}>
                  <Text style={{ color: theme.error }}>Clear completed</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

        </View>
      </KeyboardAwareScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, padding: spacing.m },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    marginBottom: spacing.m,
  },
  input: {
    flex: 1,
    fontSize: typography.sizes.m,
    padding: spacing.s,
    minHeight: 40,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterRow: {
    flexDirection: 'row',
    gap: spacing.s,
    marginBottom: spacing.m,
  },
  filterChip: {
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    borderRadius: 20,
    borderWidth: 1,
  },
  listContent: {
    paddingBottom: spacing.xl,
    flexGrow: 1,
  },
  todoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.m,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: spacing.s,
  },
  checkboxWrapper: {
    marginRight: spacing.m,
  },
  todoText: {
    flex: 1,
    fontSize: typography.sizes.m,
  },
  deleteBtn: {
    padding: spacing.xs,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: typography.sizes.m,
    marginTop: spacing.m,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.m,
    borderTopWidth: 1,
    marginTop: spacing.m,
    borderRadius: 16,
  },
});
