import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Alert, Platform } from 'react-native';
import { useAppStore } from '../store/useAppStore';

export const shareFile = async (uri: string, mimeType: string, dialogTitle: string) => {
  if (Platform.OS === 'web') {
    alert('Sharing is limited on Web.');
    return;
  }
  const isAvailable = await Sharing.isAvailableAsync();
  if (isAvailable) {
    await Sharing.shareAsync(uri, { mimeType, dialogTitle });
  } else {
    alert('Sharing not available on this device');
  }
};

export const saveToDevice = async (uri: string, filename: string, mimeType: string, category: string) => {
  if (Platform.OS === 'web') {
    alert('On web, right click or long-press the output to save.');
    return;
  }

  try {
    // iOS doesn't expose the filesystem arbitrarily, so we defer to the native share sheet
    if (Platform.OS === 'ios') {
      Alert.alert('Save to Files', 'Please select "Save to Files" in the menu that appears.', [
        { text: 'OK', onPress: () => shareFile(uri, mimeType, 'Save File') }
      ]);
      return;
    }

    // Android Storage Access Framework workflow
    const { exportDirectoryUri, setExportDirectoryUri } = useAppStore.getState();
    let rootUri = exportDirectoryUri;

    if (!rootUri) {
      Alert.alert(
        'Select Export Folder',
        'Due to Android security, you cannot select the root Downloads folder directly. Please CREATE a new folder (e.g., "Utility Hub") and select it.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Select Folder', onPress: async () => {
              const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();
              if (permissions.granted) {
                setExportDirectoryUri(permissions.directoryUri);
                await processAndroidSave(uri, filename, mimeType, category, permissions.directoryUri);
              }
            }
          }
        ]
      );
    } else {
      await processAndroidSave(uri, filename, mimeType, category, rootUri);
    }
  } catch (error) {
    console.error(error);
    alert('Failed to save file.');
  }
};

const processAndroidSave = async (uri: string, filename: string, mimeType: string, category: string, rootUri: string) => {
  try {
    const { StorageAccessFramework } = FileSystem;

    // Ensure Category folder exists inside the chosen root folder
    let categoryUri = '';
    const rootFiles = await StorageAccessFramework.readDirectoryAsync(rootUri);
    const existingCat = rootFiles.find(f => f.endsWith('%2F' + encodeURIComponent(category)));

    if (existingCat) {
      categoryUri = existingCat;
    } else {
      categoryUri = await StorageAccessFramework.makeDirectoryAsync(rootUri, category);
    }

    // Format the filename with prefix
    const prefix = category.replace(/ /g, '_');

    // Ensure no double extension if we passed one, but we'll just prepend the prefix
    // Also remove Date.now() pattern if it sneaked in:
    let cleanFilename = filename.replace(/_[0-9]{13}/, '');
    let formattedFilename = `${prefix}_${cleanFilename}`;

    // Create final file. Android SAF will automatically append (1), (2) if it already exists.
    const newFileUri = await StorageAccessFramework.createFileAsync(categoryUri, formattedFilename, mimeType);

    // Copy data
    const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
    await FileSystem.writeAsStringAsync(newFileUri, base64, { encoding: 'base64' });

    Alert.alert('Saved Successfully!', `File saved to:\nUtility Hub / ${category} / ${filename}`);

  } catch (err) {
    console.error(err);
    useAppStore.getState().setExportDirectoryUri(null); // Reset if permissions revoked
    Alert.alert('Error', 'Storage permission was lost or folder missing. Please try again.');
  }
};
