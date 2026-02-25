import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  Alert,
  ActivityIndicator,
  PanResponder,
  GestureResponderEvent,
  PanResponderGestureState,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import * as MediaLibrary from 'expo-media-library';

import { Text } from '../Text';
import { Card } from '../Card';
import { Button } from '../Button';
import { useTheme } from '../../contexts/ThemeContext';
import { useImageProcessor } from '../../hooks/useImageTools';
import {
  COMMON_ASPECT_RATIOS,
  SOCIAL_MEDIA_PRESETS,
  DEVELOPER_PRESETS,
  type ProcessingOptions,
} from '../../utils/imageProcessing';
import { Colors, Spacing, BorderRadius } from '../../constants/theme';
import type { ToolProps } from './types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PREVIEW_SIZE = SCREEN_WIDTH - (Spacing.base * 4);

interface AspectRatio {
  width: number;
  height: number;
  label: string;
}

interface Preset {
  width: number;
  height: number;
  label: string;
}

const CropTool: React.FC<ToolProps> = ({ selectedImages, onImagesChange }) => {
  const { colors } = useTheme();
  const { processImage, isProcessing, progress } = useImageProcessor();
  
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<Preset | null>(null);
  const [cropSettings, setCropSettings] = useState({
    rotation: 0,
    flipHorizontal: false,
    flipVertical: false,
  });
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [processedUri, setProcessedUri] = useState<string | null>(null);
  
  // Manual crop box state
  const [manualCropEnabled, setManualCropEnabled] = useState(false);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [cropBox, setCropBox] = useState({ x: 50, y: 50, width: 200, height: 200 });
  const [isDragging, setIsDragging] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  
  // Refs for gesture handling - prevent PanResponder recreation
  const cropBoxRef = useRef({ x: 50, y: 50, width: 200, height: 200 });
  const activeHandleRef = useRef<'move' | 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w' | null>(null);
  const initialCropBoxRef = useRef({ x: 50, y: 50, width: 200, height: 200 });
  
  // Sync ref with state
  useEffect(() => {
    cropBoxRef.current = cropBox;
  }, [cropBox]);
  
  const currentImage = selectedImages[currentImageIndex];
  const displayImage = processedUri || currentImage;
  
  const aspectRatios = Object.entries(COMMON_ASPECT_RATIOS).map(([key, value]) => ({
    key,
    ...value,
  }));
  
  // Load tutorial preference
  useEffect(() => {
    const checkTutorial = async () => {
      try {
        const hasSeenTutorial = await AsyncStorage.getItem('hasSeenManualCropTutorial');
        if (!hasSeenTutorial && manualCropEnabled) {
          setShowTutorial(true);
          // Auto-hide after 4 seconds
          setTimeout(async () => {
            setShowTutorial(false);
            await AsyncStorage.setItem('hasSeenManualCropTutorial', 'true');
          }, 4000);
        }
      } catch (error) {
        console.error('Error checking tutorial state:', error);
      }
    };
    
    checkTutorial();
  }, [manualCropEnabled]);
  
  // Reset processed image when settings change
  useEffect(() => {
    setProcessedUri(null);
  }, [selectedAspectRatio, selectedPreset, cropSettings, currentImageIndex]);
  
  // Load image dimensions for manual crop
  useEffect(() => {
    if (currentImage && manualCropEnabled) {
      Image.getSize(
        currentImage,
        (width, height) => {
          setImageDimensions({ width, height });
          // Initialize crop box to center with default size (70% of preview)
          const boxSize = Math.min(PREVIEW_SIZE * 0.7, PREVIEW_SIZE * 0.7);
          const initialBox = {
            x: (PREVIEW_SIZE - boxSize) / 2,
            y: (PREVIEW_SIZE - boxSize) / 2,
            width: boxSize,
            height: boxSize,
          };
          setCropBox(initialBox);
          cropBoxRef.current = initialBox;
          initialCropBoxRef.current = initialBox;
        },
        (error) => console.error('Failed to get image size:', error)
      );
    }
  }, [currentImage, manualCropEnabled]);
  
  const socialPresets = Object.entries(SOCIAL_MEDIA_PRESETS).flatMap(([platform, presets]) =>
    Object.entries(presets).map(([key, preset]) => ({
      key: `${platform}_${key}`,
      platform,
      ...preset,
    }))
  );
  
  const developerPresets = Object.entries(DEVELOPER_PRESETS).flatMap(([category, presets]) =>
    Object.entries(presets).map(([key, preset]) => ({
      key: `${category}_${key}`,
      category,
      ...preset,
    }))
  );
  
  const handleAspectRatioSelect = (ratio: AspectRatio, key: string) => {
    setSelectedAspectRatio(key);
    setSelectedPreset(null);
    setManualCropEnabled(false);
  };
  
  const handlePresetSelect = (preset: Preset) => {
    setSelectedPreset(preset);
    setSelectedAspectRatio(null);
    setManualCropEnabled(false);
  };
  
  const handleManualCropToggle = () => {
    const newState = !manualCropEnabled;
    setManualCropEnabled(newState);
    if (newState) {
      setSelectedAspectRatio(null);
      setSelectedPreset(null);
    }
  };
  
  const showHelpTutorial = () => {
    setShowTutorial(true);
    setTimeout(() => {
      setShowTutorial(false);
    }, 4000);
  };
  
  // PanResponder for dragging crop box
  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => manualCropEnabled,
    onMoveShouldSetPanResponder: () => manualCropEnabled,
    onPanResponderGrant: (evt) => {
      setIsDragging(true);
      setShowTutorial(false); // Hide tutorial when user starts dragging
      
      // Mark tutorial as seen
      AsyncStorage.setItem('hasSeenManualCropTutorial', 'true').catch(err => 
        console.error('Error saving tutorial state:', err)
      );
      
      // Store initial position from current ref value
      initialCropBoxRef.current = { ...cropBoxRef.current };
      
      const touch = evt.nativeEvent;
      const touchX = touch.locationX;
      const touchY = touch.locationY;
      
      const cornerSize = 60; // Touch area for corners - larger for easier grabbing
      const edgeSize = 40; // Touch area for edges
      const { x, y, width, height } = cropBoxRef.current;
      
      // Check corners first (they have priority)
      if (Math.abs(touchX - x) < cornerSize && Math.abs(touchY - y) < cornerSize) {
        activeHandleRef.current = 'nw';
      } else if (Math.abs(touchX - (x + width)) < cornerSize && Math.abs(touchY - y) < cornerSize) {
        activeHandleRef.current = 'ne';
      } else if (Math.abs(touchX - x) < cornerSize && Math.abs(touchY - (y + height)) < cornerSize) {
        activeHandleRef.current = 'sw';
      } else if (Math.abs(touchX - (x + width)) < cornerSize && Math.abs(touchY - (y + height)) < cornerSize) {
        activeHandleRef.current = 'se';
      }
      // Then check edges
      else if (touchX >= x && touchX <= x + width && Math.abs(touchY - y) < edgeSize) {
        activeHandleRef.current = 'n'; // Top edge
      } else if (touchX >= x && touchX <= x + width && Math.abs(touchY - (y + height)) < edgeSize) {
        activeHandleRef.current = 's'; // Bottom edge
      } else if (touchY >= y && touchY <= y + height && Math.abs(touchX - x) < edgeSize) {
        activeHandleRef.current = 'w'; // Left edge
      } else if (touchY >= y && touchY <= y + height && Math.abs(touchX - (x + width)) < edgeSize) {
        activeHandleRef.current = 'e'; // Right edge
      }
      // Finally check if touch is inside box for moving
      else if (touchX >= x && touchX <= x + width && touchY >= y && touchY <= y + height) {
        activeHandleRef.current = 'move';
      } else {
        activeHandleRef.current = null;
      }
    },
    onPanResponderMove: (evt, gestureState) => {
      if (!activeHandleRef.current) return;
      
      const { dx, dy } = gestureState;
      const minSize = 50; // Smaller minimum for easier testing
      const maxSize = PREVIEW_SIZE;
      const initial = initialCropBoxRef.current;
      
      let newBox: { x: number; y: number; width: number; height: number };
      
      if (activeHandleRef.current === 'move') {
        // Move entire box
        newBox = {
          x: Math.max(0, Math.min(maxSize - initial.width, initial.x + dx)),
          y: Math.max(0, Math.min(maxSize - initial.height, initial.y + dy)),
          width: initial.width,
          height: initial.height,
        };
      } else if (activeHandleRef.current === 'nw') {
        // Resize from top-left
        let newWidth = initial.width - dx;
        let newHeight = initial.height - dy;
        let newX = initial.x + dx;
        let newY = initial.y + dy;
        
        if (newWidth < minSize) {
          newWidth = minSize;
          newX = initial.x + initial.width - minSize;
        }
        if (newHeight < minSize) {
          newHeight = minSize;
          newY = initial.y + initial.height - minSize;
        }
        if (newX < 0) {
          newWidth = initial.width + initial.x;
          newX = 0;
        }
        if (newY < 0) {
          newHeight = initial.height + initial.y;
          newY = 0;
        }
        
        newBox = { x: newX, y: newY, width: newWidth, height: newHeight };
      } else if (activeHandleRef.current === 'ne') {
        // Resize from top-right
        let newWidth = initial.width + dx;
        let newHeight = initial.height - dy;
        let newY = initial.y + dy;
        
        if (newWidth < minSize) newWidth = minSize;
        if (newHeight < minSize) {
          newHeight = minSize;
          newY = initial.y + initial.height - minSize;
        }
        if (initial.x + newWidth > maxSize) {
          newWidth = maxSize - initial.x;
        }
        if (newY < 0) {
          newHeight = initial.height + initial.y;
          newY = 0;
        }
        
        newBox = { x: initial.x, y: newY, width: newWidth, height: newHeight };
      } else if (activeHandleRef.current === 'sw') {
        // Resize from bottom-left
        let newWidth = initial.width - dx;
        let newHeight = initial.height + dy;
        let newX = initial.x + dx;
        
        if (newWidth < minSize) {
          newWidth = minSize;
          newX = initial.x + initial.width - minSize;
        }
        if (newHeight < minSize) newHeight = minSize;
        if (newX < 0) {
          newWidth = initial.width + initial.x;
          newX = 0;
        }
        if (initial.y + newHeight > maxSize) {
          newHeight = maxSize - initial.y;
        }
        
        newBox = { x: newX, y: initial.y, width: newWidth, height: newHeight };
      } else if (activeHandleRef.current === 'se') {
        // Resize from bottom-right
        let newWidth = initial.width + dx;
        let newHeight = initial.height + dy;
        
        if (newWidth < minSize) newWidth = minSize;
        if (newHeight < minSize) newHeight = minSize;
        if (initial.x + newWidth > maxSize) {
          newWidth = maxSize - initial.x;
        }
        if (initial.y + newHeight > maxSize) {
          newHeight = maxSize - initial.y;
        }
        
        newBox = { x: initial.x, y: initial.y, width: newWidth, height: newHeight };
      } 
      // Edge handles - resize from sides
      else if (activeHandleRef.current === 'n') {
        // Top edge - resize from top
        let newHeight = initial.height - dy;
        let newY = initial.y + dy;
        
        if (newHeight < minSize) {
          newHeight = minSize;
          newY = initial.y + initial.height - minSize;
        }
        if (newY < 0) {
          newHeight = initial.height + initial.y;
          newY = 0;
        }
        
        newBox = { x: initial.x, y: newY, width: initial.width, height: newHeight };
      } else if (activeHandleRef.current === 's') {
        // Bottom edge - resize from bottom
        let newHeight = initial.height + dy;
        
        if (newHeight < minSize) newHeight = minSize;
        if (initial.y + newHeight > maxSize) {
          newHeight = maxSize - initial.y;
        }
        
        newBox = { x: initial.x, y: initial.y, width: initial.width, height: newHeight };
      } else if (activeHandleRef.current === 'w') {
        // Left edge - resize from left
        let newWidth = initial.width - dx;
        let newX = initial.x + dx;
        
        if (newWidth < minSize) {
          newWidth = minSize;
          newX = initial.x + initial.width - minSize;
        }
        if (newX < 0) {
          newWidth = initial.width + initial.x;
          newX = 0;
        }
        
        newBox = { x: newX, y: initial.y, width: newWidth, height: initial.height };
      } else if (activeHandleRef.current === 'e') {
        // Right edge - resize from right
        let newWidth = initial.width + dx;
        
        if (newWidth < minSize) newWidth = minSize;
        if (initial.x + newWidth > maxSize) {
          newWidth = maxSize - initial.x;
        }
        
        newBox = { x: initial.x, y: initial.y, width: newWidth, height: initial.height };
      } 
      else {
        // Fallback - no valid handle
        return;
      }
      
      // Update ref immediately for visual feedback
      cropBoxRef.current = newBox;
      // Force re-render by updating state
      setCropBox(newBox);
    },
    onPanResponderRelease: () => {
      // Ensure final position is synced
      setCropBox(cropBoxRef.current);
      setIsDragging(false);
      activeHandleRef.current = null;
    },
    onPanResponderTerminate: () => {
      setCropBox(cropBoxRef.current);
      setIsDragging(false);
      activeHandleRef.current = null;
    },
  }), [manualCropEnabled]);
  
  const handleRotate = () => {
    setCropSettings(prev => ({
      ...prev,
      rotation: (prev.rotation + 90) % 360,
    }));
  };
  
  const handleFlipHorizontal = () => {
    setCropSettings(prev => ({
      ...prev,
      flipHorizontal: !prev.flipHorizontal,
    }));
  };
  
  const handleFlipVertical = () => {
    setCropSettings(prev => ({
      ...prev,
      flipVertical: !prev.flipVertical,
    }));
  };
  
  const processCrop = useCallback(async () => {
    if (!currentImage) {
      Alert.alert('Error', 'No image selected');
      return;
    }
    
    setIsSaving(true);
    
    try {
      // First get image dimensions
      const { getImageInfo } = await import('../../utils/imageProcessing');
      const imageInfo = await getImageInfo(currentImage);
      
      const options: ProcessingOptions = {
        rotate: cropSettings.rotation,
        flip: cropSettings.flipHorizontal 
          ? 'horizontal' 
          : cropSettings.flipVertical 
          ? 'vertical' 
          : undefined,
        quality: 0.9,
      };
      
      // Add crop based on manual crop box or aspect ratio selection
      if (manualCropEnabled && imageDimensions) {
        // Convert screen coordinates to image coordinates
        const scaleX = imageInfo.width / PREVIEW_SIZE;
        const scaleY = imageInfo.height / PREVIEW_SIZE;
        
        options.crop = {
          originX: Math.round(cropBox.x * scaleX),
          originY: Math.round(cropBox.y * scaleY),
          width: Math.round(cropBox.width * scaleX),
          height: Math.round(cropBox.height * scaleY),
        };
      } else if (selectedAspectRatio) {
        const ratio = COMMON_ASPECT_RATIOS[selectedAspectRatio];
        if (ratio) {
          const targetAspectRatio = ratio.width / ratio.height;
          const currentAspectRatio = imageInfo.width / imageInfo.height;
          
          let cropWidth = imageInfo.width;
          let cropHeight = imageInfo.height;
          let originX = 0;
          let originY = 0;
          
          if (currentAspectRatio > targetAspectRatio) {
            // Image is wider than target - crop width
            cropWidth = Math.round(imageInfo.height * targetAspectRatio);
            originX = Math.round((imageInfo.width - cropWidth) / 2);
          } else {
            // Image is taller than target - crop height
            cropHeight = Math.round(imageInfo.width / targetAspectRatio);
            originY = Math.round((imageInfo.height - cropHeight) / 2);
          }
          
          options.crop = {
            originX,
            originY,
            width: cropWidth,
            height: cropHeight,
          };
        }
      }
      
      // Add resize if preset is selected
      if (selectedPreset) {
        options.resize = {
          width: selectedPreset.width,
          height: selectedPreset.height,
        };
      }
      
      // Process the image
      const result = await processImage(currentImage, options);
      
      // Save to device
      try {
        const asset = await MediaLibrary.createAssetAsync(result.uri);
        
        // Update the preview with processed image
        setProcessedUri(result.uri);
        
        // Update the images array
        const newImages = [...selectedImages];
        newImages[currentImageIndex] = result.uri;
        onImagesChange(newImages);
        
        Alert.alert(
          'Success!',
          `Image cropped and saved successfully!\n\nOriginal: ${result.originalSize ? Math.round(result.originalSize / 1024) : '?'}KB\nProcessed: ${Math.round(result.processedSize / 1024)}KB\n\nSaved to: Photos`,
          [{ text: 'OK' }]
        );
      } catch (saveError) {
        console.error('Save error:', saveError);
        // Even if save fails, update preview
        setProcessedUri(result.uri);
        
        Alert.alert(
          'Partially Complete',
          `Image processed but could not save to gallery.\n\nProcessed: ${Math.round(result.processedSize / 1024)}KB\n\nError: ${saveError instanceof Error ? saveError.message : 'Unknown error'}`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Crop processing error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      Alert.alert('Error', `Failed to process image: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  }, [currentImage, selectedPreset, selectedAspectRatio, cropSettings, processImage, selectedImages, currentImageIndex, onImagesChange, manualCropEnabled, cropBox]);
  
  const processBatch = useCallback(async () => {
    // Similar to processCrop but for all images
    Alert.alert('Batch Processing', 'This feature will be implemented soon!');
  }, []);
  
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Image Preview */}
      <Card style={styles.previewCard} glassmorphism={true}>
        <View style={styles.previewHeader}>
          <Text variant="h4" weight="semibold">
            Preview
          </Text>
          {selectedImages.length > 1 && (
            <View style={styles.imageSelector}>
              <TouchableOpacity
                onPress={() => setCurrentImageIndex(Math.max(0, currentImageIndex - 1))}
                disabled={currentImageIndex === 0}
                style={[styles.navButton, currentImageIndex === 0 && styles.navButtonDisabled]}
              >
                <MaterialIcons name="chevron-left" size={24} color={colors.text.primary} />
              </TouchableOpacity>
              <Text variant="body" weight="medium">
                {currentImageIndex + 1} / {selectedImages.length}
              </Text>
              <TouchableOpacity
                onPress={() => setCurrentImageIndex(Math.min(selectedImages.length - 1, currentImageIndex + 1))}
                disabled={currentImageIndex === selectedImages.length - 1}
                style={[styles.navButton, currentImageIndex === selectedImages.length - 1 && styles.navButtonDisabled]}
              >
                <MaterialIcons name="chevron-right" size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>
          )}
        </View>
        
        {currentImage && (
          <View style={styles.imageContainer}>
            {(isProcessing || isSaving) && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color={Colors.primary.main} />
                <Text variant="body" style={{ color: Colors.primary.main, marginTop: 8 }}>
                  {isSaving ? 'Saving...' : 'Processing...'}
                </Text>
              </View>
            )}
            <Image
              source={{ uri: displayImage }}
              style={[
                styles.previewImage,
                {
                  transform: [
                    { rotate: `${cropSettings.rotation}deg` },
                    { scaleX: cropSettings.flipHorizontal ? -1 : 1 },
                    { scaleY: cropSettings.flipVertical ? -1 : 1 },
                  ],
                },
              ]}
              resizeMode="contain"
            />
            {manualCropEnabled && !processedUri && (
              <View style={styles.cropBoxContainer} {...panResponder.panHandlers}>
                {/* Dimmed areas outside crop box - four rectangles */}
                <View style={[styles.dimArea, { top: 0, left: 0, right: 0, height: cropBox.y }]} />
                <View style={[styles.dimArea, { top: cropBox.y + cropBox.height, left: 0, right: 0, bottom: 0 }]} />
                <View style={[styles.dimArea, { top: cropBox.y, left: 0, width: cropBox.x, height: cropBox.height }]} />
                <View style={[styles.dimArea, { top: cropBox.y, left: cropBox.x + cropBox.width, right: 0, height: cropBox.height }]} />
                
                <View
                  style={[
                    styles.cropBox,
                    {
                      left: cropBox.x,
                      top: cropBox.y,
                      width: cropBox.width,
                      height: cropBox.height,
                    },
                  ]}
                >
                  {/* Corner handles */}
                  <View style={[styles.cropHandle, styles.cropHandleNW]} />
                  <View style={[styles.cropHandle, styles.cropHandleNE]} />
                  <View style={[styles.cropHandle, styles.cropHandleSW]} />
                  <View style={[styles.cropHandle, styles.cropHandleSE]} />
                  
                  {/* Edge handles */}
                  <View style={[styles.edgeHandle, styles.edgeHandleN]} />
                  <View style={[styles.edgeHandle, styles.edgeHandleS]} />
                  <View style={[styles.edgeHandle, styles.edgeHandleE]} />
                  <View style={[styles.edgeHandle, styles.edgeHandleW]} />
                  
                  {/* Grid lines */}
                  <View style={styles.cropGrid}>
                    <View style={[styles.cropGridLine, { left: '33.33%', height: '100%' }]} />
                    <View style={[styles.cropGridLine, { left: '66.66%', height: '100%' }]} />
                    <View style={[styles.cropGridLine, { top: '33.33%', width: '100%', height: 1 }]} />
                    <View style={[styles.cropGridLine, { top: '66.66%', width: '100%', height: 1 }]} />
                  </View>
                  
                  {/* Border */}
                  <View style={styles.cropBorder} />
                </View>
                {/* Instructions - only show first time or when explicitly requested */}
                {!isDragging && showTutorial && (
                  <View style={styles.cropInstructions}>
                    <Text variant="caption" style={styles.cropInstructionText}>
                      Drag corners/edges to resize • Drag center to move
                    </Text>
                  </View>
                )}
              </View>
            )}
            {selectedAspectRatio && !processedUri && !manualCropEnabled && (
              <View style={styles.cropOverlay}>
                <Text variant="caption" style={styles.cropLabel}>
                  Crop area: {COMMON_ASPECT_RATIOS[selectedAspectRatio]?.label}
                </Text>
              </View>
            )}
          </View>
        )}
      </Card>
      
      {/* Transform Controls */}
      <Card style={styles.controlsCard} glassmorphism={true}>
        <Text variant="body" weight="semibold" style={styles.sectionTitle}>
          Transform
        </Text>
        <View style={styles.transformControls}>
          <TouchableOpacity style={styles.controlButton} onPress={handleRotate}>
            <MaterialIcons name="rotate-right" size={24} color={Colors.primary.main} />
            <Text variant="caption" align="center">
              Rotate
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlButton} onPress={handleFlipHorizontal}>
            <MaterialIcons name="flip" size={24} color={Colors.primary.main} />
            <Text variant="caption" align="center">
              Flip H
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlButton} onPress={handleFlipVertical}>
            <MaterialIcons name="flip" size={24} color={Colors.primary.main} style={{ transform: [{ rotate: '90deg' }] }} />
            <Text variant="caption" align="center">
              Flip V
            </Text>
          </TouchableOpacity>
        </View>
      </Card>
      
      {/* Aspect Ratios */}
      <Card style={styles.ratiosCard} glassmorphism={true}>
        <View style={styles.sectionHeader}>
          <Text variant="body" weight="semibold" style={styles.sectionTitle}>
            Aspect Ratios
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TouchableOpacity
              style={[
                styles.manualCropButton,
                { backgroundColor: manualCropEnabled ? Colors.primary.main : colors.surface }
              ]}
              onPress={handleManualCropToggle}
            >
              <MaterialIcons 
                name={manualCropEnabled ? "crop-free" : "crop"} 
                size={20} 
                color={manualCropEnabled ? '#ffffff' : colors.text.primary} 
              />
              <Text 
                variant="caption" 
                style={{ 
                  color: manualCropEnabled ? '#ffffff' : colors.text.primary,
                  marginLeft: 4,
                }}
              >
                Manual Crop
              </Text>
            </TouchableOpacity>
            {manualCropEnabled && (
              <TouchableOpacity
                style={styles.helpButton}
                onPress={showHelpTutorial}
              >
                <MaterialIcons name="help-outline" size={20} color={Colors.primary.main} />
              </TouchableOpacity>
            )}
          </View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.ratiosContainer}>
          {aspectRatios.map((ratio) => (
            <TouchableOpacity
              key={ratio.key}
              style={[
                styles.ratioButton,
                selectedAspectRatio === ratio.key && styles.ratioButtonSelected,
                { backgroundColor: selectedAspectRatio === ratio.key ? Colors.primary.main : colors.surface }
              ]}
              onPress={() => handleAspectRatioSelect(ratio, ratio.key)}
            >
              <Text
                variant="caption"
                style={{
                  color: selectedAspectRatio === ratio.key ? '#ffffff' : colors.text.primary,
                  textAlign: 'center',
                }}
              >
                {ratio.key}
              </Text>
              <Text
                variant="caption"
                style={{
                  color: selectedAspectRatio === ratio.key ? 'rgba(255,255,255,0.8)' : colors.text.secondary,
                  textAlign: 'center',
                  fontSize: 11,
                }}
              >
                {ratio.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Card>
      
      {/* Social Media Presets */}
      <Card style={styles.presetsCard} glassmorphism={true}>
        <Text variant="body" weight="semibold" style={styles.sectionTitle}>
          Social Media Sizes
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presetsContainer}>
          {socialPresets.map((preset) => (
            <TouchableOpacity
              key={preset.key}
              style={[
                styles.presetButton,
                selectedPreset?.label === preset.label && styles.presetButtonSelected,
                { backgroundColor: selectedPreset?.label === preset.label ? Colors.accent.main : colors.surface }
              ]}
              onPress={() => handlePresetSelect(preset)}
            >
              <Text
                variant="caption"
                weight="medium"
                style={{
                  color: selectedPreset?.label === preset.label ? '#ffffff' : colors.text.primary,
                  textAlign: 'center',
                }}
              >
                {preset.label}
              </Text>
              <Text
                variant="caption"
                style={{
                  color: selectedPreset?.label === preset.label ? 'rgba(255,255,255,0.8)' : colors.text.secondary,
                  textAlign: 'center',
                  fontSize: 11,
                }}
              >
                {preset.width}×{preset.height}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Card>
      
      {/* Process Buttons */}
      <Card style={styles.actionsCard} glassmorphism={true}>
        <View style={styles.actions}>
          <Button
            title={`Crop & Save Image`}
            onPress={processCrop}
            variant="primary"
            disabled={isProcessing || isSaving}
            loading={isProcessing || isSaving}
            style={styles.processButton}
          />
          
          {selectedImages.length > 1 && (
            <Button
              title={`Process All (${selectedImages.length})`}
              onPress={processBatch}
              variant="accent"
              disabled={isProcessing || isSaving}
              loading={isProcessing && selectedImages.length > 1}
              style={styles.processButton}
            />
          )}
        </View>
        
        {(isProcessing || isSaving) && (
          <View style={styles.progressContainer}>
            <Text variant="caption" color="secondary">
              {isSaving ? 'Saving to device...' : `Processing... ${Math.round(progress)}%`}
            </Text>
          </View>
        )}
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  previewCard: {
    marginBottom: Spacing.md,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  imageSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  navButton: {
    padding: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  imageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: PREVIEW_SIZE,
    height: PREVIEW_SIZE,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: BorderRadius.md,
    position: 'relative',
    alignSelf: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    borderRadius: BorderRadius.md,
  },
  cropOverlay: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(91, 95, 249, 0.9)',
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  cropLabel: {
    color: '#ffffff',
    fontWeight: '600',
  },
  previewImage: {
    width: PREVIEW_SIZE - 20,
    height: PREVIEW_SIZE - 20,
  },
  controlsCard: {
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  transformControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  controlButton: {
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
  },
  ratiosCard: {
    marginBottom: Spacing.md,
  },
  ratiosContainer: {
    gap: Spacing.sm,
    paddingRight: Spacing.sm,
  },
  ratioButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    minWidth: 60,
    alignItems: 'center',
  },
  ratioButtonSelected: {
    backgroundColor: Colors.primary.main,
  },
  presetsCard: {
    marginBottom: Spacing.md,
  },
  presetsContainer: {
    gap: Spacing.sm,
    paddingRight: Spacing.sm,
  },
  presetButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    minWidth: 100,
    alignItems: 'center',
  },
  presetButtonSelected: {
    backgroundColor: Colors.accent.main,
  },
  actionsCard: {
    marginBottom: Spacing.lg,
  },
  actions: {
    gap: Spacing.sm,
  },
  processButton: {
    width: '100%',
  },
  progressContainer: {
    marginTop: Spacing.sm,
    alignItems: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  manualCropButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.primary.main,
  },
  helpButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: 'rgba(91, 95, 249, 0.1)',
  },
  cropBoxContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  dimArea: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    pointerEvents: 'none',
  },
  cropBox: {
    position: 'absolute',
  },
  cropBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 2,
    borderColor: '#ffffff',
    pointerEvents: 'none',
  },
  cropHandle: {
    position: 'absolute',
    width: 24,
    height: 24,
    backgroundColor: '#ffffff',
    borderWidth: 3,
    borderColor: Colors.primary.main,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  cropHandleNW: {
    top: -12,
    left: -12,
  },
  cropHandleNE: {
    top: -12,
    right: -12,
  },
  cropHandleSW: {
    bottom: -12,
    left: -12,
  },
  cropHandleSE: {
    bottom: -12,
    right: -12,
  },
  edgeHandle: {
    position: 'absolute',
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: Colors.primary.main,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  edgeHandleN: {
    top: -4,
    left: '50%',
    marginLeft: -20,
    width: 40,
    height: 8,
    borderRadius: 4,
  },
  edgeHandleS: {
    bottom: -4,
    left: '50%',
    marginLeft: -20,
    width: 40,
    height: 8,
    borderRadius: 4,
  },
  edgeHandleE: {
    right: -4,
    top: '50%',
    marginTop: -20,
    width: 8,
    height: 40,
    borderRadius: 4,
  },
  edgeHandleW: {
    left: -4,
    top: '50%',
    marginTop: -20,
    width: 8,
    height: 40,
    borderRadius: 4,
  },
  cropGrid: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  cropGridLine: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    width: 1,
  },
  cropInstructions: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(91, 95, 249, 0.95)',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  cropInstructionText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 13,
  },
});

export default CropTool;