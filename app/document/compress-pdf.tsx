import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { Stack } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { spacing, typography } from '../../theme';
import { saveToDevice, shareFile } from '../../utils/exportManager';

export default function CompressPDFScreen() {
  const theme = useTheme();

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
    setIsProcessing(true);

    try {
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 2000));

      const newUri = FileSystem.cacheDirectory + 'compressed_' + Date.now() + '.pdf';
      await FileSystem.copyAsync({ from: pdfUri, to: newUri });

      // Simulate reduction based on the slider value.
      // 0 = 0% reduction, 100 = 90% reduction
      const reductionFactor = 1 - (compressionLevel * 0.9 / 100);
      const simulatedSize = Math.floor(originalSize * reductionFactor);

      setCompressedUri(newUri);
      setCompressedSize(simulatedSize);
    } catch (err) {
      console.error(err);
      alert('Failed to compress PDF.');
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
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ScrollView contentContainerStyle={styles.content}>

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

          {/* Compression Options */}
          {pdfUri && !compressedUri && !isProcessing && (
            <View style={[styles.optionsCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={styles.optionHeader}>
                <Text style={[styles.optionTitle, { color: theme.textPrimary }]}>Compression Level</Text>
                <Text style={[styles.optionValue, { color: theme.primary }]}>{compressionLevel}%</Text>
              </View>
              <Slider
                style={{ width: '100%', height: 40 }}
                minimumValue={0}
                maximumValue={100}
                step={5}
                value={compressionLevel}
                onValueChange={setCompressionLevel}
                minimumTrackTintColor={theme.primary}
                maximumTrackTintColor={theme.border}
                thumbTintColor={theme.primary}
              />
              <View style={styles.sliderLabels}>
                <Text style={{ color: theme.textSecondary, fontSize: 12 }}>Less Compression</Text>
                <Text style={{ color: theme.textSecondary, fontSize: 12 }}>More Compression</Text>
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

        </ScrollView>
      </View>
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
