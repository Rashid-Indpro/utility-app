import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  Alert,
  Animated,
  Text,
  TextInput,
  Switch,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { LinearGradient } from 'expo-linear-gradient';

import { Card, Button } from '../index';
import { useTheme } from '../../contexts/ThemeContext';
import { useImageProcessor } from '../../hooks/useImageTools';
import { compressToTargetSize, getImageInfo, formatFileSize } from '../../utils/fileManager';
import { Colors, Spacing, BorderRadius } from '../../constants/theme';
import type { ToolProps } from './types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CompressTool: React.FC<ToolProps> = ({ selectedImages, onImagesChange }) => {
  const { colors } = useTheme();
  const { compressImage, isProcessing, progress } = useImageProcessor();
  
  const [compressionLevel, setCompressionLevel] = useState(0.8);
  const [targetSize, setTargetSize] = useState(500); // KB
  const [compressionMode, setCompressionMode] = useState<'quality' | 'size'>('size');
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [originalInfo, setOriginalInfo] = useState<any>(null);
  const [previewData, setPreviewData] = useState<{
    originalSize?: number;
    estimatedSize?: number;
    compressionRatio?: number;
  }>({});
  
  const slideAnim = useRef(new Animated.Value(0)).current;
  const currentImage = selectedImages[currentImageIndex];
  
  // Load image info when image changes
  React.useEffect(() => {
    if (currentImage) {
      loadImageInfo();
    }
  }, [currentImage]);
  
  const loadImageInfo = async () => {
    try {
      const info = await getImageInfo(currentImage);
      setOriginalInfo(info);
      
      // Estimate compressed size based on current settings
      const estimatedSize = compressionMode === 'size' 
        ? targetSize * 1024
        : (info.size || 0) * compressionLevel;
      
      setPreviewData({
        originalSize: info.size,
        estimatedSize,
        compressionRatio: info.size ? (info.size / estimatedSize) : 1,
      });
    } catch (error) {
      console.error('Failed to load image info:', error);
    }
  };
  
  const handlePresetSelect = useCallback((preset: CompressPreset) => {
    setSelectedPreset(preset.id);
    setTargetSize(preset.targetKB);
    setCompressionMode('size');
    
    // Update preview
    if (originalInfo?.size) {
      const estimatedSize = preset.targetKB * 1024;
      setPreviewData(prev => ({
        ...prev,
        estimatedSize,
        compressionRatio: originalInfo.size / estimatedSize,
      }));
    }
    
    // Animate selection
    Animated.spring(slideAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  }, [originalInfo, slideAnim]);
  
  const handleQualityChange = useCallback((value: number) => {
    setCompressionLevel(value);
    setCompressionMode('quality');
    setSelectedPreset(null);
    
    // Update preview
    if (originalInfo?.size) {
      const estimatedSize = originalInfo.size * value;
      setPreviewData(prev => ({
        ...prev,
        estimatedSize,
        compressionRatio: originalInfo.size / estimatedSize,
      }));
    }
  }, [originalInfo]);
  
  const handleTargetSizeChange = useCallback((value: number) => {
    setTargetSize(value);
    setCompressionMode('size');
    setSelectedPreset(null);
    
    // Update preview
    if (originalInfo?.size) {
      const estimatedSize = value * 1024;
      setPreviewData(prev => ({
        ...prev,
        estimatedSize,
        compressionRatio: originalInfo.size / estimatedSize,
      }));
    }
  }, [originalInfo]);
  
  const processCompress = useCallback(async () => {
    if (!currentImage) return;
    
    try {
      let result;
      
      if (compressionMode === 'size') {
        result = await compressImage(currentImage, targetSize);
      } else {
        // Use quality-based compression
        const { processImage } = useImageProcessor();
        result = await processImage(currentImage, { quality: compressionLevel });
      }
      
      const originalSizeKB = result.originalSize ? result.originalSize / 1024 : 0;
      const compressedSizeKB = result.processedSize / 1024;
      const savings = ((originalSizeKB - compressedSizeKB) / originalSizeKB) * 100;
      
      Alert.alert(
        'Compression Complete',
        `Original: ${originalSizeKB.toFixed(1)}KB\n` +
        `Compressed: ${compressedSizeKB.toFixed(1)}KB\n` +
        `Saved: ${savings.toFixed(1)}% (${(originalSizeKB - compressedSizeKB).toFixed(1)}KB)`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to compress image');
    }
  }, [currentImage, compressionMode, targetSize, compressionLevel, compressImage]);
  
  const processBatch = useCallback(async () => {
    Alert.alert('Batch Processing', 'This feature will be implemented soon!');
  }, []);
  
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Image Preview & Stats */}
      <Card style={styles.previewCard} glassmorphism={true}>
        <View style={styles.previewHeader}>
          <Text variant="h4" weight="semibold">
            Preview & Stats
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
        
        <View style={styles.previewContainer}>
          {/* Before Image */}
          <View style={styles.beforeAfter}>
            <Text variant="caption" weight="medium" style={styles.label}>
              Original
            </Text>
            {currentImage && (
              <Image
                source={{ uri: currentImage }}
                style={styles.previewImage}
                resizeMode="cover"
              />
            )}
            <Text variant="caption" color="secondary">
              {previewData.originalSize ? formatFileSize(previewData.originalSize) : 'Loading...'}
            </Text>
          </View>
          
          {/* Compression Arrow */}
          <View style={styles.arrowContainer}>
            <MaterialIcons name="arrow-forward" size={24} color={Colors.primary.main} />
            <Text variant="caption" color="primary" style={styles.compressionRatio}>
              {previewData.compressionRatio ? `${previewData.compressionRatio.toFixed(1)}x` : '-'}
            </Text>
          </View>
          
          {/* After Image */}
          <View style={styles.beforeAfter}>
            <Text variant="caption" weight="medium" style={styles.label}>
              Compressed
            </Text>
            {currentImage && (
              <View style={styles.afterPreview}>
                <Image
                  source={{ uri: currentImage }}
                  style={[styles.previewImage, { opacity: 0.8 }]}
                  resizeMode="cover"
                />
                <MaterialIcons 
                  name="compress" 
                  size={24} 
                  color={Colors.accent.main}
                  style={styles.compressIcon}
                />
              </View>
            )}
            <Text variant="caption" color="secondary">
              {previewData.estimatedSize ? formatFileSize(previewData.estimatedSize) : 'Estimating...'}
            </Text>
          </View>
        </View>
      </Card>
      
      {/* Compression Presets */}
      <Card style={styles.presetsCard} glassmorphism={true}>
        <Text variant="body" weight="semibold" style={styles.sectionTitle}>
          Quick Presets
        </Text>
        <View style={styles.presetsGrid}>
          {COMPRESS_PRESETS.map((preset) => (
            <TouchableOpacity
              key={preset.id}
              style={[
                styles.presetButton,
                selectedPreset === preset.id && styles.presetButtonSelected,
                { backgroundColor: selectedPreset === preset.id ? Colors.accent.main : colors.surface }
              ]}
              onPress={() => handlePresetSelect(preset)}
            >
              <Text
                variant="caption"
                weight="medium"
                style={{
                  color: selectedPreset === preset.id ? '#ffffff' : colors.text.primary,
                }}
              >
                {preset.name}
              </Text>
              <Text
                variant="caption"
                style={{
                  color: selectedPreset === preset.id ? 'rgba(255,255,255,0.8)' : colors.text.secondary,
                  fontSize: 11,
                  textAlign: 'center',
                }}
              >
                {preset.targetKB}KB
              </Text>
              <Text
                variant="caption"
                style={{
                  color: selectedPreset === preset.id ? 'rgba(255,255,255,0.7)' : colors.text.tertiary,
                  fontSize: 10,
                  textAlign: 'center',
                }}
              >
                {preset.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Card>
      
      {/* Manual Controls */}
      <Card style={styles.controlsCard} glassmorphism={true}>
        <Text variant="body" weight="semibold" style={styles.sectionTitle}>
          Manual Controls
        </Text>
        
        {/* Mode Selector */}
        <View style={styles.modeSelector}>
          <TouchableOpacity
            style={[
              styles.modeButton,
              compressionMode === 'size' && styles.modeButtonSelected,
            ]}
            onPress={() => setCompressionMode('size')}
          >
            <Text
              variant="caption"
              style={{
                color: compressionMode === 'size' ? '#ffffff' : colors.text.primary,
              }}
            >
              Target Size
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.modeButton,
              compressionMode === 'quality' && styles.modeButtonSelected,
            ]}
            onPress={() => setCompressionMode('quality')}
          >
            <Text
              variant="caption"
              style={{
                color: compressionMode === 'quality' ? '#ffffff' : colors.text.primary,
              }}
            >
              Quality Level
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Sliders */}
        {compressionMode === 'size' ? (
          <View style={styles.sliderContainer}>
            <View style={styles.sliderHeader}>
              <Text variant="caption" color="secondary">
                Target Size (KB)
              </Text>
              <Text variant="caption" weight="medium">
                {targetSize}KB
              </Text>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={50}
              maximumValue={5000}
              value={targetSize}
              onValueChange={handleTargetSizeChange}
              minimumTrackTintColor={Colors.primary.main}
              maximumTrackTintColor={colors.border}
              thumbStyle={styles.sliderThumb}
              step={50}
            />
          </View>
        ) : (
          <View style={styles.sliderContainer}>
            <View style={styles.sliderHeader}>
              <Text variant="caption" color="secondary">
                Quality Level
              </Text>
              <Text variant="caption" weight="medium">
                {Math.round(compressionLevel * 100)}%
              </Text>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={0.1}
              maximumValue={1.0}
              value={compressionLevel}
              onValueChange={handleQualityChange}
              minimumTrackTintColor={Colors.primary.main}
              maximumTrackTintColor={colors.border}
              thumbStyle={styles.sliderThumb}
              step={0.05}
            />
          </View>
        )}
      </Card>
      
      {/* Process Buttons */}
      <Card style={styles.actionsCard} glassmorphism={true}>
        <View style={styles.actions}>
          <Button
            title="Compress Current Image"
            onPress={processCompress}
            variant="primary"
            disabled={isProcessing}
            loading={isProcessing && selectedImages.length === 1}
            style={styles.processButton}
          />
          
          {selectedImages.length > 1 && (
            <Button
              title={`Compress All (${selectedImages.length})`}
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
              Compressing... {Math.round(progress)}%
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
  previewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  beforeAfter: {
    alignItems: 'center',
    flex: 1,
  },
  label: {
    marginBottom: Spacing.xs,
  },
  previewImage: {
    width: PREVIEW_SIZE,
    height: PREVIEW_SIZE,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xs,
  },
  arrowContainer: {
    alignItems: 'center',
    marginHorizontal: Spacing.sm,
  },
  compressionRatio: {
    marginTop: Spacing.xs,
    fontSize: 12,
  },
  afterPreview: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  compressIcon: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: BorderRadius.full,
    padding: Spacing.xs,
  },
  presetsCard: {
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  presetButton: {
    width: '48%',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  presetButtonSelected: {
    backgroundColor: Colors.accent.main,
  },
  controlsCard: {
    marginBottom: Spacing.md,
  },
  modeSelector: {
    flexDirection: 'row',
    marginBottom: Spacing.lg,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: BorderRadius.md,
    padding: 2,
  },
  modeButton: {
    flex: 1,
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
  },
  modeButtonSelected: {
    backgroundColor: Colors.primary.main,
  },
  sliderContainer: {
    marginBottom: Spacing.md,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderThumb: {
    backgroundColor: Colors.primary.main,
    width: 20,
    height: 20,
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

export default CompressTool;