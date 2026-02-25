import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Switch,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';

import { Text, Card, Button } from './index';
import { useTheme } from '@/contexts/ThemeContext';
import { useImageSaver } from '@/hooks/useImageTools';
import { formatFileSize, generateFileName } from '@/utils/fileManager';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';

export type OutputFormat = 'JPEG' | 'PNG' | 'WEBP';

interface ExportSettings {
  format: OutputFormat;
  quality: number;
  dpi: number;
  fileName: string;
  overwrite: boolean;
  createZip: boolean;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onExport: (settings: ExportSettings) => void;
  processedImages: string[];
  estimatedSizes?: number[];
}

const ImageExportModal: React.FC<Props> = ({
  visible,
  onClose,
  onExport,
  processedImages,
  estimatedSizes = [],
}) => {
  const { colors } = useTheme();
  const { saveMany, isSaving } = useImageSaver();
  
  const [settings, setSettings] = useState<ExportSettings>({
    format: 'JPEG',
    quality: 0.9,
    dpi: 72,
    fileName: generateFileName('pixozen_processed'),
    overwrite: false,
    createZip: processedImages.length > 1,
  });
  
  const formats: { value: OutputFormat; label: string; description: string }[] = [
    {
      value: 'JPEG',
      label: 'JPEG',
      description: 'Best for photos, smaller size',
    },
    {
      value: 'PNG',
      label: 'PNG',
      description: 'Supports transparency, larger size',
    },
    {
      value: 'WEBP',
      label: 'WEBP',
      description: 'Modern format, excellent compression',
    },
  ];
  
  const dpiOptions = [
    { value: 72, label: '72 DPI', description: 'Web/Screen' },
    { value: 96, label: '96 DPI', description: 'Standard' },
    { value: 150, label: '150 DPI', description: 'Good Quality' },
    { value: 300, label: '300 DPI', description: 'Print Quality' },
  ];
  
  const getTotalEstimatedSize = () => {
    if (estimatedSizes.length === 0) return 0;
    return estimatedSizes.reduce((total, size) => total + size, 0);
  };
  
  const handleExport = async () => {
    try {
      await onExport(settings);
      onClose();
    } catch (error) {
      Alert.alert('Export Failed', 'Could not export images. Please try again.');
    }
  };
  
  const updateSettings = (key: keyof ExportSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
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
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <MaterialIcons name="close" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text variant="h4" weight="semibold">
            Export Settings
          </Text>
          <View style={styles.headerSpacer} />
        </View>
        
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Summary */}
          <Card style={styles.summaryCard} glassmorphism={true}>
            <View style={styles.summary}>
              <View style={styles.summaryItem}>
                <Text variant="caption" color="secondary">
                  Images to Export
                </Text>
                <Text variant="body" weight="medium">
                  {processedImages.length}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text variant="caption" color="secondary">
                  Estimated Total Size
                </Text>
                <Text variant="body" weight="medium">
                  {formatFileSize(getTotalEstimatedSize())}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text variant="caption" color="secondary">
                  Format
                </Text>
                <Text variant="body" weight="medium">
                  {settings.format}
                </Text>
              </View>
            </View>
          </Card>
          
          {/* File Naming */}
          <Card style={styles.sectionCard} glassmorphism={true}>
            <Text variant="body" weight="semibold" style={styles.sectionTitle}>
              File Naming
            </Text>
            <View style={styles.fileNaming}>
              <Text variant="caption" color="secondary" style={styles.inputLabel}>
                File Name {processedImages.length > 1 ? '(Base)' : ''}
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: colors.surface,
                    color: colors.text.primary,
                    borderColor: colors.border,
                  },
                ]}
                value={settings.fileName}
                onChangeText={(text) => updateSettings('fileName', text)}
                placeholder="Enter file name..."
                placeholderTextColor={colors.text.tertiary}
              />
              {processedImages.length > 1 && (
                <Text variant="caption" color="tertiary" style={styles.hint}>
                  Files will be named: {settings.fileName}_1.{settings.format.toLowerCase()}, etc.
                </Text>
              )}
            </View>
          </Card>
          
          {/* Output Format */}
          <Card style={styles.sectionCard} glassmorphism={true}>
            <Text variant="body" weight="semibold" style={styles.sectionTitle}>
              Output Format
            </Text>
            <View style={styles.formatSelector}>
              {formats.map((format) => (
                <TouchableOpacity
                  key={format.value}
                  style={[
                    styles.formatButton,
                    settings.format === format.value && styles.formatButtonSelected,
                    {
                      backgroundColor: settings.format === format.value
                        ? Colors.primary.main
                        : colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => updateSettings('format', format.value)}
                >
                  <Text
                    variant="caption"
                    weight="medium"
                    style={{
                      color: settings.format === format.value ? '#ffffff' : colors.text.primary,
                    }}
                  >
                    {format.label}
                  </Text>
                  <Text
                    variant="caption"
                    style={{
                      color: settings.format === format.value
                        ? 'rgba(255,255,255,0.8)'
                        : colors.text.secondary,
                      fontSize: 11,
                      textAlign: 'center',
                    }}
                  >
                    {format.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card>
          
          {/* Quality Settings */}
          {settings.format !== 'PNG' && (
            <Card style={styles.sectionCard} glassmorphism={true}>
              <Text variant="body" weight="semibold" style={styles.sectionTitle}>
                Quality Settings
              </Text>
              <View style={styles.sliderContainer}>
                <View style={styles.sliderHeader}>
                  <Text variant="caption" color="secondary">
                    Quality
                  </Text>
                  <Text variant="caption" weight="medium">
                    {Math.round(settings.quality * 100)}%
                  </Text>
                </View>
                <Slider
                  style={styles.slider}
                  minimumValue={0.1}
                  maximumValue={1.0}
                  value={settings.quality}
                  onValueChange={(value) => updateSettings('quality', value)}
                  minimumTrackTintColor={Colors.primary.main}
                  maximumTrackTintColor={colors.border}
                  thumbStyle={styles.sliderThumb}
                  step={0.05}
                />
              </View>
            </Card>
          )}
          
          {/* DPI Settings */}
          <Card style={styles.sectionCard} glassmorphism={true}>
            <Text variant="body" weight="semibold" style={styles.sectionTitle}>
              Resolution (DPI)
            </Text>
            <View style={styles.dpiSelector}>
              {dpiOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.dpiButton,
                    settings.dpi === option.value && styles.dpiButtonSelected,
                    {
                      backgroundColor: settings.dpi === option.value
                        ? Colors.accent.main
                        : colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => updateSettings('dpi', option.value)}
                >
                  <Text
                    variant="caption"
                    weight="medium"
                    style={{
                      color: settings.dpi === option.value ? '#ffffff' : colors.text.primary,
                    }}
                  >
                    {option.label}
                  </Text>
                  <Text
                    variant="caption"
                    style={{
                      color: settings.dpi === option.value
                        ? 'rgba(255,255,255,0.8)'
                        : colors.text.secondary,
                      fontSize: 11,
                    }}
                  >
                    {option.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card>
          
          {/* Export Options */}
          <Card style={styles.sectionCard} glassmorphism={true}>
            <Text variant="body" weight="semibold" style={styles.sectionTitle}>
              Export Options
            </Text>
            <View style={styles.options}>
              <View style={styles.option}>
                <View style={styles.optionText}>
                  <Text variant="body">Overwrite Existing Files</Text>
                  <Text variant="caption" color="secondary">
                    Replace files with the same name
                  </Text>
                </View>
                <Switch
                  value={settings.overwrite}
                  onValueChange={(value) => updateSettings('overwrite', value)}
                  trackColor={{
                    false: colors.border,
                    true: Colors.primary.main,
                  }}
                  thumbColor={settings.overwrite ? '#ffffff' : colors.text.tertiary}
                />
              </View>
              
              {processedImages.length > 1 && (
                <View style={styles.option}>
                  <View style={styles.optionText}>
                    <Text variant="body">Create ZIP Archive</Text>
                    <Text variant="caption" color="secondary">
                      Bundle all images into a single ZIP file
                    </Text>
                  </View>
                  <Switch
                    value={settings.createZip}
                    onValueChange={(value) => updateSettings('createZip', value)}
                    trackColor={{
                      false: colors.border,
                      true: Colors.accent.main,
                    }}
                    thumbColor={settings.createZip ? '#ffffff' : colors.text.tertiary}
                  />
                </View>
              )}
            </View>
          </Card>
        </ScrollView>
        
        {/* Footer */}
        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <Button
            title="Cancel"
            onPress={onClose}
            variant="secondary"
            style={styles.footerButton}
          />
          <Button
            title={`Export ${processedImages.length} Image${processedImages.length !== 1 ? 's' : ''}`}
            onPress={handleExport}
            variant="primary"
            disabled={isSaving}
            loading={isSaving}
            style={styles.footerButton}
          />
        </View>
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
  },
  closeButton: {
    padding: Spacing.sm,
  },
  headerSpacer: {
    width: 40, // Same as close button for centering
  },
  content: {
    flex: 1,
    padding: Spacing.base,
  },
  summaryCard: {
    marginBottom: Spacing.md,
  },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  sectionCard: {
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  fileNaming: {
    gap: Spacing.sm,
  },
  inputLabel: {
    marginBottom: Spacing.xs,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    fontSize: 16,
  },
  hint: {
    fontStyle: 'italic',
  },
  formatSelector: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  formatButton: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  formatButtonSelected: {
    borderWidth: 0,
  },
  sliderContainer: {
    gap: Spacing.sm,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  dpiSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  dpiButton: {
    width: '48%',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  dpiButtonSelected: {
    borderWidth: 0,
  },
  options: {
    gap: Spacing.lg,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionText: {
    flex: 1,
    marginRight: Spacing.md,
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    gap: Spacing.md,
  },
  footerButton: {
    flex: 1,
  },
});

export default ImageExportModal;