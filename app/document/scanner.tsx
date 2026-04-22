import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Image, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system/legacy';
import { useTheme } from '../../hooks/useTheme';
import { spacing, typography } from '../../theme';
import { saveToDevice, shareFile } from '../../utils/exportManager';

export default function DocumentScannerScreen() {
  const theme = useTheme();
  
  const [pages, setPages] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const scanDocument = async (source: 'camera' | 'gallery') => {
    try {
      let result;
      // Using an array for mediaTypes avoids deprecation warnings
      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ['images'],
        allowsEditing: true, // Gives user the square crop tool for precision document edges
        quality: 0.8,
      };

      if (source === 'camera') {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Permission Denied', 'Camera permission is required to scan documents.');
          return;
        }
        result = await ImagePicker.launchCameraAsync(options);
      } else {
        result = await ImagePicker.launchImageLibraryAsync(options);
      }

      if (!result.canceled && result.assets[0]) {
        setPages(prev => [...prev, result.assets[0].uri]);
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to scan document.');
    }
  };

  const removePage = (index: number) => {
    setPages(prev => prev.filter((_, i) => i !== index));
  };

  const exportAsImages = async (action: 'share' | 'save') => {
    if (pages.length === 0) return;
    setIsProcessing(true);
    try {
      if (action === 'save') {
        // Save each image sequentially
        for (let i = 0; i < pages.length; i++) {
          await saveToDevice(pages[i], `scan_${Date.now()}_page${i + 1}.jpg`, 'image/jpeg', 'Scans');
        }
        Alert.alert('Success', `Successfully saved ${pages.length} scanned pages to your gallery/documents.`);
      } else {
        // Sharing multiple individual files seamlessly across OSs natively via standard shares is unstable.
        if (pages.length === 1) {
          await shareFile(pages[0], 'image/jpeg', 'Share Scanned Page');
        } else {
          Alert.alert(
            'Batch Sharing Limited', 
            'Sharing multiple individual images directly is not supported by the system dialog. Please select "Export as PDF" to share them all at once, or "Save Images" to export them locally.'
          );
        }
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Export Error', 'Failed to export images.');
    } finally {
      setIsProcessing(false);
    }
  };

  const exportAsPdf = async (action: 'share' | 'save') => {
    if (pages.length === 0) return;
    setIsProcessing(true);

    try {
      let imageTags = '';

      for (const uri of pages) {
        let dataUri = uri;
        if (Platform.OS !== 'web') {
          const base64Image = await FileSystem.readAsStringAsync(uri, {
            encoding: 'base64',
          });
          dataUri = `data:image/jpeg;base64,${base64Image}`;
        }
        
        imageTags += `
          <div style="page-break-after: always; display: flex; justify-content: center; align-items: center; height: 100vh;">
            <img src="${dataUri}" style="max-width: 100%; max-height: 100%; object-fit: contain;" />
          </div>
        `;
      }

      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
            <style>
              body { margin: 0; padding: 0; background-color: #ffffff; }
            </style>
          </head>
          <body>
            ${imageTags}
          </body>
        </html>
      `;

      const { uri: pdfUri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false
      });

      if (action === 'share') {
        await shareFile(pdfUri, 'application/pdf', 'Share Scanned PDF');
      } else {
        await saveToDevice(pdfUri, `scanned_doc_${Date.now()}.pdf`, 'application/pdf', 'Scans');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('PDF Error', 'Failed to generate PDF document.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ 
        title: 'Document Scanner',
        headerStyle: { backgroundColor: theme.background },
        headerTintColor: theme.textPrimary,
        headerShadowVisible: false,
      }} />
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ScrollView contentContainerStyle={styles.content}>
          
          <View style={styles.actionRowGrid}>
            <TouchableOpacity 
              style={[styles.cameraBtn, { borderColor: theme.primary, backgroundColor: theme.surface }]} 
              onPress={() => scanDocument('camera')}
              disabled={isProcessing}
            >
              <Ionicons name="camera-outline" size={32} color={theme.primary} />
              <Text style={[styles.btnText, { color: theme.primary }]}>Scan Camera</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.cameraBtn, { borderColor: theme.primary, backgroundColor: theme.surface }]} 
              onPress={() => scanDocument('gallery')}
              disabled={isProcessing}
            >
              <Ionicons name="images-outline" size={32} color={theme.primary} />
              <Text style={[styles.btnText, { color: theme.primary }]}>From Gallery</Text>
            </TouchableOpacity>
          </View>

          {pages.length > 0 ? (
            <View style={[styles.pagesCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
                Scanned Pages ({pages.length})
              </Text>
              
              <View style={styles.grid}>
                {pages.map((uri, index) => (
                  <View key={index} style={[styles.gridItem, { borderColor: theme.border }]}>
                    <Image source={{ uri }} style={styles.thumbnail} />
                    <View style={styles.pageNumberBadge}>
                      <Text style={styles.pageNumberText}>{index + 1}</Text>
                    </View>
                    <TouchableOpacity style={styles.deleteBtn} onPress={() => removePage(index)}>
                      <Ionicons name="trash" size={16} color="#FFF" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="scan-outline" size={64} color={theme.textSecondary} />
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No pages scanned yet.</Text>
            </View>
          )}

        </ScrollView>

        {pages.length > 0 && (
          <View style={[styles.exportFooter, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
            {isProcessing && (
              <View style={[styles.loadingOverlay, { backgroundColor: 'rgba(255,255,255,0.8)' }]}>
                <ActivityIndicator size="large" color={theme.primary} />
              </View>
            )}

            <Text style={[styles.footerLabel, { color: theme.textSecondary }]}>Export as PDF</Text>
            <View style={styles.exportRow}>
              <TouchableOpacity 
                style={[styles.exportBtn, { backgroundColor: theme.primary }]}
                onPress={() => exportAsPdf('share')}
              >
                <Ionicons name="share-social-outline" size={20} color={theme.background} />
                <Text style={[styles.exportBtnText, { color: theme.background }]}>Share PDF</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.exportBtn, { backgroundColor: theme.primary }]}
                onPress={() => exportAsPdf('save')}
              >
                <Ionicons name="download-outline" size={20} color={theme.background} />
                <Text style={[styles.exportBtnText, { color: theme.background }]}>Save PDF</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.footerLabel, { color: theme.textSecondary, marginTop: spacing.m }]}>Export as Images</Text>
            <View style={styles.exportRow}>
              <TouchableOpacity 
                style={[styles.exportSecondaryBtn, { borderColor: theme.border }]}
                onPress={() => exportAsImages('share')}
              >
                <Ionicons name="share-outline" size={20} color={theme.textPrimary} />
                <Text style={[styles.exportSecondaryText, { color: theme.textPrimary }]}>Share Images</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.exportSecondaryBtn, { borderColor: theme.border }]}
                onPress={() => exportAsImages('save')}
              >
                <Ionicons name="images-outline" size={20} color={theme.textPrimary} />
                <Text style={[styles.exportSecondaryText, { color: theme.textPrimary }]}>Save Images</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.l, paddingBottom: spacing.xl },
  actionRowGrid: {
    flexDirection: 'row',
    gap: spacing.m,
    marginBottom: spacing.xl,
  },
  cameraBtn: {
    flex: 1,
    padding: spacing.xl,
    borderRadius: 24,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.s,
  },
  btnText: {
    fontSize: typography.sizes.m,
    fontWeight: typography.weights.bold,
  },
  pagesCard: {
    padding: spacing.l,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.sizes.m,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.m,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.m,
  },
  gridItem: {
    width: '47%',
    aspectRatio: 3/4,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  pageNumberBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageNumberText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  deleteBtn: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    padding: spacing.xl,
    marginTop: spacing.xl,
  },
  emptyText: {
    marginTop: spacing.m,
    fontSize: typography.sizes.m,
  },
  exportFooter: {
    padding: spacing.l,
    paddingBottom: Platform.OS === 'ios' ? 40 : spacing.l,
    borderTopWidth: 1,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    position: 'relative',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },
  footerLabel: {
    fontSize: typography.sizes.s,
    textTransform: 'uppercase',
    fontWeight: typography.weights.bold,
    marginBottom: spacing.xs,
  },
  exportRow: {
    flexDirection: 'row',
    gap: spacing.m,
  },
  exportBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.s,
    padding: spacing.m,
    borderRadius: 16,
  },
  exportBtnText: {
    fontSize: typography.sizes.m,
    fontWeight: typography.weights.bold,
  },
  exportSecondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.s,
    padding: spacing.m,
    borderRadius: 16,
    borderWidth: 1,
  },
  exportSecondaryText: {
    fontSize: typography.sizes.m,
    fontWeight: typography.weights.bold,
  },
});
