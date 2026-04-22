import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { Stack } from 'expo-router';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { spacing, typography } from '../../theme';
import { shareFile, saveToDevice } from '../../utils/exportManager';

interface ImageMeta {
  uri: string;
  sizeBytes: number;
}

export default function ImageCompressScreen() {
  const theme = useTheme();

  const [originalImage, setOriginalImage] = useState<ImageMeta | null>(null);
  const [compressedImage, setCompressedImage] = useState<ImageMeta | null>(null);
  const [quality, setQuality] = useState(0.8);
  const [isProcessing, setIsProcessing] = useState(false);

  // Debounced effect to re-compress when quality slider changes
  useEffect(() => {
    if (!originalImage) return;

    const timeout = setTimeout(() => {
      compressImage(originalImage.uri, quality);
    }, 300); // 300ms debounce

    return () => clearTimeout(timeout);
  }, [quality, originalImage]);

  const getFileSize = async (uri: string) => {
    try {
      if (Platform.OS === 'web') return 0; // Not fully supported on web blob URIs
      const info = await FileSystem.getInfoAsync(uri);
      if (info.exists) return info.size;
    } catch (e) {
      console.error(e);
    }
    return 0;
  };

  const formatSize = (bytes: number) => {
    if (!bytes) return 'Unknown';
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(2) + ' MB';
  };

  const compressImage = async (uri: string, qual: number) => {
    setIsProcessing(true);
    try {
      // JPEG is required for compression, PNG ignores the compress property
      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [],
        { compress: qual, format: 'jpeg' as any }
      );

      const sizeBytes = await getFileSize(manipResult.uri);

      // If 'compressing' makes the file larger (common with 100% JPEG quality on already compressed images),
      // fallback to the original file so we never worsen the file size.
      if (originalImage && sizeBytes > originalImage.sizeBytes) {
        setCompressedImage({ uri: originalImage.uri, sizeBytes: originalImage.sizeBytes });
      } else {
        setCompressedImage({ uri: manipResult.uri, sizeBytes });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const pickImage = async (useCamera: boolean) => {
    let result;
    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ['images'],
      quality: 1, // Get highest original quality
    };

    if (useCamera) {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        alert('Sorry, we need camera permissions to make this work!');
        return;
      }
      result = await ImagePicker.launchCameraAsync(options);
    } else {
      result = await ImagePicker.launchImageLibraryAsync(options);
    }

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      const sizeBytes = await getFileSize(uri);

      const newImg = { uri, sizeBytes };
      setOriginalImage(newImg);
      // Trigger initial compression
      setQuality(0.8);
      compressImage(newImg.uri, 0.8);
    }
  };

  const executeAction = async (action: 'share' | 'save') => {
    if (!compressedImage) return;
    try {
      if (action === 'share') {
        await shareFile(compressedImage.uri, 'image/jpeg', 'Share Compressed Photo');
      } else {
        await saveToDevice(compressedImage.uri, `compressed_${Date.now()}.jpg`, 'image/jpeg', 'Image Compressor');
      }
    } catch (e) {
      console.error(e);
      alert('Failed to export image.');
    }
  };

  return (
    <>
      <Stack.Screen options={{
        title: 'Image Compressor',
        headerStyle: { backgroundColor: theme.background },
        headerTintColor: theme.textPrimary,
        headerShadowVisible: false,
      }} />
      <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.content}>

          {!originalImage ? (
            <View style={[styles.placeholder, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Ionicons name="image-outline" size={64} color={theme.textSecondary} />
              <Text style={[styles.placeholderText, { color: theme.textSecondary }]}>Select an image to compress</Text>

              <View style={styles.actionRow}>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.primary }]} onPress={() => pickImage(true)}>
                  <Ionicons name="camera-outline" size={20} color={theme.background} />
                  <Text style={[styles.actionBtnText, { color: theme.background }]}>Camera</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.secondary }]} onPress={() => pickImage(false)}>
                  <Ionicons name="images-outline" size={20} color={theme.textPrimary} />
                  <Text style={[styles.actionBtnText, { color: theme.textPrimary }]}>Gallery</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <>
              <View style={[styles.previewContainer, { borderColor: theme.border }]}>
                <Image
                  source={{ uri: compressedImage?.uri || originalImage.uri }}
                  style={styles.previewImage}
                  resizeMode="contain"
                />
                {isProcessing && (
                  <View style={styles.processingOverlay}>
                    <ActivityIndicator size="large" color={theme.primary} />
                  </View>
                )}
                <TouchableOpacity style={styles.clearBtn} onPress={() => {
                  setOriginalImage(null);
                  setCompressedImage(null);
                }}>
                  <Ionicons name="close-circle" size={32} color={theme.error} />
                </TouchableOpacity>
              </View>

              <View style={styles.statsRow}>
                <View style={[styles.statBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Original Size</Text>
                  <Text style={[styles.statValue, { color: theme.textPrimary }]}>
                    {formatSize(originalImage.sizeBytes)}
                  </Text>
                </View>
                <Ionicons name="arrow-forward" size={24} color={theme.textSecondary} style={{ marginTop: 10 }} />
                <View style={[styles.statBox, { backgroundColor: theme.primary, borderColor: theme.border }]}>
                  <Text style={[styles.statLabel, { color: theme.background, opacity: 0.8 }]}>Compressed</Text>
                  <Text style={[styles.statValue, { color: theme.background }]}>
                    {formatSize(compressedImage?.sizeBytes || 0)}
                  </Text>
                </View>
              </View>

              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Compression Quality</Text>
              <View style={[styles.sliderContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={styles.sliderLabels}>
                  <Text style={{ color: theme.textSecondary }}>Low Quality</Text>
                  <Text style={{ color: theme.textPrimary, fontWeight: 'bold' }}>{Math.round(quality * 100)}%</Text>
                  <Text style={{ color: theme.textSecondary }}>High Quality</Text>
                </View>
                <Slider
                  style={{ width: '100%', height: 40 }}
                  minimumValue={0.1}
                  maximumValue={1}
                  step={0.05}
                  value={quality}
                  onValueChange={setQuality}
                  minimumTrackTintColor={theme.primary}
                  maximumTrackTintColor={theme.border}
                  thumbTintColor={theme.primary}
                />
              </View>

              <View style={styles.actionRowGrid}>
                <TouchableOpacity 
                  style={[styles.primaryActionBtn, { backgroundColor: theme.primary }, isProcessing && { opacity: 0.5 }]}
                  onPress={() => executeAction('share')}
                  disabled={isProcessing || !compressedImage}
                >
                  <Ionicons name="share-outline" size={20} color={theme.background} />
                  <Text style={{ color: theme.background, fontWeight: 'bold' }}>Share</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.primaryActionBtn, { backgroundColor: theme.primary }, isProcessing && { opacity: 0.5 }]}
                  onPress={() => executeAction('save')}
                  disabled={isProcessing || !compressedImage}
                >
                  <Ionicons name="download-outline" size={20} color={theme.background} />
                  <Text style={{ color: theme.background, fontWeight: 'bold' }}>Save to Device</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.l,
    paddingBottom: 40,
  },
  placeholder: {
    padding: spacing.xl,
    borderRadius: 24,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  placeholderText: {
    marginTop: spacing.m,
    marginBottom: spacing.l,
    fontSize: typography.sizes.m,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.m,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    paddingVertical: spacing.s,
    paddingHorizontal: spacing.m,
    borderRadius: 12,
  },
  actionBtnText: {
    fontWeight: typography.weights.bold,
  },
  previewContainer: {
    width: '100%',
    height: 350,
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: spacing.m,
    position: 'relative',
    backgroundColor: '#000',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearBtn: {
    position: 'absolute',
    top: spacing.m,
    right: spacing.m,
    backgroundColor: '#fff',
    borderRadius: 16,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  statBox: {
    flex: 1,
    padding: spacing.m,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: typography.sizes.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  statValue: {
    fontSize: typography.sizes.l,
    fontWeight: typography.weights.bold,
  },
  sectionTitle: {
    fontSize: typography.sizes.m,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.m,
  },
  sliderContainer: {
    padding: spacing.l,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: spacing.xxl,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
