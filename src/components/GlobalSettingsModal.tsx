import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { Text } from './Text';
import { Card } from './Card';
import { Button } from './Button';
import { useTheme } from '../contexts/ThemeContext';
import { useSettings } from '../hooks/useStorage';
import { Colors, Spacing, BorderRadius } from '../constants/theme';
import type { AppSettings } from '../utils/storage';

interface Props {
  visible: boolean;
  onClose: () => void;
}

const GlobalSettingsModal: React.FC<Props> = ({ visible, onClose }) => {
  const { colors, toggleTheme, isDark } = useTheme();
  const { settings, updateSettings, resetToDefaults, isLoading } = useSettings();
  
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  
  // Update local settings when global settings change
  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);
  
  const handleSave = async () => {
    try {
      await updateSettings(localSettings);
      Alert.alert('Settings Saved', 'Your preferences have been updated.');
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to save settings. Please try again.');
    }
  };
  
  const handleReset = () => {
    Alert.alert(
      'Reset Settings',
      'Are you sure you want to reset all settings to defaults?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await resetToDefaults();
              Alert.alert('Settings Reset', 'All settings have been reset to defaults.');
            } catch (error) {
              Alert.alert('Error', 'Failed to reset settings.');
            }
          },
        },
      ]
    );
  };
  
  const updateLocalSetting = <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };
  
  const formatOptions = [
    { value: 'JPEG' as const, label: 'JPEG', description: 'Best for photos' },
    { value: 'PNG' as const, label: 'PNG', description: 'Supports transparency' },
    { value: 'WEBP' as const, label: 'WEBP', description: 'Modern, efficient' },
  ];
  
  const compressionOptions = [
    { value: 'high' as const, label: 'High', description: 'Smaller files, lower quality' },
    { value: 'medium' as const, label: 'Medium', description: 'Balanced' },
    { value: 'low' as const, label: 'Low', description: 'Larger files, higher quality' },
  ];
  
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
            Settings
          </Text>
          <TouchableOpacity onPress={handleReset} style={styles.resetButton}>
            <Text variant="caption" color="accent">
              Reset
            </Text>
          </TouchableOpacity>
        </View>
        
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Appearance */}
          <Card style={styles.sectionCard} glassmorphism={true}>
            <Text variant="body" weight="semibold" style={styles.sectionTitle}>
              Appearance
            </Text>
            <View style={styles.setting}>
              <View style={styles.settingText}>
                <Text variant="body">Dark Mode</Text>
                <Text variant="caption" color="secondary">
                  Switch between light and dark themes
                </Text>
              </View>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{
                  false: colors.border,
                  true: Colors.primary.main,
                }}
                thumbColor={isDark ? '#ffffff' : colors.text.tertiary}
              />
            </View>
          </Card>
          
          {/* Default Export Settings */}
          <Card style={styles.sectionCard} glassmorphism={true}>
            <Text variant="body" weight="semibold" style={styles.sectionTitle}>
              Default Export Settings
            </Text>
            
            {/* Default Format */}
            <View style={styles.settingGroup}>
              <Text variant="caption" color="secondary" style={styles.groupLabel}>
                Default Format
              </Text>
              <View style={styles.optionButtons}>
                {formatOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.optionButton,
                      localSettings.defaultFormat === option.value && styles.optionButtonSelected,
                      {
                        backgroundColor: localSettings.defaultFormat === option.value
                          ? Colors.primary.main
                          : colors.surface,
                        borderColor: colors.border,
                      },
                    ]}
                    onPress={() => updateLocalSetting('defaultFormat', option.value)}
                  >
                    <Text
                      variant="caption"
                      weight="medium"
                      style={{
                        color: localSettings.defaultFormat === option.value
                          ? '#ffffff'
                          : colors.text.primary,
                      }}
                    >
                      {option.label}
                    </Text>
                    <Text
                      variant="caption"
                      style={{
                        color: localSettings.defaultFormat === option.value
                          ? 'rgba(255,255,255,0.8)'
                          : colors.text.secondary,
                        fontSize: 11,
                        textAlign: 'center',
                      }}
                    >
                      {option.description}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            {/* Default Quality */}
            <View style={styles.settingGroup}>
              <View style={styles.sliderHeader}>
                <Text variant="caption" color="secondary">
                  Default Quality
                </Text>
                <Text variant="caption" weight="medium">
                  {Math.round(localSettings.defaultQuality * 100)}%
                </Text>
              </View>
              <View style={styles.qualitySlider}>
                <TouchableOpacity
                  onPress={() => updateLocalSetting('defaultQuality', 0.6)}
                  style={[styles.qualityPreset, localSettings.defaultQuality === 0.6 && styles.qualityPresetSelected]}
                >
                  <Text variant="caption">Low</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => updateLocalSetting('defaultQuality', 0.8)}
                  style={[styles.qualityPreset, localSettings.defaultQuality === 0.8 && styles.qualityPresetSelected]}
                >
                  <Text variant="caption">Medium</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => updateLocalSetting('defaultQuality', 1.0)}
                  style={[styles.qualityPreset, localSettings.defaultQuality === 1.0 && styles.qualityPresetSelected]}
                >
                  <Text variant="caption">High</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Compression Level */}
            <View style={styles.settingGroup}>
              <Text variant="caption" color="secondary" style={styles.groupLabel}>
                Default Compression
              </Text>
              <View style={styles.compressionButtons}>
                {compressionOptions.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.compressionButton,
                      localSettings.compressionLevel === option.value && styles.compressionButtonSelected,
                      {
                        backgroundColor: localSettings.compressionLevel === option.value
                          ? Colors.accent.main
                          : colors.surface,
                        borderColor: colors.border,
                      },
                    ]}
                    onPress={() => updateLocalSetting('compressionLevel', option.value)}
                  >
                    <Text
                      variant="caption"
                      weight="medium"
                      style={{
                        color: localSettings.compressionLevel === option.value
                          ? '#ffffff'
                          : colors.text.primary,
                      }}
                    >
                      {option.label}
                    </Text>
                    <Text
                      variant="caption"
                      style={{
                        color: localSettings.compressionLevel === option.value
                          ? 'rgba(255,255,255,0.8)'
                          : colors.text.secondary,
                        fontSize: 11,
                        textAlign: 'center',
                      }}
                    >
                      {option.description}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </Card>
          
          {/* Behavioral Settings */}
          <Card style={styles.sectionCard} glassmorphism={true}>
            <Text variant="body" weight="semibold" style={styles.sectionTitle}>
              Behavior
            </Text>
            
            <View style={styles.setting}>
              <View style={styles.settingText}>
                <Text variant="body">Auto Save</Text>
                <Text variant="caption" color="secondary">
                  Automatically save processed images
                </Text>
              </View>
              <Switch
                value={localSettings.autoSave}
                onValueChange={(value) => updateLocalSetting('autoSave', value)}
                trackColor={{
                  false: colors.border,
                  true: Colors.primary.main,
                }}
                thumbColor={localSettings.autoSave ? '#ffffff' : colors.text.tertiary}
              />
            </View>
            
            <View style={styles.setting}>
              <View style={styles.settingText}>
                <Text variant="body">Show Tutorials</Text>
                <Text variant="caption" color="secondary">
                  Display helpful tips and tutorials
                </Text>
              </View>
              <Switch
                value={localSettings.showTutorials}
                onValueChange={(value) => updateLocalSetting('showTutorials', value)}
                trackColor={{
                  false: colors.border,
                  true: Colors.primary.main,
                }}
                thumbColor={localSettings.showTutorials ? '#ffffff' : colors.text.tertiary}
              />
            </View>
            
            <View style={styles.setting}>
              <View style={styles.settingText}>
                <Text variant="body">Haptic Feedback</Text>
                <Text variant="caption" color="secondary">
                  Vibration feedback for interactions
                </Text>
              </View>
              <Switch
                value={localSettings.hapticFeedback}
                onValueChange={(value) => updateLocalSetting('hapticFeedback', value)}
                trackColor={{
                  false: colors.border,
                  true: Colors.primary.main,
                }}
                thumbColor={localSettings.hapticFeedback ? '#ffffff' : colors.text.tertiary}
              />
            </View>
          </Card>
          
          {/* Privacy Notice */}
          <Card style={styles.privacyCard} glassmorphism={true}>
            <View style={styles.privacyContent}>
              <MaterialIcons 
                name="security" 
                size={20} 
                color={Colors.accent.main} 
                style={styles.privacyIcon}
              />
              <Text variant="caption" style={styles.privacyText}>
                Your settings are stored locally on your device only.
              </Text>
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
            title="Save Settings"
            onPress={handleSave}
            variant="primary"
            disabled={isLoading}
            loading={isLoading}
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
    justifyContent: 'space-between',
  },
  closeButton: {
    padding: Spacing.sm,
  },
  resetButton: {
    padding: Spacing.sm,
  },
  content: {
    flex: 1,
    padding: Spacing.base,
  },
  sectionCard: {
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  setting: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  settingText: {
    flex: 1,
    marginRight: Spacing.md,
  },
  settingGroup: {
    marginBottom: Spacing.lg,
  },
  groupLabel: {
    marginBottom: Spacing.sm,
  },
  optionButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  optionButton: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  optionButtonSelected: {
    borderWidth: 0,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  qualitySlider: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  qualityPreset: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  qualityPresetSelected: {
    backgroundColor: Colors.primary.main,
  },
  compressionButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  compressionButton: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  compressionButtonSelected: {
    borderWidth: 0,
  },
  privacyCard: {
    marginBottom: Spacing.lg,
  },
  privacyContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  privacyIcon: {
    marginRight: Spacing.sm,
  },
  privacyText: {
    textAlign: 'center',
    flex: 1,
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

export default GlobalSettingsModal;