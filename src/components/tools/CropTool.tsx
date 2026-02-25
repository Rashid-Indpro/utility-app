import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { Text, Card, Button } from '../index';
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
  
  const currentImage = selectedImages[currentImageIndex];
  
  const aspectRatios = Object.entries(COMMON_ASPECT_RATIOS).map(([key, value]) => ({
    key,
    ...value,
  }));
  
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
  };
  
  const handlePresetSelect = (preset: Preset) => {
    setSelectedPreset(preset);
    setSelectedAspectRatio(null);
  };
  
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
    if (!currentImage) return;
    
    try {
      const options: ProcessingOptions = {
        rotate: cropSettings.rotation,
        flip: cropSettings.flipHorizontal 
          ? 'horizontal' 
          : cropSettings.flipVertical 
          ? 'vertical' 
          : undefined,
        quality: 0.9,
      };
      
      // Add resize if preset is selected
      if (selectedPreset) {
        options.resize = {
          width: selectedPreset.width,
          height: selectedPreset.height,
        };
      } else if (selectedAspectRatio) {
        const ratio = COMMON_ASPECT_RATIOS[selectedAspectRatio];
        if (ratio) {
          // Calculate target dimensions maintaining aspect ratio
          const targetWidth = 1080; // Default base width
          const targetHeight = Math.round(targetWidth * (ratio.height / ratio.width));
          options.resize = {
            width: targetWidth,
            height: targetHeight,
          };
        }
      }
      
      const result = await processImage(currentImage, options);
      
      Alert.alert(
        'Crop Complete',
        `Image processed successfully!\nOriginal: ${result.originalSize ? Math.round(result.originalSize / 1024) : '?'}KB\nProcessed: ${Math.round(result.processedSize / 1024)}KB`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to process image');
    }
  }, [currentImage, selectedPreset, selectedAspectRatio, cropSettings, processImage]);
  
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
            <Image
              source={{ uri: currentImage }}
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
        <Text variant="body" weight="semibold" style={styles.sectionTitle}>
          Aspect Ratios
        </Text>
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
            title={`Process Current Image`}
            onPress={processCrop}
            variant="primary"
            disabled={isProcessing}
            loading={isProcessing && selectedImages.length === 1}
            style={styles.processButton}
          />
          
          {selectedImages.length > 1 && (
            <Button
              title={`Process All (${selectedImages.length})`}
              onPress={processBatch}
              variant="accent"
              disabled={isProcessing}
              loading={isProcessing && selectedImages.length > 1}
              style={styles.processButton}
            />
          )}
        </View>
        
        {isProcessing && (
          <View style={styles.progressContainer}>
            <Text variant="caption" color="secondary">
              Processing... {Math.round(progress)}%
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
    height: PREVIEW_SIZE,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: BorderRadius.md,
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
});

export default CropTool;