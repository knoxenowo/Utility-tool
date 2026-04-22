import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image as RNImage, ActivityIndicator, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system/legacy';
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { spacing, typography } from '../../theme';
import { shareFile, saveToDevice } from '../../utils/exportManager';

export default function ImageToPdfScreen() {
  const theme = useTheme();
  
  const [images, setImages] = useState<string[]>([]);
  const [paperSize, setPaperSize] = useState<'A4' | 'Letter'>('A4');
  const [isProcessing, setIsProcessing] = useState(false);

  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Sorry, we need gallery permissions to pick multiple images!');
      return;
    }
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets) {
      const newUris = result.assets.map(a => a.uri);
      setImages(prev => [...prev, ...newUris]);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const executePdfAction = async (action: 'share' | 'save') => {
    if (images.length === 0) return;
    setIsProcessing(true);

    try {
      let imageTags = '';

      for (const uri of images) {
        let dataUri = uri;
        if (Platform.OS !== 'web') {
          const base64Image = await FileSystem.readAsStringAsync(uri, {
            encoding: 'base64',
          });
          dataUri = `data:image/jpeg;base64,${base64Image}`;
        }
        
        imageTags += `
          <div class="page">
            <img src="${dataUri}" />
          </div>
        `;
      }

      const html = `
        <html>
          <head>
            <style>
              @page { size: ${paperSize === 'A4' ? 'A4' : 'letter'}; margin: 0; }
              body { 
                margin: 0; 
                padding: 0;
              }
              .page {
                width: 100vw;
                height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                page-break-after: always;
              }
              img {
                max-width: 100%;
                max-height: 100%;
                object-fit: contain;
              }
            </style>
          </head>
          <body>
            ${imageTags}
          </body>
        </html>
      `;

      if (Platform.OS === 'web') {
        await Print.printAsync({ html });
      } else {
        const { uri } = await Print.printToFileAsync({
          html,
          base64: false
        });

        if (action === 'share') {
          await shareFile(uri, 'application/pdf', 'Share PDF Document');
        } else {
          await saveToDevice(uri, `document_${Date.now()}.pdf`, 'application/pdf', 'Image to PDF');
        }
      }
    } catch (error) {
      console.error(error);
      alert('Failed to generate PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ 
        title: 'Image to PDF',
        headerStyle: { backgroundColor: theme.background },
        headerTintColor: theme.textPrimary,
        headerShadowVisible: false,
      }} />
      <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.content}>
          
          {/* Header Action */}
          <TouchableOpacity 
            style={[styles.addBtn, { backgroundColor: theme.surface, borderColor: theme.border }]} 
            onPress={pickImages}
          >
            <Ionicons name="images-outline" size={32} color={theme.primary} />
            <Text style={[styles.addBtnText, { color: theme.textPrimary }]}>Select Images</Text>
            <Text style={[styles.addBtnSub, { color: theme.textSecondary }]}>Pick one or multiple files</Text>
          </TouchableOpacity>

          {/* Grid of selected images */}
          {images.length > 0 && (
            <View style={styles.grid}>
              {images.map((uri, index) => (
                <View key={`${uri}-${index}`} style={[styles.imageWrapper, { borderColor: theme.border }]}>
                  <RNImage source={{ uri }} style={styles.thumbnail} />
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{index + 1}</Text>
                  </View>
                  <TouchableOpacity style={styles.removeBtn} onPress={() => removeImage(index)}>
                    <Ionicons name="close-circle" size={24} color={theme.error} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* Options */}
          {images.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Paper Size</Text>
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

              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Generate Options</Text>
              <View style={styles.actionRowGrid}>
                <TouchableOpacity 
                  style={[styles.primaryActionBtn, { backgroundColor: theme.primary }, isProcessing && { opacity: 0.5 }]}
                  onPress={() => executePdfAction('share')}
                  disabled={isProcessing}
                >
                  {isProcessing ? <ActivityIndicator color={theme.background} /> : <Ionicons name="share-outline" size={20} color={theme.background} />}
                  {!isProcessing && <Text style={{ color: theme.background, fontWeight: 'bold' }}>Share PDF</Text>}
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.primaryActionBtn, { backgroundColor: theme.primary }, isProcessing && { opacity: 0.5 }]}
                  onPress={() => executePdfAction('save')}
                  disabled={isProcessing}
                >
                  {isProcessing ? <ActivityIndicator color={theme.background} /> : <Ionicons name="download-outline" size={20} color={theme.background} />}
                  {!isProcessing && <Text style={{ color: theme.background, fontWeight: 'bold' }}>Save to Device</Text>}
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
  addBtn: {
    padding: spacing.xl,
    borderRadius: 24,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    marginBottom: spacing.l,
  },
  addBtnText: {
    marginTop: spacing.s,
    fontSize: typography.sizes.m,
    fontWeight: typography.weights.bold,
  },
  addBtnSub: {
    marginTop: spacing.xs,
    fontSize: typography.sizes.s,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.m,
    marginBottom: spacing.xl,
  },
  imageWrapper: {
    width: '30%',
    aspectRatio: 0.75,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#fff',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  badge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  removeBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: typography.sizes.m,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.m,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.m,
    marginBottom: spacing.xl,
  },
  optionCard: {
    flex: 1,
    padding: spacing.m,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  optionText: {
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
