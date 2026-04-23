import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Platform, ActivityIndicator, Alert } from 'react-native';
import KeyboardAwareScrollView from '../../components/KeyboardAwareScrollView';
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { StorageAccessFramework } from 'expo-file-system/legacy';
import * as FileSystem from 'expo-file-system/legacy';
import { useTheme } from '../../hooks/useTheme';
import { spacing, typography } from '../../theme';

interface SelectedFile {
  uri: string;
  originalName: string;
  extension: string;
  mimeType: string;
  newName: string;
}

export default function BatchRenamerScreen() {
  const theme = useTheme();
  
  const [files, setFiles] = useState<SelectedFile[]>([]);
  const [prefix, setPrefix] = useState('');
  const [suffix, setSuffix] = useState('');
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [startNumber, setStartNumber] = useState('');
  const [keepOriginalName, setKeepOriginalName] = useState(true);
  
  const [isProcessing, setIsProcessing] = useState(false);

  // Auto-generate new names when rules change
  useEffect(() => {
    setFiles(prevFiles => prevFiles.map((file, index) => {
      let baseName = keepOriginalName ? file.originalName.replace(file.extension, '') : '';
      
      // 1. Find and Replace
      if (findText && keepOriginalName) {
        // Global replace
        baseName = baseName.split(findText).join(replaceText);
      }
      
      // 2. Prefix & Suffix
      let newBase = `${prefix}${baseName}${suffix}`;
      
      // 3. Numbering
      if (startNumber !== '') {
        const num = parseInt(startNumber) || 1;
        const currentNum = (num + index).toString().padStart(3, '0'); // Pad with zeros (e.g. 001)
        newBase = `${newBase}_${currentNum}`;
      }
      
      // Prevent entirely empty names
      if (!newBase.trim()) newBase = `file_${index + 1}`;

      return {
        ...file,
        newName: `${newBase}${file.extension}`
      };
    }));
  }, [prefix, suffix, findText, replaceText, startNumber, keepOriginalName]);

  const pickFiles = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        multiple: true,
        copyToCacheDirectory: true, // We need a stable uri to read from
      });

      if (!result.canceled && result.assets) {
        const newFiles = result.assets.map(asset => {
          // Extract extension safely
          const lastDot = asset.name.lastIndexOf('.');
          const ext = lastDot !== -1 ? asset.name.substring(lastDot) : '';
          
          return {
            uri: asset.uri,
            originalName: asset.name,
            extension: ext,
            mimeType: asset.mimeType || 'application/octet-stream',
            newName: asset.name, // will be updated by useEffect immediately
          };
        });
        
        setFiles(prev => [...prev, ...newFiles]);
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to pick files.');
    }
  };

  const removeFile = (indexToRemove: number) => {
    setFiles(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const exportFiles = async () => {
    if (files.length === 0) return;
    
    if (Platform.OS !== 'android') {
      Alert.alert('Unsupported', 'Batch directory export is currently only supported on Android.');
      return;
    }

    setIsProcessing(true);

    try {
      // 1. Ask user to pick a destination folder
      const permissions = await StorageAccessFramework.requestDirectoryPermissionsAsync();
      
      if (!permissions.granted) {
        Alert.alert('Permission Denied', 'We need access to a folder to save the renamed files.');
        setIsProcessing(false);
        return;
      }

      const dirUri = permissions.directoryUri;
      let successCount = 0;

      // 2. Loop through and save each file
      for (const file of files) {
        try {
          // Read original file as base64
          const base64Data = await FileSystem.readAsStringAsync(file.uri, {
            encoding: 'base64',
          });

          // Create new file in the chosen directory with the new name
          const newFileUri = await StorageAccessFramework.createFileAsync(
            dirUri,
            file.newName,
            file.mimeType
          );

          // Write data to the new file
          await FileSystem.writeAsStringAsync(newFileUri, base64Data, {
            encoding: 'base64',
          });
          
          successCount++;
        } catch (fileErr) {
          console.error(`Failed to export ${file.originalName}`, fileErr);
        }
      }

      Alert.alert('Success', `Successfully renamed and exported ${successCount} out of ${files.length} files.`);
      
    } catch (err: any) {
      console.error('Export Error:', err);
      Alert.alert('Export Failed', err.message || 'An error occurred while saving files.');
    } finally {
      setIsProcessing(false);
    }
  };

  const clearAll = () => {
    setFiles([]);
    setPrefix('');
    setSuffix('');
    setFindText('');
    setReplaceText('');
    setStartNumber('');
  };

  return (
    <>
      <Stack.Screen options={{ 
        title: 'Batch Renamer',
        headerStyle: { backgroundColor: theme.background },
        headerTintColor: theme.textPrimary,
        headerShadowVisible: false,
        headerRight: () => files.length > 0 ? (
          <TouchableOpacity onPress={clearAll} style={{ padding: spacing.xs }}>
            <Ionicons name="trash-outline" size={24} color={theme.error} />
          </TouchableOpacity>
        ) : null
      }} />
      <KeyboardAwareScrollView style={[styles.container, { backgroundColor: theme.background }]}>
          
          {/* Rules Card */}
          <View style={[styles.rulesCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary, marginBottom: spacing.m }]}>Renaming Rules</Text>
            
            <TouchableOpacity 
              style={[styles.toggleBtn, { borderColor: theme.border }]} 
              onPress={() => setKeepOriginalName(!keepOriginalName)}
            >
              <Ionicons 
                name={keepOriginalName ? "checkbox" : "square-outline"} 
                size={24} 
                color={keepOriginalName ? theme.primary : theme.textSecondary} 
              />
              <Text style={[styles.toggleText, { color: theme.textPrimary }]}>
                Keep Original File Name
              </Text>
            </TouchableOpacity>

            <View style={styles.rowGrid}>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>Add Prefix</Text>
                <TextInput
                  style={[styles.input, { color: theme.textPrimary, borderColor: theme.border }]}
                  placeholder="e.g. IMG_"
                  placeholderTextColor={theme.textSecondary}
                  value={prefix}
                  onChangeText={setPrefix}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>Add Suffix</Text>
                <TextInput
                  style={[styles.input, { color: theme.textPrimary, borderColor: theme.border }]}
                  placeholder="e.g. _Edited"
                  placeholderTextColor={theme.textSecondary}
                  value={suffix}
                  onChangeText={setSuffix}
                />
              </View>
            </View>

            <View style={styles.rowGrid}>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>Find Text</Text>
                <TextInput
                  style={[styles.input, { color: theme.textPrimary, borderColor: theme.border }]}
                  placeholder="e.g. Copy"
                  placeholderTextColor={theme.textSecondary}
                  value={findText}
                  onChangeText={setFindText}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>Replace With</Text>
                <TextInput
                  style={[styles.input, { color: theme.textPrimary, borderColor: theme.border }]}
                  placeholder="Leave empty to delete"
                  placeholderTextColor={theme.textSecondary}
                  value={replaceText}
                  onChangeText={setReplaceText}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.textSecondary }]}>Append Sequential Number (Start At)</Text>
              <TextInput
                style={[styles.input, { color: theme.textPrimary, borderColor: theme.border }]}
                placeholder="e.g. 1"
                placeholderTextColor={theme.textSecondary}
                value={startNumber}
                onChangeText={setStartNumber}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Action Area */}
          <TouchableOpacity 
            style={[styles.pickerBtn, { borderColor: theme.primary, backgroundColor: theme.surface }]} 
            onPress={pickFiles}
            disabled={isProcessing}
          >
            <Ionicons name="documents-outline" size={32} color={theme.primary} />
            <Text style={[styles.pickerText, { color: theme.primary }]}>Select Files to Rename</Text>
          </TouchableOpacity>

          {/* File List */}
          {files.length > 0 && (
            <View style={[styles.listCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.listHeader, { color: theme.textPrimary }]}>Preview ({files.length} Files)</Text>
              
              {files.map((file, index) => (
                <View key={`${file.uri}-${index}`} style={[styles.fileRow, { borderTopColor: theme.border }, index === 0 && { borderTopWidth: 0 }]}>
                  <View style={styles.fileInfo}>
                    <Text style={[styles.oldName, { color: theme.textSecondary }]} numberOfLines={1}>
                      {file.originalName}
                    </Text>
                    <Text style={[styles.newName, { color: theme.primary }]} numberOfLines={1}>
                      ➔ {file.newName}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => removeFile(index)} style={styles.removeBtn}>
                    <Ionicons name="close-circle" size={24} color={theme.textSecondary} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* Export Button */}
          {files.length > 0 && (
            <TouchableOpacity 
              style={[styles.exportBtn, { backgroundColor: theme.primary }, isProcessing && { opacity: 0.7 }]}
              onPress={exportFiles}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator color={theme.background} />
              ) : (
                <>
                  <Ionicons name="folder-open-outline" size={24} color={theme.background} />
                  <Text style={[styles.exportText, { color: theme.background }]}>Export to Folder</Text>
                </>
              )}
            </TouchableOpacity>
          )}
      </KeyboardAwareScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.l, paddingBottom: 100 },
  rulesCard: {
    padding: spacing.l,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.sizes.m,
    fontWeight: typography.weights.bold,
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    marginBottom: spacing.l,
    paddingBottom: spacing.m,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  toggleText: {
    fontSize: typography.sizes.m,
    fontWeight: typography.weights.medium,
  },
  rowGrid: {
    flexDirection: 'row',
    gap: spacing.m,
    marginBottom: spacing.m,
  },
  inputGroup: {
    flex: 1,
    marginBottom: spacing.xs,
  },
  label: {
    fontSize: typography.sizes.s,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
    fontWeight: typography.weights.medium,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.m,
    fontSize: typography.sizes.m,
  },
  pickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.s,
    padding: spacing.xl,
    borderRadius: 24,
    borderWidth: 2,
    borderStyle: 'dashed',
    marginBottom: spacing.xl,
  },
  pickerText: {
    fontSize: typography.sizes.m,
    fontWeight: typography.weights.bold,
  },
  listCard: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: spacing.xl,
  },
  listHeader: {
    padding: spacing.l,
    fontSize: typography.sizes.m,
    fontWeight: typography.weights.bold,
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.m,
    paddingHorizontal: spacing.l,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  fileInfo: {
    flex: 1,
  },
  oldName: {
    fontSize: typography.sizes.s,
    textDecorationLine: 'line-through',
    marginBottom: 4,
  },
  newName: {
    fontSize: typography.sizes.m,
    fontWeight: typography.weights.bold,
  },
  removeBtn: {
    paddingLeft: spacing.m,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.s,
    padding: spacing.l,
    borderRadius: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  exportText: {
    fontSize: typography.sizes.l,
    fontWeight: typography.weights.bold,
  },
});
