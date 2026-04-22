import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ActivityIndicator, Platform, TextInput } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { spacing, typography } from '../../theme';
import { generatePassportPdf } from '../../utils/pdfGenerator';
import { shareFile, saveToDevice } from '../../utils/exportManager';

const PRESETS = [
  { id: 'us', name: 'US (2x2")', widthMm: 51, heightMm: 51, aspect: [1, 1] as [number, number] },
  { id: 'uk', name: 'UK/EU (35x45mm)', widthMm: 35, heightMm: 45, aspect: [35, 45] as [number, number] },
  { id: 'custom', name: 'Custom Size', widthMm: 0, heightMm: 0, aspect: [1, 1] as [number, number] },
];

export default function PassportPhotoScreen() {
  const theme = useTheme();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [preset, setPreset] = useState(PRESETS[0]);
  const [paperSize, setPaperSize] = useState<'A4' | 'Letter'>('A4');
  const [copies, setCopies] = useState(6);
  const [isProcessing, setIsProcessing] = useState(false);

  const [customWidth, setCustomWidth] = useState('50');
  const [customHeight, setCustomHeight] = useState('50');
  const [customUnit, setCustomUnit] = useState<'mm' | 'cm' | 'inch'>('mm');

  const getDimensions = () => {
    let finalWidthMm = preset.widthMm;
    let finalHeightMm = preset.heightMm;
    
    if (preset.id === 'custom') {
      const w = parseFloat(customWidth) || 1;
      const h = parseFloat(customHeight) || 1;
      if (customUnit === 'cm') {
        finalWidthMm = w * 10;
        finalHeightMm = h * 10;
      } else if (customUnit === 'inch') {
        finalWidthMm = w * 25.4;
        finalHeightMm = h * 25.4;
      } else {
        finalWidthMm = w;
        finalHeightMm = h;
      }
    }
    return {
      widthMm: finalWidthMm,
      heightMm: finalHeightMm,
      aspect: [finalWidthMm, finalHeightMm] as [number, number]
    };
  };

  const pickImage = async (useCamera: boolean) => {
    let result;
    const { aspect } = getDimensions();

    const options: ImagePicker.ImagePickerOptions = {
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: aspect,
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
      setSelectedImage(result.assets[0].uri);
    }
  };

  const executeImageAction = async (action: 'share' | 'save') => {
    if (!selectedImage) return;
    try {
      if (action === 'share') {
        await shareFile(selectedImage, 'image/jpeg', 'Share Photo');
      } else {
        await saveToDevice(selectedImage, `photo_${Date.now()}.jpg`, 'image/jpeg', 'Passport Photo');
      }
    } catch (e) {
      console.error(e);
      alert('Failed to export image.');
    }
  };

  const executePdfAction = async (action: 'share' | 'save') => {
    if (!selectedImage) return;
    setIsProcessing(true);
    try {
      const manipResult = await ImageManipulator.manipulateAsync(
        selectedImage,
        [{ resize: { width: 600 } }],
        { compress: 0.8, format: 'jpeg' as any }
      );

      const { widthMm, heightMm } = getDimensions();

      const pdfUri = await generatePassportPdf({
        imageUri: manipResult.uri,
        photoWidthMm: widthMm,
        photoHeightMm: heightMm,
        paperSize,
        copies,
      });

      if (pdfUri) {
        if (action === 'share') {
          await shareFile(pdfUri, 'application/pdf', 'Share Passport Photos');
        } else {
          await saveToDevice(pdfUri, `passport_photos_${Date.now()}.pdf`, 'application/pdf', 'Passport Photo');
        }
      }
    } catch (e) {
      console.error(e);
      alert('Failed to process PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ 
        title: 'Passport Photo',
        headerStyle: { backgroundColor: theme.background },
        headerTintColor: theme.textPrimary,
        headerShadowVisible: false,
      }} />
      <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.content}>
          
          {!selectedImage ? (
            <View style={[styles.placeholder, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Ionicons name="person-outline" size={64} color={theme.textSecondary} />
              <Text style={[styles.placeholderText, { color: theme.textSecondary }]}>No image selected</Text>
              
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
            <View style={[styles.previewContainer, { borderColor: theme.border }]}>
              <Image source={{ uri: selectedImage }} style={styles.previewImage} resizeMode="contain" />
              <TouchableOpacity style={styles.clearBtn} onPress={() => setSelectedImage(null)}>
                <Ionicons name="close-circle" size={32} color={theme.error} />
              </TouchableOpacity>
            </View>
          )}

          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>1. Select Size Format</Text>
          <View style={styles.presetsGrid}>
            {PRESETS.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={[
                  styles.optionCard,
                  { backgroundColor: preset.id === p.id ? theme.primary : theme.surface, borderColor: theme.border }
                ]}
                onPress={() => {
                  setPreset(p);
                  setSelectedImage(null);
                }}
              >
                <Text style={[
                  styles.optionText,
                  { color: preset.id === p.id ? theme.background : theme.textPrimary }
                ]}>
                  {p.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {preset.id === 'custom' && (
            <View style={[styles.customContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={styles.customRow}>
                <View style={styles.inputWrapper}>
                  <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Width</Text>
                  <TextInput
                    style={[styles.input, { borderColor: theme.border, color: theme.textPrimary }]}
                    value={customWidth}
                    onChangeText={(v) => { setCustomWidth(v); setSelectedImage(null); }}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.inputWrapper}>
                  <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Height</Text>
                  <TextInput
                    style={[styles.input, { borderColor: theme.border, color: theme.textPrimary }]}
                    value={customHeight}
                    onChangeText={(v) => { setCustomHeight(v); setSelectedImage(null); }}
                    keyboardType="numeric"
                  />
                </View>
              </View>
              <View style={styles.unitRow}>
                {['mm', 'cm', 'inch'].map(unit => (
                  <TouchableOpacity
                    key={unit}
                    style={[
                      styles.unitBtn,
                      { borderColor: theme.border, backgroundColor: customUnit === unit ? theme.primary : 'transparent' }
                    ]}
                    onPress={() => { setCustomUnit(unit as any); setSelectedImage(null); }}
                  >
                    <Text style={{
                      fontWeight: 'bold',
                      color: customUnit === unit ? theme.background : theme.textPrimary
                    }}>{unit}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>2. Select Paper Size</Text>
          <View style={styles.row}>
            {['A4', 'Letter'].map((size) => (
              <TouchableOpacity
                key={size}
                style={[
                  styles.optionCard,
                  { backgroundColor: paperSize === size ? theme.primary : theme.surface, borderColor: theme.border }
                ]}
                onPress={() => setPaperSize(size as any)}
              >
                <Text style={[
                  styles.optionText,
                  { color: paperSize === size ? theme.background : theme.textPrimary }
                ]}>
                  {size}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>3. Number of Copies</Text>
          <View style={styles.counterRow}>
            <TouchableOpacity 
              style={[styles.counterBtn, { backgroundColor: theme.surface, borderColor: theme.border }]} 
              onPress={() => setCopies(Math.max(1, copies - 1))}
            >
              <Ionicons name="remove" size={24} color={theme.textPrimary} />
            </TouchableOpacity>
            <Text style={[styles.counterText, { color: theme.textPrimary }]}>{copies}</Text>
            <TouchableOpacity 
              style={[styles.counterBtn, { backgroundColor: theme.surface, borderColor: theme.border }]} 
              onPress={() => setCopies(Math.min(30, copies + 1))}
            >
              <Ionicons name="add" size={24} color={theme.textPrimary} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.sectionTitle, { color: theme.textPrimary, marginTop: spacing.xl }]}>PDF Actions</Text>
          <View style={styles.actionRowGrid}>
            <TouchableOpacity 
              style={[styles.primaryActionBtn, { backgroundColor: theme.primary }, (!selectedImage || isProcessing) && { opacity: 0.5 }]}
              onPress={() => executePdfAction('share')}
              disabled={!selectedImage || isProcessing}
            >
              <Ionicons name="share-outline" size={20} color={theme.background} />
              <Text style={{ color: theme.background, fontWeight: 'bold' }}>Share PDF</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.primaryActionBtn, { backgroundColor: theme.primary }, (!selectedImage || isProcessing) && { opacity: 0.5 }]}
              onPress={() => executePdfAction('save')}
              disabled={!selectedImage || isProcessing}
            >
              <Ionicons name="download-outline" size={20} color={theme.background} />
              <Text style={{ color: theme.background, fontWeight: 'bold' }}>Save PDF</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Image Actions</Text>
          <View style={styles.actionRowGrid}>
            <TouchableOpacity 
              style={[styles.secondaryActionBtn, { borderColor: theme.border }, (!selectedImage || isProcessing) && { opacity: 0.5 }]}
              onPress={() => executeImageAction('share')}
              disabled={!selectedImage || isProcessing}
            >
              <Ionicons name="share-outline" size={20} color={theme.textPrimary} />
              <Text style={{ color: theme.textPrimary, fontWeight: 'bold' }}>Share Image</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.secondaryActionBtn, { borderColor: theme.border }, (!selectedImage || isProcessing) && { opacity: 0.5 }]}
              onPress={() => executeImageAction('save')}
              disabled={!selectedImage || isProcessing}
            >
              <Ionicons name="download-outline" size={20} color={theme.textPrimary} />
              <Text style={{ color: theme.textPrimary, fontWeight: 'bold' }}>Save Image</Text>
            </TouchableOpacity>
          </View>

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
    height: 300,
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: spacing.xl,
    position: 'relative',
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
  sectionTitle: {
    fontSize: typography.sizes.m,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.m,
    marginTop: spacing.m,
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.m,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.m,
  },
  optionCard: {
    flex: 1,
    minWidth: '30%',
    padding: spacing.m,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  optionText: {
    fontWeight: typography.weights.bold,
  },
  customContainer: {
    marginTop: spacing.m,
    padding: spacing.m,
    borderRadius: 16,
    borderWidth: 1,
  },
  customRow: {
    flexDirection: 'row',
    gap: spacing.m,
    marginBottom: spacing.m,
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
    padding: spacing.s,
    fontSize: typography.sizes.m,
  },
  unitRow: {
    flexDirection: 'row',
    gap: spacing.s,
  },
  unitBtn: {
    flex: 1,
    paddingVertical: spacing.s,
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.m,
  },
  counterBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterText: {
    fontSize: typography.sizes.l,
    fontWeight: typography.weights.bold,
    minWidth: 40,
    textAlign: 'center',
  },
  actionRowGrid: {
    flexDirection: 'row',
    gap: spacing.m,
    marginBottom: spacing.l,
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
  secondaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.s,
    padding: spacing.m,
    borderRadius: 12,
    borderWidth: 1,
  },
});
