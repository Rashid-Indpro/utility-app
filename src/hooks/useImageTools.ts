import { useState, useCallback } from 'react';
import {
  pickSingleImage,
  pickMultipleImages,
  takePhoto,
  requestPermissions,
  saveImageToDevice,
  saveMultipleImages,
  type PickedImage,
  type SaveOptions,
} from '@/utils/fileManager';
import {
  processImage,
  batchProcessImages,
  compressToTargetSize,
  getImageInfo,
  type ProcessingOptions,
  type ProcessedResult,
  type ImageInfo,
} from '@/utils/imageProcessing';

export interface UseImagePickerResult {
  pickImage: () => Promise<PickedImage | null>;
  pickImages: () => Promise<PickedImage[]>;
  takePhoto: () => Promise<PickedImage | null>;
  isLoading: boolean;
  error: string | null;
}

export interface UseImageProcessorResult {
  processImage: (uri: string, options: ProcessingOptions) => Promise<ProcessedResult>;
  batchProcess: (uris: string[], options: ProcessingOptions) => Promise<ProcessedResult[]>;
  compressImage: (uri: string, targetKB: number) => Promise<ProcessedResult>;
  getImageInfo: (uri: string) => Promise<ImageInfo>;
  isProcessing: boolean;
  progress: number;
  error: string | null;
}

export interface UseImageSaverResult {
  saveOne: (uri: string, options?: SaveOptions) => Promise<string>;
  saveMany: (uris: string[], options?: SaveOptions) => Promise<string[]>;
  isSaving: boolean;
  error: string | null;
}

/**
 * Hook for image picking operations
 */
export const useImagePicker = (): UseImagePickerResult => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const pickImage = useCallback(async (): Promise<PickedImage | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const hasPermissions = await requestPermissions();
      if (!hasPermissions) {
        throw new Error('Permissions not granted');
      }
      
      const result = await pickSingleImage();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to pick image';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const pickImages = useCallback(async (): Promise<PickedImage[]> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const hasPermissions = await requestPermissions();
      if (!hasPermissions) {
        throw new Error('Permissions not granted');
      }
      
      const results = await pickMultipleImages();
      return results;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to pick images';
      setError(errorMessage);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const takePhotoCallback = useCallback(async (): Promise<PickedImage | null> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const hasPermissions = await requestPermissions();
      if (!hasPermissions) {
        throw new Error('Camera permission not granted');
      }
      
      const result = await takePhoto();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to take photo';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  return {
    pickImage,
    pickImages,
    takePhoto: takePhotoCallback,
    isLoading,
    error,
  };
};

/**
 * Hook for image processing operations
 */
export const useImageProcessor = (): UseImageProcessorResult => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  const processImageCallback = useCallback(async (
    uri: string,
    options: ProcessingOptions
  ): Promise<ProcessedResult> => {
    setIsProcessing(true);
    setError(null);
    setProgress(0);
    
    try {
      const result = await processImage(uri, options);
      setProgress(100);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process image';
      setError(errorMessage);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, []);
  
  const batchProcess = useCallback(async (
    uris: string[],
    options: ProcessingOptions
  ): Promise<ProcessedResult[]> => {
    setIsProcessing(true);
    setError(null);
    setProgress(0);
    
    try {
      const results = await batchProcessImages(
        uris,
        options,
        (completed, total) => {
          setProgress((completed / total) * 100);
        }
      );
      return results;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process images';
      setError(errorMessage);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, []);
  
  const compressImage = useCallback(async (
    uri: string,
    targetKB: number
  ): Promise<ProcessedResult> => {
    setIsProcessing(true);
    setError(null);
    setProgress(0);
    
    try {
      const result = await compressToTargetSize(uri, targetKB);
      setProgress(100);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to compress image';
      setError(errorMessage);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, []);
  
  const getImageInfoCallback = useCallback(async (uri: string): Promise<ImageInfo> => {
    setError(null);
    
    try {
      const info = await getImageInfo(uri);
      return info;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get image info';
      setError(errorMessage);
      throw err;
    }
  }, []);
  
  return {
    processImage: processImageCallback,
    batchProcess,
    compressImage,
    getImageInfo: getImageInfoCallback,
    isProcessing,
    progress,
    error,
  };
};

/**
 * Hook for image saving operations
 */
export const useImageSaver = (): UseImageSaverResult => {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const saveOne = useCallback(async (
    uri: string,
    options: SaveOptions = {}
  ): Promise<string> => {
    setIsSaving(true);
    setError(null);
    
    try {
      const result = await saveImageToDevice(uri, options);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save image';
      setError(errorMessage);
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, []);
  
  const saveMany = useCallback(async (
    uris: string[],
    options: SaveOptions = {}
  ): Promise<string[]> => {
    setIsSaving(true);
    setError(null);
    
    try {
      const results = await saveMultipleImages(uris, options);
      return results;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save images';
      setError(errorMessage);
      throw err;
    } finally {
      setIsSaving(false);
    }
  }, []);
  
  return {
    saveOne,
    saveMany,
    isSaving,
    error,
  };
};

/**
 * Combined hook for all image operations
 */
export const useImageTools = () => {
  const picker = useImagePicker();
  const processor = useImageProcessor();
  const saver = useImageSaver();
  
  return {
    picker,
    processor,
    saver,
    isLoading: picker.isLoading || processor.isProcessing || saver.isSaving,
    hasError: !!(picker.error || processor.error || saver.error),
    errors: {
      picker: picker.error,
      processor: processor.error,
      saver: saver.error,
    },
  };
};