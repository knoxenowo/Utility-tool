import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Platform, KeyboardAvoidingView, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Clipboard from 'expo-clipboard';
import { useTheme } from '../../hooks/useTheme';
import { spacing, typography } from '../../theme';
import { shareFile, saveToDevice } from '../../utils/exportManager';
import * as FileSystem from 'expo-file-system/legacy';

export default function OCRScreen() {
  const theme = useTheme();
  
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, // crucial for OCR so user can crop exactly what they want
      quality: 0.8,
      base64: true, // We need base64 for the API
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      processOCR(result.assets[0].base64);
    }
  };

  const processOCR = async (base64String?: string | null) => {
    if (!base64String) {
      alert('Failed to get image data.');
      return;
    }

    setIsProcessing(true);
    setExtractedText('');

    try {
      const formData = new FormData();
      // OCR.space expects base64 image strings to be prefixed
      formData.append('base64Image', `data:image/jpeg;base64,${base64String}`);
      formData.append('language', 'eng');
      formData.append('OCREngine', '2'); // Engine 2 is usually better for general receipts and standard text

      const response = await fetch('https://api.ocr.space/parse/image', {
        method: 'POST',
        headers: {
          'apikey': 'helloworld', // Free public test key
        },
        body: formData,
      });

      const data = await response.json();
      
      if (data.IsErroredOnProcessing) {
        alert(data.ErrorMessage?.[0] || 'OCR Processing failed');
      } else if (data.ParsedResults && data.ParsedResults.length > 0) {
        setExtractedText(data.ParsedResults[0].ParsedText);
      } else {
        alert('No text could be found in this image.');
      }
    } catch (err) {
      console.error('OCR Error:', err);
      alert('Network error. Ensure you are connected to the internet.');
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = async () => {
    if (!extractedText) return;
    await Clipboard.setStringAsync(extractedText);
    alert('Copied to clipboard!');
  };

  const exportResult = async (action: 'share' | 'save') => {
    if (!extractedText) {
      alert('There is no text to export.');
      return;
    }

    try {
      const filePath = FileSystem.cacheDirectory + 'ocr_result.txt';
      await FileSystem.writeAsStringAsync(filePath, extractedText, {
        encoding: 'utf8',
      });
      
      if (action === 'share') {
        await shareFile(filePath, 'text/plain', `Share Extracted Text`);
      } else {
        await saveToDevice(filePath, `extracted_text_${Date.now()}.txt`, 'text/plain', 'OCR');
      }
    } catch (e) {
      console.error(e);
      alert('Failed to export text.');
    }
  };

  return (
    <>
      <Stack.Screen options={{ 
        title: 'OCR (Image to Text)',
        headerStyle: { backgroundColor: theme.background },
        headerTintColor: theme.textPrimary,
        headerShadowVisible: false,
      }} />
      <KeyboardAvoidingView 
        style={[styles.container, { backgroundColor: theme.background }]} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          
          {/* Image Picker Area */}
          <TouchableOpacity 
            style={[styles.imagePicker, { borderColor: theme.border, backgroundColor: theme.surface }]} 
            onPress={pickImage}
            disabled={isProcessing}
          >
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="contain" />
            ) : (
              <View style={styles.placeholder}>
                <Ionicons name="scan-outline" size={64} color={theme.textSecondary} />
                <Text style={[styles.placeholderText, { color: theme.textSecondary }]}>
                  Tap to select an image to scan
                </Text>
              </View>
            )}
            
            {isProcessing && (
              <View style={[styles.loadingOverlay, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
                <ActivityIndicator size="large" color="#FFF" />
                <Text style={styles.loadingText}>Scanning Image...</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Result Area */}
          <View style={[styles.resultCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.resultHeader}>
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Extracted Text</Text>
              <TouchableOpacity onPress={copyToClipboard} disabled={!extractedText || isProcessing}>
                <Ionicons name="copy-outline" size={24} color={extractedText ? theme.primary : theme.textSecondary} />
              </TouchableOpacity>
            </View>
            
            <TextInput
              style={[styles.textArea, { color: theme.textPrimary, borderColor: theme.border }]}
              placeholder="Text will appear here after scanning..."
              placeholderTextColor={theme.textSecondary}
              value={extractedText}
              onChangeText={setExtractedText}
              multiline
              textAlignVertical="top"
              editable={!isProcessing}
            />
          </View>

          {/* Export Actions */}
          <View style={styles.actionRowGrid}>
            <TouchableOpacity 
              style={[styles.primaryActionBtn, { backgroundColor: theme.primary }, !extractedText && { opacity: 0.5 }]}
              onPress={() => exportResult('share')}
              disabled={!extractedText || isProcessing}
            >
              <Ionicons name="share-outline" size={20} color={theme.background} />
              <Text style={{ color: theme.background, fontWeight: 'bold' }}>Share</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.primaryActionBtn, { backgroundColor: theme.primary }, !extractedText && { opacity: 0.5 }]}
              onPress={() => exportResult('save')}
              disabled={!extractedText || isProcessing}
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
  container: { flex: 1 },
  content: { padding: spacing.l, paddingBottom: 80 },
  imagePicker: {
    height: 250,
    borderRadius: 24,
    borderWidth: 2,
    borderStyle: 'dashed',
    overflow: 'hidden',
    marginBottom: spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    alignItems: 'center',
  },
  placeholderText: {
    marginTop: spacing.m,
    fontSize: typography.sizes.m,
    fontWeight: typography.weights.medium,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#FFF',
    marginTop: spacing.m,
    fontSize: typography.sizes.m,
    fontWeight: typography.weights.bold,
  },
  resultCard: {
    padding: spacing.l,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: spacing.xl,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.m,
  },
  sectionTitle: {
    fontSize: typography.sizes.m,
    fontWeight: typography.weights.bold,
  },
  textArea: {
    minHeight: 200,
    fontSize: typography.sizes.m,
    lineHeight: 24,
    borderWidth: 1,
    borderRadius: 16,
    padding: spacing.m,
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
