import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, TextInput, Linking } from 'react-native';
import KeyboardAwareScrollView from '../../components/KeyboardAwareScrollView';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { Stack } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { useTheme } from '../../hooks/useTheme';
import { spacing, typography } from '../../theme';
import { shareFile, saveToDevice } from '../../utils/exportManager';
import { useAppStore } from '../../store/useAppStore';

export default function CompressPDFScreen() {
  const theme = useTheme();
  const { convertApiKey, setConvertApiKey } = useAppStore();
  
  const [pdfUri, setPdfUri] = useState<string | null>(null);
  const [pdfName, setPdfName] = useState<string>('');
  const [originalSize, setOriginalSize] = useState<number>(0);
  const [compressedSize, setCompressedSize] = useState<number | null>(null);
  const [compressedUri, setCompressedUri] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [compressionLevel, setCompressionLevel] = useState<number>(50);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const pickPDF = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        setPdfUri(result.assets[0].uri);
        setPdfName(result.assets[0].name);
        setOriginalSize(result.assets[0].size || 0);
        setCompressedSize(null);
        setCompressedUri(null);
      }
    } catch (err) {
      console.error(err);
      alert('Error picking document.');
    }
  };

  const compressPDF = async () => {
    if (!pdfUri) return;
    if (!convertApiKey) {
      alert('Please enter a ConvertAPI Secret Key first.');
      return;
    }
    setIsProcessing(true);

    try {
      const formData = new FormData();
      formData.append('File', {
        uri: pdfUri,
        name: pdfName,
        type: 'application/pdf',
      } as any);

      let preset = 'web';
      if (compressionLevel > 75) preset = 'print';
      else if (compressionLevel > 25) preset = 'ebook';
      
      formData.append('Preset', preset);

      const response = await fetch(`https://v2.convertapi.com/convert/pdf/to/compress?Secret=${convertApiKey}`, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
        }
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error.message);

      const fileData = data.Files[0];
      const newUri = FileSystem.cacheDirectory + 'compressed_' + Date.now() + '.pdf';
      
      await FileSystem.writeAsStringAsync(newUri, fileData.FileData, { encoding: 'base64' });
      
      const fileInfo = await FileSystem.getInfoAsync(newUri);
      
      setCompressedUri(newUri);
      setCompressedSize(fileInfo.exists ? fileInfo.size : 0);
    } catch (err: any) {
      console.error(err);
      alert('Failed to compress PDF: ' + (err.message || 'Unknown error'));
    } finally {
      setIsProcessing(false);
    }
  };

  const exportResult = async (action: 'share' | 'save') => {
    if (!compressedUri) return;
    
    try {
      if (action === 'share') {
        await shareFile(compressedUri, 'application/pdf', 'Share Compressed PDF');
      } else {
        await saveToDevice(compressedUri, pdfName, 'application/pdf', 'Compress PDF');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to export PDF.');
    }
  };

  return (
    <>
      <Stack.Screen options={{ 
        title: 'Compress PDF',
        headerStyle: { backgroundColor: theme.background },
        headerTintColor: theme.textPrimary,
        headerShadowVisible: false,
      }} />
      <KeyboardAwareScrollView style={[styles.container, { backgroundColor: theme.background }]}>
          
          {/* Picker Area */}
          <TouchableOpacity 
            style={[styles.pickerArea, { borderColor: theme.border, backgroundColor: theme.surface }]} 
            onPress={pickPDF}
            disabled={isProcessing}
          >
            {pdfUri ? (
              <View style={styles.fileInfo}>
                <Ionicons name="document-text" size={64} color={theme.primary} />
                <Text style={[styles.fileName, { color: theme.textPrimary }]} numberOfLines={2}>{pdfName}</Text>
                <Text style={[styles.fileSize, { color: theme.textSecondary }]}>Size: {formatBytes(originalSize)}</Text>
              </View>
            ) : (
              <View style={styles.placeholder}>
                <Ionicons name="document-outline" size={64} color={theme.textSecondary} />
                <Text style={[styles.placeholderText, { color: theme.textSecondary }]}>
                  Tap to select a PDF
                </Text>
              </View>
            )}
            
            {isProcessing && (
              <View style={[styles.loadingOverlay, { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
                <ActivityIndicator size="large" color="#FFF" />
                <Text style={styles.loadingText}>Compressing PDF...</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* API Key Input */}
          <View style={[styles.optionsCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={[styles.optionTitle, { color: theme.textPrimary, marginBottom: spacing.xs }]}>API Key Required</Text>
            <Text style={{ color: theme.textSecondary, fontSize: 12, marginBottom: spacing.m }}>
              True compression requires an external API. Get a free Secret Key at{' '}
              <Text style={{ color: theme.primary, textDecorationLine: 'underline' }} onPress={() => Linking.openURL('https://www.convertapi.com/prices')}>ConvertAPI.com</Text>.
            </Text>
            <TextInput
              style={[styles.input, { color: theme.textPrimary, borderColor: theme.border }]}
              placeholder="Enter ConvertAPI Secret Key"
              placeholderTextColor={theme.textSecondary}
              value={convertApiKey}
              onChangeText={setConvertApiKey}
              secureTextEntry
            />
          </View>

          {/* Compression Options */}
          {pdfUri && !compressedUri && !isProcessing && (
            <View style={[styles.optionsCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={styles.optionHeader}>
                <Text style={[styles.optionTitle, { color: theme.textPrimary }]}>Compression Profile</Text>
                <Text style={[styles.optionValue, { color: theme.primary }]}>
                  {compressionLevel < 33 ? 'Max (Web)' : compressionLevel < 66 ? 'Medium (eBook)' : 'Low (Print)'}
                </Text>
              </View>
              <Slider
                style={{ width: '100%', height: 40 }}
                minimumValue={0}
                maximumValue={100}
                step={50}
                value={compressionLevel}
                onValueChange={setCompressionLevel}
                minimumTrackTintColor={theme.primary}
                maximumTrackTintColor={theme.border}
                thumbTintColor={theme.primary}
              />
              <View style={styles.sliderLabels}>
                <Text style={{ color: theme.textSecondary, fontSize: 12 }}>Smaller Size</Text>
                <Text style={{ color: theme.textSecondary, fontSize: 12 }}>Higher Quality</Text>
              </View>
            </View>
          )}

          {/* Compress Button */}
          {pdfUri && !compressedUri && !isProcessing && (
            <TouchableOpacity 
              style={[styles.compressBtn, { backgroundColor: theme.primary }]}
              onPress={compressPDF}
            >
              <Ionicons name="flash" size={24} color={theme.background} />
              <Text style={[styles.compressBtnText, { color: theme.background }]}>Compress Now</Text>
            </TouchableOpacity>
          )}

          {/* Result Area */}
          {compressedUri && (
            <View style={[styles.resultCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={styles.resultHeader}>
                <Ionicons name="checkmark-circle" size={32} color="#10B981" />
                <Text style={[styles.successText, { color: theme.textPrimary }]}>Compression Complete!</Text>
              </View>
              
              <View style={styles.statsContainer}>
                <View style={styles.statBox}>
                  <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Original</Text>
                  <Text style={[styles.statValue, { color: theme.textPrimary }]}>{formatBytes(originalSize)}</Text>
                </View>
                <Ionicons name="arrow-forward" size={24} color={theme.textSecondary} />
                <View style={styles.statBox}>
                  <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Compressed</Text>
                  <Text style={[styles.statValue, { color: '#10B981' }]}>{formatBytes(compressedSize || 0)}</Text>
                </View>
              </View>

              <View style={styles.actionRowGrid}>
                <TouchableOpacity 
                  style={[styles.primaryActionBtn, { backgroundColor: theme.primary }]}
                  onPress={() => exportResult('share')}
                >
                  <Ionicons name="share-outline" size={20} color={theme.background} />
                  <Text style={{ color: theme.background, fontWeight: 'bold' }}>Share</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.primaryActionBtn, { backgroundColor: theme.primary }]}
                  onPress={() => exportResult('save')}
                >
                  <Ionicons name="download-outline" size={20} color={theme.background} />
                  <Text style={{ color: theme.background, fontWeight: 'bold' }}>Save PDF</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
      </KeyboardAwareScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.l, paddingBottom: 80 },
  pickerArea: {
    height: 250,
    borderRadius: 24,
    borderWidth: 2,
    borderStyle: 'dashed',
    overflow: 'hidden',
    marginBottom: spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fileInfo: {
    alignItems: 'center',
    padding: spacing.m,
  },
  fileName: {
    marginTop: spacing.m,
    fontSize: typography.sizes.m,
    fontWeight: typography.weights.bold,
    textAlign: 'center',
  },
  fileSize: {
    marginTop: spacing.xs,
    fontSize: typography.sizes.s,
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
  optionsCard: {
    padding: spacing.l,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: spacing.l,
  },
  optionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.s,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.m,
    fontSize: typography.sizes.m,
  },
  optionTitle: {
    fontSize: typography.sizes.m,
    fontWeight: typography.weights.bold,
  },
  optionValue: {
    fontSize: typography.sizes.m,
    fontWeight: typography.weights.bold,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -5,
  },
  compressBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.s,
    padding: spacing.l,
    borderRadius: 16,
    marginBottom: spacing.xl,
  },
  compressBtnText: {
    fontSize: typography.sizes.l,
    fontWeight: typography.weights.bold,
  },
  resultCard: {
    padding: spacing.l,
    borderRadius: 24,
    borderWidth: 1,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.s,
    marginBottom: spacing.l,
  },
  successText: {
    fontSize: typography.sizes.l,
    fontWeight: typography.weights.bold,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: spacing.xl,
  },
  statBox: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: typography.sizes.s,
    marginBottom: spacing.xs,
  },
  statValue: {
    fontSize: typography.sizes.l,
    fontWeight: typography.weights.bold,
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
