import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, Alert, BackHandler } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { spacing, typography } from '../../theme';
import { useNotesStore, Note } from '../../store/useNotesStore';

export default function NotesScreen() {
  const theme = useTheme();
  const { notes, addNote, updateNote, deleteNote } = useNotesStore();
  
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  // Handle Android hardware back button
  useEffect(() => {
    const backAction = () => {
      if (activeNoteId) {
        closeNote();
        return true; // prevent default back
      }
      return false; // let default back happen
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [activeNoteId, editTitle, editContent]);

  const openNote = (note: Note) => {
    setActiveNoteId(note.id);
    setEditTitle(note.title);
    setEditContent(note.content);
  };

  const createNewNote = () => {
    const newNote = addNote('', '');
    openNote(newNote);
  };

  const closeNote = () => {
    if (activeNoteId) {
      // Auto-save on close
      // If totally empty, maybe delete it to prevent ghost notes
      if (!editTitle.trim() && !editContent.trim()) {
        deleteNote(activeNoteId);
      } else {
        updateNote(activeNoteId, editTitle, editContent);
      }
    }
    setActiveNoteId(null);
  };

  const confirmDelete = (id: string) => {
    Alert.alert('Delete Note', 'Are you sure you want to delete this note?', [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Delete', 
        style: 'destructive', 
        onPress: () => {
          deleteNote(id);
          if (activeNoteId === id) setActiveNoteId(null);
        }
      }
    ]);
  };

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // ----------------------------------------------------
  // LIST VIEW
  // ----------------------------------------------------
  if (!activeNoteId) {
    return (
      <>
        <Stack.Screen options={{ 
          title: 'Notes',
          headerStyle: { backgroundColor: theme.background },
          headerTintColor: theme.textPrimary,
          headerShadowVisible: false,
          headerLeft: undefined // normal back to dashboard
        }} />
        <View style={[styles.container, { backgroundColor: theme.background }]}>
          <FlatList
            data={notes}
            keyExtractor={n => n.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={[styles.noteCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
                onPress={() => openNote(item)}
              >
                <View style={styles.noteCardHeader}>
                  <Text style={[styles.noteCardTitle, { color: theme.textPrimary }]} numberOfLines={1}>
                    {item.title || 'Untitled Note'}
                  </Text>
                  <TouchableOpacity onPress={() => confirmDelete(item.id)} style={styles.cardDeleteBtn}>
                    <Ionicons name="trash-outline" size={20} color={theme.textSecondary} />
                  </TouchableOpacity>
                </View>
                <Text style={[styles.noteCardContent, { color: theme.textSecondary }]} numberOfLines={2}>
                  {item.content || 'No content...'}
                </Text>
                <Text style={[styles.noteCardDate, { color: theme.border }]}>
                  {formatDate(item.updatedAt)}
                </Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="document-text-outline" size={64} color={theme.border} />
                <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No notes yet.</Text>
              </View>
            }
          />

          <TouchableOpacity style={[styles.fab, { backgroundColor: theme.primary }]} onPress={createNewNote}>
            <Ionicons name="add" size={32} color={theme.background} />
          </TouchableOpacity>
        </View>
      </>
    );
  }

  // ----------------------------------------------------
  // EDITOR VIEW
  // ----------------------------------------------------
  return (
    <>
      <Stack.Screen options={{ 
        title: 'Edit Note',
        headerStyle: { backgroundColor: theme.background },
        headerTintColor: theme.textPrimary,
        headerShadowVisible: false,
        headerLeft: () => (
          <TouchableOpacity onPress={closeNote} style={styles.headerBtn}>
            <Ionicons name="chevron-back" size={28} color={theme.primary} />
            <Text style={{ color: theme.primary, fontSize: 16 }}>Notes</Text>
          </TouchableOpacity>
        ),
        headerRight: () => (
          <TouchableOpacity onPress={() => confirmDelete(activeNoteId)} style={styles.headerBtn}>
            <Ionicons name="trash-outline" size={24} color={theme.error} />
          </TouchableOpacity>
        )
      }} />
      <KeyboardAvoidingView 
        style={[styles.container, { backgroundColor: theme.background }]} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.editorContent}>
          <TextInput
            style={[styles.editorTitle, { color: theme.textPrimary }]}
            placeholder="Note Title"
            placeholderTextColor={theme.textSecondary}
            value={editTitle}
            onChangeText={setEditTitle}
          />
          <TextInput
            style={[styles.editorBody, { color: theme.textPrimary }]}
            placeholder="Start typing..."
            placeholderTextColor={theme.border}
            value={editContent}
            onChangeText={setEditContent}
            multiline
            textAlignVertical="top"
            autoFocus={!editTitle && !editContent}
          />
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: {
    padding: spacing.m,
    paddingBottom: 100,
  },
  noteCard: {
    padding: spacing.l,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: spacing.m,
  },
  noteCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  noteCardTitle: {
    flex: 1,
    fontSize: typography.sizes.m,
    fontWeight: typography.weights.bold,
    marginRight: spacing.m,
  },
  cardDeleteBtn: {
    padding: 2,
  },
  noteCardContent: {
    fontSize: typography.sizes.s,
    lineHeight: 20,
    marginBottom: spacing.m,
  },
  noteCardDate: {
    fontSize: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: typography.sizes.m,
    marginTop: spacing.m,
  },
  fab: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.xl,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  headerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.xs,
  },
  editorContent: {
    flex: 1,
    padding: spacing.l,
  },
  editorTitle: {
    fontSize: 28,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.l,
  },
  editorBody: {
    flex: 1,
    fontSize: typography.sizes.m,
    lineHeight: 24,
  },
});
