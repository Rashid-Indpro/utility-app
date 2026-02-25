import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  Animated,
  ProgressViewIOS,
  ProgressBarAndroid,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import { getInfoAsync } from 'expo-file-system/legacy';

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

import { Text } from './Text';
import { Card } from './Card';
import { Button } from './Button';
import { useTheme } from '../contexts/ThemeContext';
import { useImageProcessing } from '../contexts/ImageProcessingContext';
import { useHistory } from '../hooks/useStorage';
import { Colors, Spacing, BorderRadius } from '../constants/theme';
import { processImage } from '../utils/imageProcessing';
import { saveProcessedImage, createZipFile } from '../utils/fileManager';
import type { ImageProcessingOptions, ImageFormat } from '../utils/imageProcessing';

interface BatchProcessingItem {
  uri: string;
  name: string;
  size?: number;
  processed?: boolean;
  outputPath?: string;
  error?: string;
}

interface BatchSettings extends ImageProcessingOptions {
  outputFormat: ImageFormat;
  createZip: boolean;
  zipName: string;
}

interface Props {
  visible: boolean;
  images: string[];
  operationType: 'crop' | 'resize' | 'compress' | 'filters' | 'watermark' | 'text' | 'converter' | 'metadata' | 'background';
  defaultSettings: Partial<BatchSettings>;
  onClose: () => void;
  onComplete: (results: BatchProcessingItem[]) => void;
}

const BatchProcessor: React.FC<Props> = ({
  visible,
  images,
  operationType,
  defaultSettings,
  onClose,
  onComplete,
}) => {
  const { colors } = useTheme();
  const { addProcessingTask, removeProcessingTask } = useImageProcessing();
  const { addHistoryItem } = useHistory();
  
  const [processing, setProcessing] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [batchItems, setBatchItems] = useState<BatchProcessingItem[]>([]);
  const [settings, setSettings] = useState<BatchSettings>({
    quality: 0.8,
    outputFormat: 'JPEG',
    createZip: images.length > 3,
    zipName: `pixozen_${operationType}_${Date.now()}`,
    ...defaultSettings,
  });
  
  const progressAnimation = useRef(new Animated.Value(0)).current;
  const [overallProgress, setOverallProgress] = useState(0);
  
  // Initialize batch items when images change
  React.useEffect(() => {
    if (images.length > 0) {
      const items = images.map((uri, index) => ({
        uri,
        name: `Image ${index + 1}`,
        processed: false,
      }));
      setBatchItems(items);
    }
  }, [images]);
  
  const updateSetting = <K extends keyof BatchSettings>(
    key: K,
    value: BatchSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };
  
  const startBatchProcessing = async () => {
    if (batchItems.length === 0) {
      Alert.alert('Error', 'No images to process');
      return;
    }
    
    setProcessing(true);
    setCurrentIndex(0);
    setOverallProgress(0);
    
    const taskId = `batch-${operationType}-${Date.now()}`;
    addProcessingTask(taskId, 'Batch Processing Images');
    
    try {
      const processedItems: BatchProcessingItem[] = [];
      
      for (let i = 0; i < batchItems.length; i++) {
        setCurrentIndex(i);
        const item = batchItems[i];
        
        try {
          // Add slight delay for UI feedback
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Process the image
          const processedUri = await processImage(item.uri, settings);
          
          // Save the processed image
          const savedPath = await saveProcessedImage(
            processedUri,
            settings.outputFormat,
            `${operationType}_${i + 1}`
          );
          
          // Get file info
          const fileInfo = await getInfoAsync(savedPath);
          
          const processedItem: BatchProcessingItem = {
            ...item,
            processed: true,
            outputPath: savedPath,
            size: fileInfo.exists && 'size' in fileInfo ? (fileInfo.size as number) : undefined,
          };
          
          processedItems.push(processedItem);
          
          // Update batch items state
          setBatchItems(prev =>
            prev.map((batchItem, index) =>
              index === i ? processedItem : batchItem
            )
          );
          
          // Add to history
          await addHistoryItem({
            inputPath: item.uri,
            outputPath: savedPath,
            operation: operationType,
            settings,
            outputFormat: settings.outputFormat,
            outputSize: processedItem.size,
          });
          
          // Update progress
          const progress = (i + 1) / batchItems.length;
          setOverallProgress(progress);
          
          Animated.timing(progressAnimation, {
            toValue: progress,
            duration: 200,
            useNativeDriver: false,
          }).start();
          
        } catch (error) {
          console.error(`Error processing image ${i + 1}:`, error);
          const errorItem: BatchProcessingItem = {
            ...item,
            processed: false,
            error: 'Processing failed',
          };
          processedItems.push(errorItem);
          
          setBatchItems(prev =>
            prev.map((batchItem, index) =>
              index === i ? errorItem : batchItem
            )
          );
        }
      }
      
      // Create ZIP file if requested and we have successful items
      const successfulItems = processedItems.filter(item => item.processed && item.outputPath);
      
      if (settings.createZip && successfulItems.length > 0) {
        try {
          const zipPath = await createZipFile(
            successfulItems.map(item => item.outputPath!),
            settings.zipName
          );
          
          Alert.alert(
            'Batch Processing Complete',
            `${successfulItems.length}/${batchItems.length} images processed successfully.\nZIP file created: ${zipPath}`,
            [{ text: 'OK', onPress: () => onComplete(processedItems) }]
          );
        } catch (zipError) {
          Alert.alert(
            'Batch Processing Complete',
            `${successfulItems.length}/${batchItems.length} images processed successfully.\nNote: ZIP creation failed.`,
            [{ text: 'OK', onPress: () => onComplete(processedItems) }]
          );
        }
      } else {
        const successCount = successfulItems.length;
        const totalCount = batchItems.length;
        
        Alert.alert(
          'Batch Processing Complete',
          `${successCount}/${totalCount} images processed successfully.`,
          [{ text: 'OK', onPress: () => onComplete(processedItems) }]
        );
      }
      
    } catch (error) {
      console.error('Batch processing error:', error);
      Alert.alert('Error', 'Batch processing failed. Please try again.');
    } finally {
      removeProcessingTask(taskId);
      setProcessing(false);
      setCurrentIndex(-1);
    }
  };
  
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };
  
  const ProgressBar = ({ progress }: { progress: number }) => {
    if (Platform.OS === 'ios') {
      return (
        <ProgressViewIOS
          progress={progress}
          progressTintColor={Colors.primary.main}
          trackTintColor={colors.border}
          style={styles.progressBar}
        />
      );
    } else {
      return (
        <ProgressBarAndroid
          styleAttr="Horizontal"
          indeterminate={false}
          progress={progress}
          color={Colors.primary.main}
          style={styles.progressBar}
        />
      );
    }
  };
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton} disabled={processing}>
            <MaterialIcons name="close" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text variant="h4" weight="semibold">
            Batch {operationType.charAt(0).toUpperCase() + operationType.slice(1)}
          </Text>
          <View style={styles.headerSpacer} />
        </View>
        
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Settings */}
          {!processing && (
            <Card style={styles.settingsCard} glassmorphism={true}>
              <Text variant="body" weight="semibold" style={styles.sectionTitle}>
                Processing Settings
              </Text>
              
              {/* Output Format */}
              <View style={styles.setting}>
                <Text variant="caption" color="secondary">Output Format</Text>
                <View style={styles.formatButtons}>
                  {(['JPEG', 'PNG', 'WEBP'] as ImageFormat[]).map((format) => (
                    <TouchableOpacity
                      key={format}
                      style={[
                        styles.formatButton,
                        settings.outputFormat === format && styles.formatButtonSelected,
                        {
                          backgroundColor: settings.outputFormat === format
                            ? Colors.primary.main
                            : colors.surface,
                          borderColor: colors.border,
                        },
                      ]}
                      onPress={() => updateSetting('outputFormat', format)}
                    >
                      <Text
                        variant="caption"
                        style={{
                          color: settings.outputFormat === format ? '#ffffff' : colors.text.primary,
                        }}
                      >
                        {format}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              
              {/* Quality */}
              <View style={styles.setting}>
                <View style={styles.settingHeader}>
                  <Text variant="caption" color="secondary">Quality</Text>
                  <Text variant="caption" weight="medium">
                    {Math.round(settings.quality * 100)}%
                  </Text>
                </View>
                <View style={styles.qualitySlider}>
                  {[0.6, 0.8, 1.0].map((quality) => (
                    <TouchableOpacity
                      key={quality}
                      style={[
                        styles.qualityOption,
                        settings.quality === quality && styles.qualityOptionSelected,
                        { backgroundColor: settings.quality === quality ? Colors.primary.main : colors.surface },
                      ]}
                      onPress={() => updateSetting('quality', quality)}
                    >
                      <Text
                        variant="caption"
                        style={{
                          color: settings.quality === quality ? '#ffffff' : colors.text.primary,
                        }}
                      >
                        {quality === 0.6 ? 'Low' : quality === 0.8 ? 'Med' : 'High'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              
              {/* ZIP Creation */}
              <View style={styles.setting}>
                <View style={styles.settingRow}>
                  <View style={styles.settingText}>
                    <Text variant="body">Create ZIP Archive</Text>
                    <Text variant="caption" color="secondary">
                      Package all processed images into a single ZIP file
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.checkbox,
                      settings.createZip && styles.checkboxSelected,
                      { borderColor: colors.border },
                    ]}
                    onPress={() => updateSetting('createZip', !settings.createZip)}
                  >
                    {settings.createZip && (
                      <MaterialIcons name="check" size={16} color="#ffffff" />
                    )}
                  </TouchableOpacity>
                </View>
                
                {settings.createZip && (
                  <View style={styles.zipNameInput}>
                    <Text variant="caption" color="secondary">ZIP Name</Text>
                    <TouchableOpacity
                      style={[styles.nameButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                      onPress={() => {
                        Alert.prompt(
                          'ZIP File Name',
                          'Enter a name for the ZIP file',
                          [
                            { text: 'Cancel', style: 'cancel' },
                            {
                              text: 'OK',
                              onPress: (text) => {
                                if (text && text.trim()) {
                                  updateSetting('zipName', text.trim());
                                }
                              },
                            },
                          ],
                          'plain-text',
                          settings.zipName
                        );
                      }}
                    >
                      <Text variant="body" numberOfLines={1}>
                        {settings.zipName}.zip
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </Card>
          )}
          
          {/* Processing Progress */}
          {processing && (
            <Card style={styles.progressCard} glassmorphism={true}>
              <Text variant="body" weight="semibold" style={styles.progressTitle}>
                Processing Images...
              </Text>
              <Text variant="caption" color="secondary" style={styles.progressSubtitle}>
                {currentIndex >= 0 ? `Processing image ${currentIndex + 1} of ${batchItems.length}` : 'Preparing...'}
              </Text>
              
              <ProgressBar progress={overallProgress} />
              
              <View style={styles.progressStats}>
                <Text variant="caption" color="secondary">
                  {Math.round(overallProgress * 100)}% complete
                </Text>
              </View>
            </Card>
          )}
          
          {/* Image List */}
          <Card style={styles.imageListCard} glassmorphism={true}>
            <Text variant="body" weight="semibold" style={styles.sectionTitle}>
              Images ({batchItems.length})
            </Text>
            
            {batchItems.map((item, index) => (
              <View
                key={index}
                style={[
                  styles.imageItem,
                  processing && currentIndex === index && styles.imageItemActive,
                  { borderColor: colors.border },
                ]}
              >
                <Image source={{ uri: item.uri }} style={styles.imageThumbnail} />
                <View style={styles.imageDetails}>
                  <Text variant="body" numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text variant="caption" color="secondary">
                    {item.processed ? 'Processed' : item.error || 'Waiting...'}
                  </Text>
                  {item.size && (
                    <Text variant="caption" color="tertiary">
                      {formatFileSize(item.size)}
                    </Text>
                  )}
                </View>
                <View style={styles.imageStatus}>
                  {item.processed ? (
                    <MaterialIcons name="check-circle" size={20} color={Colors.accent.main} />
                  ) : item.error ? (
                    <MaterialIcons name="error" size={20} color={Colors.error.main} />
                  ) : processing && currentIndex === index ? (
                    <MaterialIcons name="hourglass-empty" size={20} color={Colors.primary.main} />
                  ) : (
                    <MaterialIcons name="radio-button-unchecked" size={20} color={colors.text.tertiary} />
                  )}
                </View>
              </View>
            ))}
          </Card>
        </ScrollView>
        
        {/* Footer */}
        {!processing && (
          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <Button
              title="Cancel"
              onPress={onClose}
              variant="secondary"
              style={styles.footerButton}
            />
            <Button
              title={`Process ${batchItems.length} Images`}
              onPress={startBatchProcessing}
              variant="primary"
              style={[styles.footerButton, { flex: 1 }]}
            />
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    justifyContent: 'space-between',
  },
  closeButton: {
    padding: Spacing.sm,
    width: 50,
  },
  headerSpacer: {
    width: 50,
  },
  content: {
    flex: 1,
    padding: Spacing.base,
  },
  settingsCard: {
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  setting: {
    marginBottom: Spacing.lg,
  },
  settingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  settingText: {
    flex: 1,
    marginRight: Spacing.md,
  },
  formatButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  formatButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    alignItems: 'center',
  },
  formatButtonSelected: {
    borderWidth: 0,
  },
  qualitySlider: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  qualityOption: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
  },
  qualityOptionSelected: {
    backgroundColor: Colors.primary.main,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: Colors.primary.main,
    borderColor: Colors.primary.main,
  },
  zipNameInput: {
    marginTop: Spacing.md,
  },
  nameButton: {
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    marginTop: Spacing.sm,
  },
  progressCard: {
    marginBottom: Spacing.md,
  },
  progressTitle: {
    marginBottom: Spacing.xs,
  },
  progressSubtitle: {
    marginBottom: Spacing.md,
  },
  progressBar: {
    height: 6,
    marginBottom: Spacing.md,
  },
  progressStats: {
    alignItems: 'center',
  },
  imageListCard: {
    marginBottom: Spacing.lg,
  },
  imageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginBottom: Spacing.sm,
  },
  imageItemActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderColor: Colors.primary.main,
  },
  imageThumbnail: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.md,
  },
  imageDetails: {
    flex: 1,
  },
  imageStatus: {
    marginLeft: Spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    gap: Spacing.md,
  },
  footerButton: {
    minWidth: 100,
  },
});

export default BatchProcessor;