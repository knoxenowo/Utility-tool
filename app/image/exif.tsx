import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useTheme } from '../../hooks/useTheme';
import { spacing, typography } from '../../theme';
import { shareFile, saveToDevice } from '../../utils/exportManager';

export default function ExifScreen() {
  const theme = useTheme();
  
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [exifData, setExifData] = useState<Record<string, any> | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isStripped, setIsStripped] = useState(false);

  const pickImage = async () => {
    // using array format to suppress the MediaTypeOptions deprecation warning
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false, // We don't want to edit, we want the raw image with raw metadata
      quality: 1,
      exif: true,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      const rawExif = result.assets[0].exif;
      if (rawExif) {
        setExifData(rawExif);
      } else {
        setExifData({});
      }
      setIsStripped(false);
    }
  };

  const stripExif = async () => {
    if (!imageUri) return;
    setIsProcessing(true);
    
    try {
      // By default, ImageManipulator drops all EXIF data unless `exif: true` is explicitly passed in save options
      const manipulated = await ImageManipulator.manipulateAsync(
        imageUri,
        [], // No physical changes (scaling/cropping) needed
        { compress: 1, format: ImageManipulator.SaveFormat.JPEG }
      );
      
      setImageUri(manipulated.uri);
      setExifData({}); // Wipe local state
      setIsStripped(true);
    } catch (e) {
      console.error(e);
      alert('Failed to strip EXIF data.');
    } finally {
      setIsProcessing(false);
    }
  };

  const exportResult = async (action: 'share' | 'save') => {
    if (!imageUri) return;

    try {
      if (action === 'share') {
        await shareFile(imageUri, 'image/jpeg', `Share Cleaned Image`);
      } else {
        await saveToDevice(imageUri, `cleaned_image_${Date.now()}.jpg`, 'image/jpeg', 'EXIF_Stripped');
      }
    } catch (e) {
      console.error(e);
      alert('Failed to export image.');
    }
  };

  const renderExifList = () => {
    if (!exifData) return null;
    
    const keys = Object.keys(exifData);
    
    if (keys.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="shield-checkmark-outline" size={48} color={theme.primary} />
          <Text style={[styles.emptyText, { color: theme.textPrimary }]}>No Metadata Found</Text>
          <Text style={[styles.emptySub, { color: theme.textSecondary }]}>This image is completely private and safe.</Text>
        </View>
      );
    }

    return (
      <View style={[styles.exifContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.textPrimary, padding: spacing.m }]}>
          Found {keys.length} Metadata Tags
        </Text>
        {keys.map((key, index) => (
          <View key={key} style={[styles.exifRow, { borderTopColor: theme.border }, index === 0 && { borderTopWidth: 0 }]}>
            <Text style={[styles.exifKey, { color: theme.textSecondary }]}>{key}</Text>
            <Text style={[styles.exifValue, { color: theme.textPrimary }]} numberOfLines={2}>
              {String(exifData[key])}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  return (
    <>
      <Stack.Screen options={{ 
        title: 'EXIF Metadata',
        headerStyle: { backgroundColor: theme.background },
        headerTintColor: theme.textPrimary,
        headerShadowVisible: false,
      }} />
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          
          <TouchableOpacity 
            style={[styles.imagePicker, { borderColor: theme.border, backgroundColor: theme.surface }]} 
            onPress={pickImage}
            disabled={isProcessing}
          >
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="contain" />
            ) : (
              <View style={styles.placeholder}>
                <Ionicons name="image-outline" size={64} color={theme.textSecondary} />
                <Text style={[styles.placeholderText, { color: theme.textSecondary }]}>
                  Tap to select an image to inspect
                </Text>
              </View>
            )}
            
            {isProcessing && (
              <View style={[styles.loadingOverlay, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
                <ActivityIndicator size="large" color="#FFF" />
              </View>
            )}
          </TouchableOpacity>

          {imageUri && (
            <>
              {renderExifList()}

              {exifData && Object.keys(exifData).length > 0 && !isStripped && (
                <TouchableOpacity 
                  style={[styles.stripBtn, { backgroundColor: theme.error }]} 
                  onPress={stripExif}
                  disabled={isProcessing}
                >
                  <Ionicons name="trash-bin-outline" size={24} color={theme.background} />
                  <Text style={[styles.actionText, { color: theme.background }]}>Strip Metadata</Text>
                </TouchableOpacity>
              )}

              <View style={styles.actionRowGrid}>
                <TouchableOpacity 
                  style={[styles.primaryActionBtn, { backgroundColor: theme.primary }]}
                  onPress={() => exportResult('share')}
                  disabled={isProcessing}
                >
                  <Ionicons name="share-outline" size={20} color={theme.background} />
                  <Text style={{ color: theme.background, fontWeight: 'bold' }}>Share</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.primaryActionBtn, { backgroundColor: theme.primary }]}
                  onPress={() => exportResult('save')}
                  disabled={isProcessing}
                >
                  <Ionicons name="download-outline" size={20} color={theme.background} />
                  <Text style={{ color: theme.background, fontWeight: 'bold' }}>Save Clean Image</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

        </ScrollView>
      </View>
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
  exifContainer: {
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: spacing.xl,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: typography.sizes.m,
    fontWeight: typography.weights.bold,
  },
  exifRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.m,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  exifKey: {
    flex: 1,
    fontSize: typography.sizes.s,
    fontWeight: typography.weights.bold,
  },
  exifValue: {
    flex: 2,
    fontSize: typography.sizes.s,
    textAlign: 'right',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  emptyState: {
    alignItems: 'center',
    padding: spacing.xl,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  emptyText: {
    fontSize: typography.sizes.m,
    fontWeight: typography.weights.bold,
    marginTop: spacing.m,
  },
  emptySub: {
    fontSize: typography.sizes.s,
    marginTop: spacing.xs,
  },
  stripBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.s,
    padding: spacing.l,
    borderRadius: 16,
    marginBottom: spacing.m,
  },
  actionText: {
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
