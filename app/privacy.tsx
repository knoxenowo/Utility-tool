import React from 'react';
import { ScrollView, Text, StyleSheet, View } from 'react-native';
import { Stack } from 'expo-router';
import { useTheme } from '../hooks/useTheme';
import { spacing, typography } from '../theme';

export default function PrivacyPolicyScreen() {
  const theme = useTheme();

  return (
    <>
      <Stack.Screen options={{ 
        title: 'Privacy Policy',
        headerStyle: { backgroundColor: theme.background },
        headerTintColor: theme.textPrimary,
        headerShadowVisible: false,
      }} />
      <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={styles.content}>
        
        <Text style={[styles.title, { color: theme.textPrimary }]}>Privacy Policy</Text>
        <Text style={[styles.lastUpdated, { color: theme.textSecondary }]}>Last Updated: April 22, 2026</Text>

        <View style={styles.section}>
          <Text style={[styles.heading, { color: theme.textPrimary }]}>1. Local-First Philosophy</Text>
          <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
            Utility Hub is built on a strict privacy-by-design framework. The vast majority of our tools—including the Batch Renamer, Text Encoder, Password Generator, and Media Compressors—operate entirely offline. Your data, files, and generated content never leave your device.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.heading, { color: theme.textPrimary }]}>2. Third-Party Services</Text>
          <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
            Certain advanced features require connecting to secure external APIs to function. Specifically:
          </Text>
          <Text style={[styles.bullet, { color: theme.textSecondary }]}>
            • <Text style={{fontWeight: 'bold'}}>Background Eraser:</Text> Images processed through this tool are temporarily uploaded to the official Remove.bg API for AI processing. Images are not retained by us, but are subject to Remove.bg's independent privacy policy.
          </Text>
          <Text style={[styles.bullet, { color: theme.textSecondary }]}>
            • <Text style={{fontWeight: 'bold'}}>PDF Compressor:</Text> Files processed through this tool are transmitted to ConvertAPI.com using your personal API key. Files are deleted from their servers immediately after processing in accordance with their privacy policy.
          </Text>
          <Text style={[styles.bullet, { color: theme.textSecondary }]}>
            • <Text style={{fontWeight: 'bold'}}>Image to Text (OCR):</Text> Images processed for text extraction are sent to the OCR.space API. They do not store any images or extracted text on their servers.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.heading, { color: theme.textPrimary }]}>3. Data Collection & Analytics</Text>
          <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
            We do not collect, store, or sell any personal data. There are no tracking scripts, analytics SDKs, or ad networks embedded in this application. Your usage remains completely private.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.heading, { color: theme.textPrimary }]}>4. Device Permissions</Text>
          <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
            Utility Hub only requests permissions when absolutely necessary for a specific tool to function:
          </Text>
          <Text style={[styles.bullet, { color: theme.textSecondary }]}>• <Text style={{fontWeight: 'bold'}}>Camera & Gallery:</Text> For the Document Scanner, Image Compressor, and EXIF tools.</Text>
          <Text style={[styles.bullet, { color: theme.textSecondary }]}>• <Text style={{fontWeight: 'bold'}}>File System:</Text> For the Batch File Renamer and exporting generated PDFs.</Text>
          <Text style={[styles.paragraph, { color: theme.textSecondary, marginTop: spacing.s }]}>
            You can revoke these permissions at any time through your device&apos;s system settings.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.heading, { color: theme.textPrimary }]}>5. Contact & Open Source</Text>
          <Text style={[styles.paragraph, { color: theme.textSecondary }]}>
            If you have any questions regarding this privacy policy or the technical implementation of our local-first tools, please refer to the open-source repository where the entire source code is available for public audit.
          </Text>
        </View>

      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.l, paddingBottom: spacing.xxl },
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.xs,
  },
  lastUpdated: {
    fontSize: typography.sizes.s,
    marginBottom: spacing.xl,
  },
  section: {
    marginBottom: spacing.xl,
  },
  heading: {
    fontSize: typography.sizes.m,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.s,
  },
  paragraph: {
    fontSize: typography.sizes.m,
    lineHeight: 24,
  },
  bullet: {
    fontSize: typography.sizes.m,
    lineHeight: 24,
    marginLeft: spacing.m,
    marginTop: spacing.xs,
  }
});
