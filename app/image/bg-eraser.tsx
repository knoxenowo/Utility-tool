import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { Stack } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import KeyboardAwareScrollView from '../../components/KeyboardAwareScrollView';
import { useTheme } from '../../hooks/useTheme';
import { spacing, typography } from '../../theme';
import { saveToDevice, shareFile } from '../../utils/exportManager';

export default function BgEraserScreen() {
  const theme = useTheme();

  const [apiKey, setApiKey] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [resultUri, setResultUri] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showApiSettings, setShowApiSettings] = useState(false);

  useEffect(() => {
    const loadKey = async () => {
      const key = await AsyncStorage.getItem('removebg_apikey');
      if (key) setApiKey(key);
      else setShowApiSettings(true); // Auto-show if no key
    };
    loadKey();
  }, []);

  const saveApiKey = async (key: string) => {
    setApiKey(key);
    await AsyncStorage.setItem('removebg_apikey', key);
    setShowApiSettings(false);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true, // Let them crop to subject for better AI focus
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setResultUri(null);
      processImage(result.assets[0].base64);
    }
  };

  const processImage = async (base64String?: string | null) => {
    if (!apiKey) {
      alert('Please enter your Remove.bg API key first.');
      setShowApiSettings(true);
      return;
    }

    if (!base64String) return;

    setIsProcessing(true);

    try {
      const response = await fetch('https://api.remove.bg/v1.0/removebg', {
        method: 'POST',
        headers: {
          'X-Api-Key': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          image_file_b64: base64String,
          size: 'auto',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.errors?.[0]?.title || `HTTP ${response.status}`);
      }

      const data = await response.json();

      // Remove.bg returns base64 image data in data.data.result_b64
      if (data.data && data.data.result_b64) {
        // Save to temp file so we can view/share it cleanly natively
        const tempPath = FileSystem.cacheDirectory + `bg_removed_${Date.now()}.png`;
        await FileSystem.writeAsStringAsync(tempPath, data.data.result_b64, {
          encoding: 'base64',
        });

        setResultUri(tempPath);
      } else {
        throw new Error('Invalid response from server');
      }

    } catch (err: any) {
      console.error('BG Eraser Error:', err);
      alert(`Removal failed: ${err.message || 'Check your API key and internet connection.'}`);
      setResultUri(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const exportResult = async (action: 'share' | 'save') => {
    if (!resultUri) return;

    try {
      if (action === 'share') {
        await shareFile(resultUri, 'image/png', `Share Transparent Image`);
      } else {
        await saveToDevice(resultUri, `transparent_${Date.now()}.png`, 'image/png', 'BG_Eraser');
      }
    } catch (e) {
      console.error(e);
      alert('Failed to export image.');
    }
  };

  return (
    <>
      <Stack.Screen options={{
        title: 'Background Eraser',
        headerStyle: { backgroundColor: theme.background },
        headerTintColor: theme.textPrimary,
        headerShadowVisible: false,
        headerRight: () => (
          <TouchableOpacity onPress={() => setShowApiSettings(!showApiSettings)} style={{ padding: spacing.xs }}>
            <Ionicons name="settings-outline" size={24} color={theme.textPrimary} />
          </TouchableOpacity>
        )
      }} />
      <KeyboardAwareScrollView style={[styles.container, { backgroundColor: theme.background }]}>

          {showApiSettings && (
            <View style={[styles.apiCard, { backgroundColor: theme.surface, borderColor: theme.primary }]}>
              <View style={styles.apiHeader}>
                <Ionicons name="key-outline" size={24} color={theme.primary} />
                <Text style={[styles.sectionTitle, { color: theme.primary, marginLeft: spacing.s }]}>API Setup</Text>
              </View>
              <Text style={[styles.apiSub, { color: theme.textSecondary }]}>
                Background removal requires a massive AI model. To run this app entirely on your phone without downloading huge files, we securely connect to the Remove.bg AI endpoint.
              </Text>
              <Text style={[styles.apiSub, { color: theme.textSecondary, marginBottom: spacing.m }]}>
                Get your 100% free API key at <Text style={{ fontWeight: 'bold', color: theme.primary }}>remove.bg/api</Text>
              </Text>
              <TextInput
                style={[styles.input, { color: theme.textPrimary, borderColor: theme.border, backgroundColor: theme.background }]}
                placeholder="Paste API Key (e.g. jXxY7...)"
                placeholderTextColor={theme.textSecondary}
                value={apiKey}
                onChangeText={setApiKey}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: theme.primary }]}
                onPress={() => saveApiKey(apiKey)}
              >
                <Text style={{ color: theme.background, fontWeight: 'bold' }}>Save Key Securely</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Image Area */}
          <TouchableOpacity
            style={[styles.imagePicker, { borderColor: theme.border, backgroundColor: theme.surface }]}
            onPress={pickImage}
            disabled={isProcessing || (!apiKey && !showApiSettings)}
          >
            {resultUri ? (
              // Grey background to easily spot transparency lines
              <View style={[styles.checkeredBg, { backgroundColor: '#E5E5EA' }]}>
                <Image source={{ uri: resultUri }} style={styles.previewImage} resizeMode="contain" />
              </View>
            ) : imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="contain" />
            ) : (
              <View style={styles.placeholder}>
                <Ionicons name="cut-outline" size={64} color={theme.textSecondary} />
                <Text style={[styles.placeholderText, { color: theme.textSecondary }]}>
                  Tap to upload and erase background
                </Text>
              </View>
            )}

            {isProcessing && (
              <View style={[styles.loadingOverlay, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
                <ActivityIndicator size="large" color="#FFF" />
                <Text style={styles.loadingText}>Erasing Background...</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Export Actions */}
          {resultUri && (
            <View style={styles.actionRowGrid}>
              <TouchableOpacity
                style={[styles.primaryActionBtn, { backgroundColor: theme.primary }]}
                onPress={() => exportResult('share')}
                disabled={isProcessing}
              >
                <Ionicons name="share-outline" size={20} color={theme.background} />
                <Text style={{ color: theme.background, fontWeight: 'bold' }}>Share PNG</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.primaryActionBtn, { backgroundColor: theme.primary }]}
                onPress={() => exportResult('save')}
                disabled={isProcessing}
              >
                <Ionicons name="download-outline" size={20} color={theme.background} />
                <Text style={{ color: theme.background, fontWeight: 'bold' }}>Save PNG</Text>
              </TouchableOpacity>
            </View>
          )}
      </KeyboardAwareScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.l, paddingBottom: 80 },
  apiCard: {
    padding: spacing.m,
    borderRadius: 16,
    borderWidth: 2,
    marginBottom: spacing.xl,
  },
  apiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  apiSub: {
    fontSize: typography.sizes.s,
    lineHeight: 20,
    marginTop: spacing.xs,
  },
  sectionTitle: {
    fontSize: typography.sizes.m,
    fontWeight: typography.weights.bold,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.m,
    fontSize: typography.sizes.m,
    marginBottom: spacing.m,
  },
  saveBtn: {
    padding: spacing.m,
    borderRadius: 12,
    alignItems: 'center',
  },
  imagePicker: {
    height: 350,
    borderRadius: 24,
    borderWidth: 2,
    borderStyle: 'dashed',
    overflow: 'hidden',
    marginBottom: spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkeredBg: {
    width: '100%',
    height: '100%',
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
