import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

// Conditionally import native modules for mobile platforms
let zip: any = null;
if (Platform.OS !== 'web') {
  try {
    const zipArchive = require('react-native-zip-archive');
    zip = zipArchive.zip;
  } catch (e) {
    console.warn('react-native-zip-archive not available');
  }
}

export interface PickedImage {
  uri: string;
  width?: number;
  height?: number;
  size?: number;
  fileName?: string;
  type?: string;
}

export interface SaveOptions {
  fileName?: string;
  albumName?: string;
  overwrite?: boolean;
  createZip?: boolean;
}

/**
 * Request necessary permissions
 */
export const requestPermissions = async (): Promise<boolean> => {
  try {
    // Request media library permissions
    const mediaLibraryPermission = await MediaLibrary.requestPermissionsAsync();
    if (mediaLibraryPermission.status !== 'granted') {
      return false;
    }
    
    // Request camera permissions (for camera access)
    const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
    if (cameraPermission.status !== 'granted') {
      console.warn('Camera permission not granted');
      // Don't return false as we can still use gallery
    }
    
    return true;
  } catch (error) {
    console.error('Error requesting permissions:', error);
    return false;
  }
};

/**
 * Pick single image from gallery
 */
export const pickSingleImage = async (): Promise<PickedImage | null> => {
  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
      allowsMultipleSelection: false,
    });
    
    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }
    
    const asset = result.assets[0];
    return {
      uri: asset.uri,
      width: asset.width,
      height: asset.height,
      fileName: asset.fileName || undefined,
      type: asset.type,
    };
  } catch (error) {
    throw new Error(`Failed to pick image: ${error}`);
  }
};

/**
 * Pick multiple images from gallery
 */
export const pickMultipleImages = async (): Promise<PickedImage[]> => {
  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
      allowsMultipleSelection: true,
      selectionLimit: 50, // Limit as per requirements
    });
    
    if (result.canceled || !result.assets) {
      return [];
    }
    
    return result.assets.map(asset => ({
      uri: asset.uri,
      width: asset.width,
      height: asset.height,
      fileName: asset.fileName || undefined,
      type: asset.type,
    }));
  } catch (error) {
    throw new Error(`Failed to pick images: ${error}`);
  }
};

/**
 * Take photo with camera
 */
export const takePhoto = async (): Promise<PickedImage | null> => {
  try {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });
    
    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }
    
    const asset = result.assets[0];
    return {
      uri: asset.uri,
      width: asset.width,
      height: asset.height,
      type: asset.type,
    };
  } catch (error) {
    throw new Error(`Failed to take photo: ${error}`);
  }
};

/**
 * Pick images using document picker (alternative method)
 */
export const pickImagesWithDocumentPicker = async (): Promise<PickedImage[]> => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'image/*',
      multiple: true,
      copyToCacheDirectory: true,
    });
    
    if (result.canceled) {
      return [];
    }
    
    if (Array.isArray(result.assets)) {
      return result.assets.map(asset => ({
        uri: asset.uri,
        fileName: asset.name,
        size: asset.size || undefined,
      }));
    } else {
      return [{
        uri: result.assets.uri,
        fileName: result.assets.name,
        size: result.assets.size || undefined,
      }];
    }
  } catch (error) {
    throw new Error(`Failed to pick files: ${error}`);
  }
};

/**
 * Save single image to device
 */
export const saveImageToDevice = async (
  uri: string,
  options: SaveOptions = {}
): Promise<string> => {
  try {
    // Check if sharing is available (iOS files app, Android downloads)
    const isAvailable = await Sharing.isAvailableAsync();
    
    if (isAvailable) {
      // Use sharing for user to choose location
      await Sharing.shareAsync(uri, {
        mimeType: 'image/jpeg',
        dialogTitle: 'Save Image',
      });
      return uri;
    } else {
      // Fallback to media library
      const asset = await MediaLibrary.createAssetAsync(uri);
      
      if (options.albumName) {
        let album = await MediaLibrary.getAlbumAsync(options.albumName);
        if (!album) {
          album = await MediaLibrary.createAlbumAsync(options.albumName, asset);
        } else {
          await MediaLibrary.addAssetsToAlbumAsync([asset], album);
        }
      }
      
      return asset.uri;
    }
  } catch (error) {
    throw new Error(`Failed to save image: ${error}`);
  }
};

/**
 * Save multiple images to device
 */
export const saveMultipleImages = async (
  uris: string[],
  options: SaveOptions = {}
): Promise<string[]> => {
  const savedPaths: string[] = [];
  
  try {
    for (const uri of uris) {
      const savedPath = await saveImageToDevice(uri, options);
      savedPaths.push(savedPath);
    }
    
    return savedPaths;
  } catch (error) {
    throw new Error(`Failed to save images: ${error}`);
  }
};

/**
 * Generate unique filename
 */
export const generateFileName = (
  prefix: string = 'pixozen',
  extension: string = 'jpg'
): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return `${prefix}_${timestamp}_${random}.${extension}`;
};

/**
 * Get file size in human readable format
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Get image format from URI
 */
export const getImageFormat = (uri: string): string => {
  const extension = uri.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'jpg':
    case 'jpeg':
      return 'JPEG';
    case 'png':
      return 'PNG';
    case 'webp':
      return 'WEBP';
    default:
      return 'Unknown';
  }
};

/**
 * Clean up temporary files
 */
export const cleanupTempFiles = async (): Promise<void> => {
  try {
    const documentDir = FileSystem.documentDirectory;
    if (!documentDir) return;
    
    const files = await FileSystem.readDirectoryAsync(documentDir);
    const tempFiles = files.filter(file => file.startsWith('temp_'));
    
    for (const tempFile of tempFiles) {
      const fullPath = `${documentDir}${tempFile}`;
      const info = await FileSystem.getInfoAsync(fullPath);
      
      if (info.exists) {
        if (info.isDirectory) {
          // Check if directory is older than 1 hour
          const now = Date.now();
          const oneHour = 60 * 60 * 1000;
          if (now - info.modificationTime > oneHour) {
            await FileSystem.deleteAsync(fullPath);
          }
        }
      }
    }
  } catch (error) {
    console.warn('Failed to cleanup temp files:', error);
  }
};

/**
 * Create a ZIP file from multiple image files
 */
export const createZipFile = async (
  imagePaths: string[],
  zipName: string
): Promise<string> => {
  try {
    const documentDir = FileSystem.documentDirectory;
    if (!documentDir) {
      throw new Error('Document directory not available');
    }
    
    // Create a temporary directory for the ZIP contents
    const tempDir = `${documentDir}temp_zip_${Date.now()}/`;
    await FileSystem.makeDirectoryAsync(tempDir, { intermediates: true });
    
    // Copy images to temp directory with proper names
    const copiedFiles: string[] = [];
    
    for (let i = 0; i < imagePaths.length; i++) {
      const imagePath = imagePaths[i];
      const fileInfo = await FileSystem.getInfoAsync(imagePath);
      
      if (fileInfo.exists) {
        // Extract file extension
        const extension = imagePath.split('.').pop() || 'jpg';
        const fileName = `image_${(i + 1).toString().padStart(3, '0')}.${extension}`;
        const destPath = `${tempDir}${fileName}`;
        
        await FileSystem.copyAsync({
          from: imagePath,
          to: destPath,
        });
        
        copiedFiles.push(destPath);
      }
    }
    
    if (copiedFiles.length === 0) {
      throw new Error('No valid images to zip');
    }
    
    // Create ZIP file
    const zipPath = `${documentDir}${zipName}.zip`;
    
    // Remove existing zip file if it exists
    const zipInfo = await FileSystem.getInfoAsync(zipPath);
    if (zipInfo.exists) {
      await FileSystem.deleteAsync(zipPath);
    }
    
    // Create the ZIP archive (only available on native platforms)
    if (zip && Platform.OS !== 'web') {
      await zip(tempDir, zipPath);
      
      // Clean up temporary directory
      await FileSystem.deleteAsync(tempDir);
      
      return zipPath;
    } else {
      // Web fallback: return the temporary directory for sharing
      console.warn('ZIP creation not available on web platform');
      return tempDir; // Return directory path for web sharing
    }
    
  } catch (error) {
    console.error('Error creating ZIP file:', error);
    throw error;
  }
};