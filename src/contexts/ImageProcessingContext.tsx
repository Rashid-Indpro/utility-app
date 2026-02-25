import React, { createContext, useContext, useState, useCallback } from 'react';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';

interface ImageData {
  uri: string;
  width: number;
  height: number;
  size?: number;
  format?: string;
  name?: string;
}

interface ProcessingOptions {
  quality?: number;
  format?: ImageManipulator.SaveFormat;
  resize?: { width?: number; height?: number };
  compress?: boolean;
  targetSize?: number; // in KB
}

interface ProcessedImage extends ImageData {
  originalUri: string;
  processedAt: Date;
  operations: string[];
}

interface HistoryItem {
  id: string;
  thumbnail: string;
  toolUsed: string;
  dateTime: Date;
  format: string;
  originalImage: ImageData;
  processedImage: ProcessedImage;
}

interface ImageProcessingContextType {
  // Current batch
  selectedImages: ImageData[];
  processedImages: ProcessedImage[];
  isProcessing: boolean;
  progress: number;
  
  // History
  history: HistoryItem[];
  
  // Functions
  addImages: (images: ImageData[]) => void;
  removeImage: (uri: string) => void;
  clearImages: () => void;
  processImages: (options: ProcessingOptions, toolName: string) => Promise<ProcessedImage[]>;
  saveImages: (images: ProcessedImage[], customName?: string) => Promise<string[]>;
  addToHistory: (item: HistoryItem) => void;
  clearHistory: () => void;
  removeFromHistory: (id: string) => void;
  
  // Image info
  getImageInfo: (uri: string) => Promise<ImageData>;
}

const ImageProcessingContext = createContext<ImageProcessingContextType | undefined>(undefined);

export const ImageProcessingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedImages, setSelectedImages] = useState<ImageData[]>([]);
  const [processedImages, setProcessedImages] = useState<ProcessedImage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  
  const addImages = useCallback((images: ImageData[]) => {
    setSelectedImages(prev => [...prev, ...images]);
  }, []);
  
  const removeImage = useCallback((uri: string) => {
    setSelectedImages(prev => prev.filter(img => img.uri !== uri));
    setProcessedImages(prev => prev.filter(img => img.uri !== uri));
  }, []);
  
  const clearImages = useCallback(() => {
    setSelectedImages([]);
    setProcessedImages([]);
    setProgress(0);
  }, []);
  
  const getImageInfo = useCallback(async (uri: string): Promise<ImageData> => {
    try {
      const info = await FileSystem.getInfoAsync(uri);
      const { width, height } = await ImageManipulator.manipulateAsync(uri, [], { 
        format: ImageManipulator.SaveFormat.JPEG 
      });
      
      return {
        uri,
        width,
        height,
        size: info.exists ? info.size : undefined,
        name: uri.split('/').pop(),
      };
    } catch (error) {
      throw new Error(`Failed to get image info: ${error}`);
    }
  }, []);
  
  const processImages = useCallback(async (
    options: ProcessingOptions, 
    toolName: string
  ): Promise<ProcessedImage[]> => {
    setIsProcessing(true);
    setProgress(0);
    
    const results: ProcessedImage[] = [];
    const operations: string[] = [];
    
    try {
      for (let i = 0; i < selectedImages.length; i++) {
        const image = selectedImages[i];
        setProgress((i / selectedImages.length) * 100);
        
        let manipulatorOptions: ImageManipulator.Action[] = [];
        
        // Add resize if specified
        if (options.resize) {
          manipulatorOptions.push({
            resize: {
              width: options.resize.width,
              height: options.resize.height,
            },
          });
          operations.push('resize');
        }
        
        // Process the image
        const result = await ImageManipulator.manipulateAsync(
          image.uri,
          manipulatorOptions,
          {
            compress: options.quality || 1,
            format: options.format || ImageManipulator.SaveFormat.JPEG,
          }
        );
        
        const processedImage: ProcessedImage = {
          ...result,
          originalUri: image.uri,
          processedAt: new Date(),
          operations,
          name: image.name,
        };
        
        results.push(processedImage);
      }
      
      setProcessedImages(results);
      setProgress(100);
      
      return results;
    } catch (error) {
      throw new Error(`Processing failed: ${error}`);
    } finally {
      setIsProcessing(false);
    }
  }, [selectedImages]);
  
  const saveImages = useCallback(async (
    images: ProcessedImage[], 
    customName?: string
  ): Promise<string[]> => {
    const savedPaths: string[] = [];
    
    try {
      // Request permissions
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Media library permissions not granted');
      }
      
      for (const image of images) {
        const fileName = customName || `pixozen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const asset = await MediaLibrary.createAssetAsync(image.uri);
        savedPaths.push(asset.uri);
      }
      
      return savedPaths;
    } catch (error) {
      throw new Error(`Save failed: ${error}`);
    }
  }, []);
  
  const addToHistory = useCallback((item: HistoryItem) => {
    setHistory(prev => {
      const newHistory = [item, ...prev];
      // Keep only last 20 items
      return newHistory.slice(0, 20);
    });
  }, []);
  
  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);
  
  const removeFromHistory = useCallback((id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  }, []);
  
  const value: ImageProcessingContextType = {
    selectedImages,
    processedImages,
    isProcessing,
    progress,
    history,
    addImages,
    removeImage,
    clearImages,
    processImages,
    saveImages,
    addToHistory,
    clearHistory,
    removeFromHistory,
    getImageInfo,
  };
  
  return (
    <ImageProcessingContext.Provider value={value}>
      {children}
    </ImageProcessingContext.Provider>
  );
};

export const useImageProcessing = (): ImageProcessingContextType => {
  const context = useContext(ImageProcessingContext);
  if (!context) {
    throw new Error('useImageProcessing must be used within an ImageProcessingProvider');
  }
  return context;
};