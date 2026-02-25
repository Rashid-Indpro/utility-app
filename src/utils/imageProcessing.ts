import * as ImageManipulator from 'expo-image-manipulator';
import { getInfoAsync } from 'expo-file-system/legacy';

export interface ImageInfo {
  uri: string;
  width: number;
  height: number;
  size?: number;
  format?: string;
  name?: string;
}

export interface ProcessingOptions {
  quality?: number;
  format?: ImageManipulator.SaveFormat;
  resize?: {
    width?: number;
    height?: number;
    mode?: 'contain' | 'cover' | 'stretch';
  };
  crop?: {
    originX: number;
    originY: number;
    width: number;
    height: number;
  };
  rotate?: number;
  flip?: 'horizontal' | 'vertical';
}

export interface ProcessedResult {
  uri: string;
  width: number;
  height: number;
  originalSize?: number;
  processedSize?: number;
  compressionRatio?: number;
}

/**
 * Get detailed information about an image
 */
export const getImageInfo = async (uri: string): Promise<ImageInfo> => {
  try {
    let fileSize: number | undefined;
    
    try {
      const fileInfo = await getInfoAsync(uri);
      if (fileInfo.exists && 'size' in fileInfo) {
        fileSize = fileInfo.size;
      }
    } catch (e) {
      console.warn('Could not get file size:', e);
    }
    
    // Get image dimensions using ImageManipulator
    const manipulatorResult = await ImageManipulator.manipulateAsync(
      uri,
      [],
      { format: ImageManipulator.SaveFormat.JPEG }
    );
    
    const fileName = uri.split('/').pop() || 'unknown';
    const fileExtension = fileName.split('.').pop()?.toLowerCase();
    
    return {
      uri,
      width: manipulatorResult.width,
      height: manipulatorResult.height,
      size: fileSize,
      format: fileExtension,
      name: fileName,
    };
  } catch (error) {
    throw new Error(`Failed to get image info: ${error}`);
  }
};

/**
 * Calculate optimal dimensions while maintaining aspect ratio
 */
export const calculateOptimalDimensions = (
  originalWidth: number,
  originalHeight: number,
  targetWidth?: number,
  targetHeight?: number,
  maintainAspectRatio: boolean = true
): { width: number; height: number } => {
  if (!maintainAspectRatio) {
    return {
      width: targetWidth || originalWidth,
      height: targetHeight || originalHeight,
    };
  }
  
  const aspectRatio = originalWidth / originalHeight;
  
  if (targetWidth && targetHeight) {
    // Both dimensions specified - fit to smaller constraint
    const widthRatio = targetWidth / originalWidth;
    const heightRatio = targetHeight / originalHeight;
    const ratio = Math.min(widthRatio, heightRatio);
    
    return {
      width: Math.round(originalWidth * ratio),
      height: Math.round(originalHeight * ratio),
    };
  } else if (targetWidth) {
    return {
      width: targetWidth,
      height: Math.round(targetWidth / aspectRatio),
    };
  } else if (targetHeight) {
    return {
      width: Math.round(targetHeight * aspectRatio),
      height: targetHeight,
    };
  }
  
  return { width: originalWidth, height: originalHeight };
};

/**
 * Compress image to target file size
 */
export const compressToTargetSize = async (
  uri: string,
  targetSizeKB: number,
  maxIterations: number = 10
): Promise<ProcessedResult> => {
  let currentUri = uri;
  let currentQuality = 0.8;
  let iterations = 0;
  let lastResult: ImageManipulator.ImageResult;
  
  const originalInfo = await getImageInfo(uri);
  const originalSizeKB = (originalInfo.size || 0) / 1024;
  
  while (iterations < maxIterations) {
    const result = await ImageManipulator.manipulateAsync(
      currentUri,
      [],
      {
        compress: currentQuality,
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );
    
    lastResult = result;
    let currentSizeKB = 0;
    try {
      const fileInfo = await getInfoAsync(result.uri);
      if (fileInfo.exists && 'size' in fileInfo) {
        currentSizeKB = (fileInfo.size || 0) / 1024;
      }
    } catch (e) {
      console.warn('Could not get file size:', e);
      break; // Exit loop if we can't get size
    }
    
    if (currentSizeKB <= targetSizeKB || currentQuality <= 0.1) {
      return {
        uri: result.uri,
        width: result.width,
        height: result.height,
        originalSize: originalInfo.size,
        processedSize: currentSizeKB * 1024,
        compressionRatio: originalSizeKB / currentSizeKB,
      };
    }
    
    // Adjust quality for next iteration
    const ratio = targetSizeKB / currentSizeKB;
    currentQuality = Math.max(0.1, currentQuality * ratio * 0.9);
    currentUri = result.uri;
    iterations++;
  }
  
  let finalSize = 0;
  try {
    const fileInfo = await getInfoAsync(lastResult!.uri);
    if (fileInfo.exists && 'size' in fileInfo) {
      finalSize = fileInfo.size || 0;
    }
  } catch (e) {
    console.warn('Could not get final file size:', e);
  }
  
  return {
    uri: lastResult!.uri,
    width: lastResult!.width,
    height: lastResult!.height,
    originalSize: originalInfo.size,
    processedSize: finalSize,
    compressionRatio: originalSizeKB / (finalSize / 1024 || 1),
  };
};

/**
 * Process image with given options
 */
export const processImage = async (
  uri: string,
  options: ProcessingOptions
): Promise<ProcessedResult> => {
  try {
    const originalInfo = await getImageInfo(uri);
    const actions: ImageManipulator.Action[] = [];
    
    // Add crop action
    if (options.crop) {
      actions.push({
        crop: options.crop,
      });
    }
    
    // Add resize action
    if (options.resize) {
      const { width, height } = calculateOptimalDimensions(
        originalInfo.width,
        originalInfo.height,
        options.resize.width,
        options.resize.height,
        true
      );
      
      actions.push({
        resize: { width, height },
      });
    }
    
    // Add rotation action
    if (options.rotate) {
      actions.push({
        rotate: options.rotate,
      });
    }
    
    // Add flip action
    if (options.flip) {
      actions.push({
        flip: options.flip === 'horizontal' 
          ? ImageManipulator.FlipType.Horizontal 
          : ImageManipulator.FlipType.Vertical
      });
    }
    
    // Process the image
    const result = await ImageManipulator.manipulateAsync(
      uri,
      actions,
      {
        compress: options.quality || 0.8,
        format: options.format || ImageManipulator.SaveFormat.JPEG,
      }
    );
    
    let processedSize = 0;
    try {
      const processedInfo = await getInfoAsync(result.uri);
      if (processedInfo.exists && 'size' in processedInfo) {
        processedSize = processedInfo.size || 0;
      }
    } catch (e) {
      console.warn('Could not get processed file size:', e);
    }
    
    return {
      uri: result.uri,
      width: result.width,
      height: result.height,
      originalSize: originalInfo.size,
      processedSize,
      compressionRatio: originalInfo.size ? (originalInfo.size / (processedSize || 1)) : 1,
    };
  } catch (error) {
    throw new Error(`Image processing failed: ${error}`);
  }
};

/**
 * Batch process multiple images
 */
export const batchProcessImages = async (
  uris: string[],
  options: ProcessingOptions,
  onProgress?: (completed: number, total: number) => void
): Promise<ProcessedResult[]> => {
  const results: ProcessedResult[] = [];
  
  for (let i = 0; i < uris.length; i++) {
    try {
      const result = await processImage(uris[i], options);
      results.push(result);
      
      if (onProgress) {
        onProgress(i + 1, uris.length);
      }
    } catch (error) {
      console.error(`Failed to process image ${i + 1}:`, error);
      // Continue with other images
    }
  }
  
  return results;
};

/**
 * Get common aspect ratios
 */
export const COMMON_ASPECT_RATIOS = {
  '1:1': { width: 1, height: 1, label: 'Square' },
  '4:3': { width: 4, height: 3, label: 'Standard' },
  '3:4': { width: 3, height: 4, label: 'Portrait' },
  '16:9': { width: 16, height: 9, label: 'Widescreen' },
  '9:16': { width: 9, height: 16, label: 'Story' },
  '3:2': { width: 3, height: 2, label: 'Photo' },
  '2:3': { width: 2, height: 3, label: 'Photo Portrait' },
};

/**
 * Get social media preset sizes
 */
export const SOCIAL_MEDIA_PRESETS = {
  instagram: {
    post: { width: 1080, height: 1080, label: 'Instagram Post' },
    story: { width: 1080, height: 1920, label: 'Instagram Story' },
    reel: { width: 1080, height: 1920, label: 'Instagram Reel' },
  },
  facebook: {
    post: { width: 1200, height: 630, label: 'Facebook Post' },
    cover: { width: 820, height: 312, label: 'Facebook Cover' },
  },
  twitter: {
    post: { width: 1200, height: 675, label: 'Twitter Post' },
    header: { width: 1500, height: 500, label: 'Twitter Header' },
  },
  youtube: {
    thumbnail: { width: 1280, height: 720, label: 'YouTube Thumbnail' },
    banner: { width: 2560, height: 1440, label: 'YouTube Banner' },
  },
};

/**
 * Get developer/web preset sizes
 */
export const DEVELOPER_PRESETS = {
  web: {
    favicon: { width: 32, height: 32, label: 'Favicon' },
    icon: { width: 192, height: 192, label: 'Web App Icon' },
    thumbnail: { width: 300, height: 200, label: 'Thumbnail' },
  },
  mobile: {
    icon: { width: 512, height: 512, label: 'App Icon' },
    splash: { width: 1080, height: 1920, label: 'Splash Screen' },
  },
  screen: {
    fhd: { width: 1920, height: 1080, label: 'Full HD' },
    '4k': { width: 3840, height: 2160, label: '4K Ultra HD' },
    mobile: { width: 375, height: 667, label: 'Mobile Screen' },
  },
};