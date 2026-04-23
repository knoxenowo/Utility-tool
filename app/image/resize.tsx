import { Ionicons } from '@expo/vector-icons';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { Stack } from 'expo-router';
import React, { useState } from 'react';
import { Image as RNImage, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import KeyboardAwareScrollView from '../../components/KeyboardAwareScrollView';
import { useTheme } from '../../hooks/useTheme';
import { spacing, typography } from '../../theme';
import { saveToDevice, shareFile } from '../../utils/exportManager';

interface ImageMeta {
  uri: string;
  width: number;
  height: number;
}

export default function ImageResizeScreen() {
  const theme = useTheme();

  const [originalImage, setOriginalImage] = useState<ImageMeta | null>(null);
  const [targetWidth, setTargetWidth] = useState('');
  const [targetHeight, setTargetHeight] = useState('');
  const [maintainAspect, setMaintainAspect] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const MAX_DIMENSION = 8192;

  const handleWidthChange = (val: string) => {
    let w = parseInt(val, 10);
    if (!isNaN(w) && w > MAX_DIMENSION) w = MAX_DIMENSION;

    setTargetWidth(isNaN(w) ? val : w.toString());

    if (maintainAspect && originalImage && !isNaN(w)) {
      const aspect = originalImage.height / originalImage.width;
      let h = Math.round(w * aspect);
      if (h > MAX_DIMENSION) {
        h = MAX_DIMENSION;
        w = Math.round(h / aspect);
        setTargetWidth(w.toString());
      }
      setTargetHeight(h.toString());
    }
  };

  const handleHeightChange = (val: string) => {
    let h = parseInt(val, 10);
    if (!isNaN(h) && h > MAX_DIMENSION) h = MAX_DIMENSION;

    setTargetHeight(isNaN(h) ? val : h.toString());

    if (maintainAspect && originalImage && !isNaN(h)) {
      const aspect = originalImage.width / originalImage.height;
      let w = Math.round(h * aspect);
      if (w > MAX_DIMENSION) {
        w = MAX_DIMENSION;
        h = Math.round(w / aspect);
        setTargetHeight(h.toString());
      }
      setTargetWidth(w.toString());
    }
  };

  const pickImage = async (useCamera: boolean) => {
    let result;
    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ['images'],
      quality: 1,
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
      const asset = result.assets[0];
      setOriginalImage({ uri: asset.uri, width: asset.width, height: asset.height });
      setTargetWidth(asset.width.toString());
      setTargetHeight(asset.height.toString());
    }
  };

  const executeAction = async (action: 'share' | 'save') => {
    if (!originalImage) return;

    let w = parseInt(targetWidth, 10);
    let h = parseInt(targetHeight, 10);

    if (isNaN(w) || isNaN(h) || w <= 0 || h <= 0) {
      alert('Please enter valid dimensions');
      return;
    }

    if (w > MAX_DIMENSION || h > MAX_DIMENSION) {
      w = Math.min(w, MAX_DIMENSION);
      h = Math.min(h, MAX_DIMENSION);
      setTargetWidth(w.toString());
      setTargetHeight(h.toString());
      alert(`Dimensions were capped at ${MAX_DIMENSION}px to prevent the app from crashing.`);
    }

    setIsProcessing(true);
    try {
      const manipResult = await ImageManipulator.manipulateAsync(
        originalImage.uri,
        [{ resize: { width: w, height: h } }],
        { compress: 1, format: 'png' as any }
      );

      if (action === 'share') {
        await shareFile(manipResult.uri, 'image/png', 'Share Resized Photo');
      } else {
        await saveToDevice(manipResult.uri, `resized_${Date.now()}.png`, 'image/png', 'Image Resizer');
      }
    } catch (e) {
      console.error(e);
      alert('Failed to resize image.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{
        title: 'Image Resizer',
        headerStyle: { backgroundColor: theme.background },
        headerTintColor: theme.textPrimary,
        headerShadowVisible: false,
      }} />
      <KeyboardAwareScrollView style={[styles.container, { backgroundColor: theme.background }]}>
          <View style={styles.content}>

          {!originalImage ? (
            <View style={[styles.placeholder, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Ionicons name="resize-outline" size={64} color={theme.textSecondary} />
              <Text style={[styles.placeholderText, { color: theme.textSecondary }]}>Select an image to resize</Text>

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
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                  <RNImage
                    source={{ uri: originalImage.uri }}
                    style={[
                      styles.previewImage,
                      { aspectRatio: (parseInt(targetWidth, 10) || 1) / (parseInt(targetHeight, 10) || 1) }
                    ]}
                    resizeMode="stretch"
                  />
                </View>
                <TouchableOpacity style={styles.clearBtn} onPress={() => {
                  setOriginalImage(null);
                }}>
                  <Ionicons name="close-circle" size={32} color={theme.error} />
                </TouchableOpacity>
              </View>

              <View style={styles.statsRow}>
                <View style={[styles.statBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                  <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Original Dimensions</Text>
                  <Text style={[styles.statValue, { color: theme.textPrimary }]}>
                    {originalImage.width} × {originalImage.height} px
                  </Text>
                </View>
              </View>

              <View style={[styles.configContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={styles.toggleRow}>
                  <Text style={[styles.label, { color: theme.textPrimary }]}>Maintain Aspect Ratio</Text>
                  <Switch
                    value={maintainAspect}
                    onValueChange={setMaintainAspect}
                    trackColor={{ false: theme.border, true: theme.primary }}
                  />
                </View>

                <View style={styles.inputsRow}>
                  <View style={styles.inputWrapper}>
                    <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Width (px)</Text>
                    <TextInput
                      style={[styles.input, { borderColor: theme.border, color: theme.textPrimary }]}
                      value={targetWidth}
                      onChangeText={handleWidthChange}
                      keyboardType="numeric"
                    />
                  </View>
                  <Ionicons name="close-outline" size={24} color={theme.textSecondary} style={{ marginTop: 24 }} />
                  <View style={styles.inputWrapper}>
                    <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Height (px)</Text>
                    <TextInput
                      style={[styles.input, { borderColor: theme.border, color: theme.textPrimary }]}
                      value={targetHeight}
                      onChangeText={handleHeightChange}
                      keyboardType="numeric"
                    />
                  </View>
                </View>
              </View>

              <View style={styles.actionRowGrid}>
                <TouchableOpacity
                  style={[styles.primaryActionBtn, { backgroundColor: theme.primary }, isProcessing && { opacity: 0.5 }]}
                  onPress={() => executeAction('share')}
                  disabled={isProcessing}
                >
                  <Ionicons name="share-outline" size={20} color={theme.background} />
                  <Text style={{ color: theme.background, fontWeight: 'bold' }}>Share PNG</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.primaryActionBtn, { backgroundColor: theme.primary }, isProcessing && { opacity: 0.5 }]}
                  onPress={() => executeAction('save')}
                  disabled={isProcessing}
                >
                  <Ionicons name="download-outline" size={20} color={theme.background} />
                  <Text style={{ color: theme.background, fontWeight: 'bold' }}>Save to Device</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

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
    height: 300,
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
  clearBtn: {
    position: 'absolute',
    top: spacing.m,
    right: spacing.m,
    backgroundColor: '#fff',
    borderRadius: 16,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: spacing.l,
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
  configContainer: {
    padding: spacing.l,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: spacing.xxl,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.l,
  },
  label: {
    fontSize: typography.sizes.m,
    fontWeight: typography.weights.medium,
  },
  inputsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.m,
  },
  inputWrapper: {
    flex: 1,
  },
  inputLabel: {
    fontSize: typography.sizes.s,
    marginBottom: spacing.xs,
    fontWeight: typography.weights.medium,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: spacing.m,
    fontSize: typography.sizes.l,
    fontWeight: typography.weights.bold,
    textAlign: 'center',
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
