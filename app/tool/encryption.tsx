import 'react-native-get-random-values';
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import KeyboardAwareScrollView from '../../components/KeyboardAwareScrollView';
import AES from 'crypto-js/aes';
import Utf8 from 'crypto-js/enc-utf8';
import * as FileSystem from 'expo-file-system/legacy';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { spacing, typography } from '../../theme';
import { shareFile, saveToDevice } from '../../utils/exportManager';

export default function EncryptionScreen() {
  const theme = useTheme();
  
  const [mode, setMode] = useState<'encrypt' | 'decrypt'>('encrypt');
  const [plainText, setPlainText] = useState('');
  const [cipherText, setCipherText] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [result, setResult] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    processText();
  }, [plainText, cipherText, secretKey, mode]);

  const processText = () => {
    setError('');
    
    if (mode === 'encrypt') {
      if (!plainText || !secretKey) {
        setResult('');
        return;
      }
      try {
        const encrypted = AES.encrypt(plainText, secretKey).toString();
        setResult(encrypted);
      } catch (e: any) {
        setError(`Encryption failed: ${e.message}`);
        setResult('');
      }
    } else {
      if (!cipherText || !secretKey) {
        setResult('');
        return;
      }
      try {
        const decryptedBytes = AES.decrypt(cipherText, secretKey);
        const decryptedText = decryptedBytes.toString(Utf8);
        
        if (!decryptedText) {
          setError('Invalid key or corrupted encrypted text.');
          setResult('');
        } else {
          setResult(decryptedText);
        }
      } catch (e) {
        setError('Invalid input for decryption. Make sure it is valid AES ciphertext.');
        setResult('');
      }
    }
  };

  const copyToClipboard = async () => {
    if (!result) return;
    await Clipboard.setStringAsync(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const exportResult = async (action: 'share' | 'save') => {
    if (!result) {
      alert('There is no result to export.');
      return;
    }

    try {
      const filePath = FileSystem.cacheDirectory + (mode === 'encrypt' ? 'encrypted.txt' : 'decrypted.txt');
      await FileSystem.writeAsStringAsync(filePath, result, {
        encoding: 'utf8',
      });
      
      if (action === 'share') {
        await shareFile(filePath, 'text/plain', `Share ${mode === 'encrypt' ? 'Encrypted' : 'Decrypted'} Text`);
      } else {
        await saveToDevice(filePath, `${mode}_text_${Date.now()}.txt`, 'text/plain', 'Encryption Tool');
      }
    } catch (e) {
      console.error(e);
      alert('Failed to export text.');
    }
  };

  return (
    <>
      <Stack.Screen options={{ 
        title: 'AES Encryption',
        headerStyle: { backgroundColor: theme.background },
        headerTintColor: theme.textPrimary,
        headerShadowVisible: false,
      }} />
      <KeyboardAwareScrollView style={[styles.container, { backgroundColor: theme.background }]}>
          
          {/* Mode Switcher */}
          <View style={[styles.tabContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <TouchableOpacity
              style={[styles.tabBtn, mode === 'encrypt' && { backgroundColor: theme.primary }]}
              onPress={() => setMode('encrypt')}
            >
              <Text style={[styles.tabText, { color: mode === 'encrypt' ? theme.background : theme.textSecondary }]}>Encrypt</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, mode === 'decrypt' && { backgroundColor: theme.primary }]}
              onPress={() => setMode('decrypt')}
            >
              <Text style={[styles.tabText, { color: mode === 'decrypt' ? theme.background : theme.textSecondary }]}>Decrypt</Text>
            </TouchableOpacity>
          </View>

          {/* Inputs */}
          <Text style={[styles.label, { color: theme.textPrimary }]}>
            {mode === 'encrypt' ? 'Plain Text' : 'Encrypted Text'}
          </Text>
          <View style={[styles.inputContainer, { borderColor: theme.border, backgroundColor: theme.surface }]}>
            <TextInput
              style={[styles.textArea, { color: theme.textPrimary }]}
              placeholder={mode === 'encrypt' ? "Enter text to hide..." : "Enter cipher text starting with U2FsdGVkX1..."}
              placeholderTextColor={theme.textSecondary}
              value={mode === 'encrypt' ? plainText : cipherText}
              onChangeText={mode === 'encrypt' ? setPlainText : setCipherText}
              multiline
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <Text style={[styles.label, { color: theme.textPrimary }]}>Secret Key (Password)</Text>
          <View style={[styles.inputContainer, { borderColor: theme.border, backgroundColor: theme.surface }]}>
            <TextInput
              style={[styles.input, { color: theme.textPrimary }]}
              placeholder="Enter a strong password"
              placeholderTextColor={theme.textSecondary}
              value={secretKey}
              onChangeText={setSecretKey}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {/* Output */}
          <Text style={[styles.label, { color: theme.textPrimary, marginTop: spacing.m }]}>Result</Text>
          <View style={[styles.resultContainer, { borderColor: theme.border, backgroundColor: theme.surface }]}>
            {error ? (
              <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>
            ) : (
              <Text style={[styles.resultText, { color: result ? theme.textPrimary : theme.textSecondary }]} selectable>
                {result || 'Result will appear here automatically...'}
              </Text>
            )}
            
            {!!result && (
              <View style={styles.resultActions}>
                <TouchableOpacity onPress={copyToClipboard} style={styles.iconBtn}>
                  <Ionicons name={copied ? "checkmark" : "copy-outline"} size={24} color={copied ? theme.primary : theme.textSecondary} />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Export Actions */}
          <Text style={[styles.sectionTitle, { color: theme.textPrimary, marginTop: spacing.xl }]}>Export Options</Text>
          <View style={styles.actionRowGrid}>
            <TouchableOpacity 
              style={[styles.primaryActionBtn, { backgroundColor: theme.primary }, !result && { opacity: 0.5 }]}
              onPress={() => exportResult('share')}
              disabled={!result}
            >
              <Ionicons name="share-outline" size={20} color={theme.background} />
              <Text style={{ color: theme.background, fontWeight: 'bold' }}>Share</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.primaryActionBtn, { backgroundColor: theme.primary }, !result && { opacity: 0.5 }]}
              onPress={() => exportResult('save')}
              disabled={!result}
            >
              <Ionicons name="download-outline" size={20} color={theme.background} />
              <Text style={{ color: theme.background, fontWeight: 'bold' }}>Save as TXT</Text>
            </TouchableOpacity>
          </View>
      </KeyboardAwareScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.l,
    paddingBottom: 80,
  },
  tabContainer: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    padding: 4,
    marginBottom: spacing.xl,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: spacing.m,
    borderRadius: 12,
    alignItems: 'center',
  },
  tabText: {
    fontSize: typography.sizes.m,
    fontWeight: typography.weights.bold,
  },
  label: {
    fontSize: typography.sizes.m,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.s,
  },
  inputContainer: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: spacing.m,
    marginBottom: spacing.l,
  },
  textArea: {
    minHeight: 120,
    fontSize: typography.sizes.m,
    paddingVertical: spacing.m,
    textAlignVertical: 'top',
  },
  input: {
    height: 60,
    fontSize: typography.sizes.m,
  },
  resultContainer: {
    borderWidth: 1,
    borderRadius: 16,
    padding: spacing.xl,
    minHeight: 150,
    justifyContent: 'center',
    position: 'relative',
  },
  resultText: {
    fontSize: typography.sizes.m,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    lineHeight: 24,
  },
  errorText: {
    fontSize: typography.sizes.m,
    fontWeight: typography.weights.medium,
  },
  resultActions: {
    position: 'absolute',
    bottom: spacing.s,
    right: spacing.s,
  },
  iconBtn: {
    padding: spacing.m,
  },
  sectionTitle: {
    fontSize: typography.sizes.m,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.m,
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
