import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Platform, KeyboardAvoidingView } from 'react-native';
import * as Crypto from 'expo-crypto';
import * as FileSystem from 'expo-file-system/legacy';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { spacing, typography } from '../../theme';
import { shareFile, saveToDevice } from '../../utils/exportManager';

export default function HashGeneratorScreen() {
  const theme = useTheme();
  const [text, setText] = useState('');
  
  const [hashes, setHashes] = useState({
    MD5: '',
    'SHA-1': '',
    'SHA-256': '',
    'SHA-512': '',
  });

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    generateHashes(text);
  }, [text]);

  const generateHashes = async (input: string) => {
    if (!input) {
      setHashes({ MD5: '', 'SHA-1': '', 'SHA-256': '', 'SHA-512': '' });
      return;
    }

    try {
      const md5 = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.MD5, input);
      const sha1 = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA1, input);
      const sha256 = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, input);
      const sha512 = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA512, input);

      setHashes({
        MD5: md5,
        'SHA-1': sha1,
        'SHA-256': sha256,
        'SHA-512': sha512,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const copyToClipboard = async (hashName: string, hashValue: string) => {
    if (!hashValue) return;
    await Clipboard.setStringAsync(hashValue);
    setCopiedKey(hashName);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const exportHashes = async (action: 'share' | 'save') => {
    if (!text) {
      alert('Please enter some text to hash first.');
      return;
    }

    const content = `Original Text: ${text}\n\nMD5: ${hashes.MD5}\nSHA-1: ${hashes['SHA-1']}\nSHA-256: ${hashes['SHA-256']}\nSHA-512: ${hashes['SHA-512']}`;

    try {
      const filePath = FileSystem.cacheDirectory + 'hashes.txt';
      await FileSystem.writeAsStringAsync(filePath, content, {
        encoding: 'utf8',
      });
      
      if (action === 'share') {
        await shareFile(filePath, 'text/plain', 'Share Hashes');
      } else {
        await saveToDevice(filePath, `hashes_${Date.now()}.txt`, 'text/plain', 'Text Hash Generator');
      }
    } catch (e) {
      console.error(e);
      alert('Failed to export hashes.');
    }
  };

  return (
    <>
      <Stack.Screen options={{ 
        title: 'Hash Generator',
        headerStyle: { backgroundColor: theme.background },
        headerTintColor: theme.textPrimary,
        headerShadowVisible: false,
      }} />
      <KeyboardAvoidingView 
        style={[styles.container, { backgroundColor: theme.background }]} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView 
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          
          <Text style={[styles.label, { color: theme.textPrimary }]}>Enter Text</Text>
          <View style={[styles.inputContainer, { borderColor: theme.border, backgroundColor: theme.surface }]}>
            <TextInput
              style={[styles.input, { color: theme.textPrimary }]}
              placeholder="Type something to hash..."
              placeholderTextColor={theme.textSecondary}
              value={text}
              onChangeText={setText}
              autoCapitalize="none"
              autoCorrect={false}
              multiline
            />
            {text.length > 0 && (
              <TouchableOpacity onPress={() => setText('')} style={styles.clearBtn}>
                <Ionicons name="close-circle" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Generated Hashes</Text>
          
          {Object.entries(hashes).map(([name, val]) => (
            <View key={name} style={[styles.hashCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={styles.hashHeader}>
                <Text style={[styles.hashName, { color: theme.textPrimary }]}>{name}</Text>
                {val ? (
                  <TouchableOpacity onPress={() => copyToClipboard(name, val)} style={styles.copyBtn}>
                    <Ionicons name={copiedKey === name ? "checkmark" : "copy-outline"} size={20} color={copiedKey === name ? theme.primary : theme.textSecondary} />
                  </TouchableOpacity>
                ) : null}
              </View>
              <Text style={[styles.hashValue, { color: val ? theme.primary : theme.textSecondary }]} selectable>
                {val || '...'}
              </Text>
            </View>
          ))}

          {/* Export Actions */}
          <Text style={[styles.sectionTitle, { color: theme.textPrimary, marginTop: spacing.xl }]}>Export Options</Text>
          <View style={styles.actionRowGrid}>
            <TouchableOpacity 
              style={[styles.primaryActionBtn, { backgroundColor: theme.primary }, !text && { opacity: 0.5 }]}
              onPress={() => exportHashes('share')}
              disabled={!text}
            >
              <Ionicons name="share-outline" size={20} color={theme.background} />
              <Text style={{ color: theme.background, fontWeight: 'bold' }}>Share</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.primaryActionBtn, { backgroundColor: theme.primary }, !text && { opacity: 0.5 }]}
              onPress={() => exportHashes('save')}
              disabled={!text}
            >
              <Ionicons name="download-outline" size={20} color={theme.background} />
              <Text style={{ color: theme.background, fontWeight: 'bold' }}>Save as TXT</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.l,
    paddingBottom: 120,
  },
  label: {
    fontSize: typography.sizes.m,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.s,
  },
  inputContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: spacing.m,
    minHeight: 120,
    alignItems: 'flex-start',
    marginBottom: spacing.xl,
  },
  input: {
    flex: 1,
    fontSize: typography.sizes.m,
    paddingVertical: spacing.m,
    minHeight: 100,
  },
  clearBtn: {
    padding: spacing.m,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: typography.sizes.m,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.m,
  },
  hashCard: {
    padding: spacing.m,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: spacing.m,
  },
  hashHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  hashName: {
    fontSize: typography.sizes.s,
    fontWeight: typography.weights.bold,
    textTransform: 'uppercase',
  },
  hashValue: {
    fontSize: typography.sizes.s,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    lineHeight: 20,
  },
  copyBtn: {
    padding: spacing.xs,
  },
  actionRowGrid: {
    flexDirection: 'row',
    gap: spacing.m,
  },
  primaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.s,
    padding: spacing.m,
    borderRadius: 12,
  },
});
