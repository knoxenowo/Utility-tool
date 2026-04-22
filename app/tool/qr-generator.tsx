import React, { useState, useRef } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import * as FileSystem from 'expo-file-system/legacy';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { spacing, typography } from '../../theme';
import { shareFile, saveToDevice } from '../../utils/exportManager';
import { Stack } from 'expo-router';

export default function QRGeneratorScreen() {
  const theme = useTheme();
  const [text, setText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  let qrRef = useRef<any>(null);

  const executeAction = async (action: 'share' | 'save') => {
    if (!qrRef.current) return;
    
    setIsProcessing(true);
    qrRef.current.toDataURL(async (data: string) => {
      try {
        const filePath = FileSystem.cacheDirectory + 'generated-qr.png';
        await FileSystem.writeAsStringAsync(filePath, data, {
          encoding: 'base64',
        });
        
        if (action === 'share') {
          await shareFile(filePath, 'image/png', 'Share QR Code');
        } else {
          await saveToDevice(filePath, `qr_code_${Date.now()}.png`, 'image/png', 'QR Generator');
        }
      } catch (e) {
        console.error(e);
        alert('Failed to export QR code.');
      } finally {
        setIsProcessing(false);
      }
    });
  };

  return (
    <>
      <Stack.Screen options={{ 
        title: 'QR Code Generator',
        headerStyle: { backgroundColor: theme.background },
        headerTintColor: theme.textPrimary,
        headerShadowVisible: false,
      }} />
      <KeyboardAvoidingView 
        style={[styles.container, { backgroundColor: theme.background }]} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          <Text style={[styles.label, { color: theme.textPrimary }]}>Enter Text or URL</Text>
          <View style={[styles.inputContainer, { borderColor: theme.border, backgroundColor: theme.surface }]}>
            <TextInput
              style={[styles.input, { color: theme.textPrimary }]}
              placeholder="https://example.com"
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

          <View style={[styles.previewContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            {text ? (
              <QRCode
                value={text}
                size={220}
                color={theme.textPrimary}
                backgroundColor={theme.surface}
                getRef={(c) => (qrRef.current = c)}
              />
            ) : (
              <View style={styles.placeholder}>
                <Ionicons name="qr-code-outline" size={64} color={theme.border} />
                <Text style={[styles.placeholderText, { color: theme.textSecondary }]}>
                  Preview will appear here
                </Text>
              </View>
            )}
          </View>

          <View style={styles.actionRowGrid}>
            <TouchableOpacity 
              style={[styles.primaryActionBtn, { backgroundColor: theme.primary }, (!text || isProcessing) && { opacity: 0.5 }]}
              onPress={() => executeAction('share')}
              disabled={!text || isProcessing}
            >
              <Ionicons name="share-outline" size={20} color={theme.background} />
              <Text style={{ color: theme.background, fontWeight: 'bold' }}>Share</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.primaryActionBtn, { backgroundColor: theme.primary }, (!text || isProcessing) && { opacity: 0.5 }]}
              onPress={() => executeAction('save')}
              disabled={!text || isProcessing}
            >
              <Ionicons name="download-outline" size={20} color={theme.background} />
              <Text style={{ color: theme.background, fontWeight: 'bold' }}>Save to Device</Text>
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
  scrollContent: {
    padding: spacing.l,
    paddingBottom: 40,
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
    minHeight: 60,
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  input: {
    flex: 1,
    fontSize: typography.sizes.m,
    paddingVertical: spacing.m,
  },
  clearBtn: {
    padding: spacing.s,
  },
  previewContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    borderRadius: 32,
    borderWidth: 1,
    minHeight: 320,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
  },
  placeholder: {
    alignItems: 'center',
  },
  placeholderText: {
    marginTop: spacing.m,
    fontSize: typography.sizes.m,
  },
  actionRowGrid: {
    flexDirection: 'row',
    gap: spacing.m,
    marginTop: spacing.xl,
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
