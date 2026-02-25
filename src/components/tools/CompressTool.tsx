import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  Alert,
  Text,
  TextInput,
  Switch,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { LinearGradient } from 'expo-linear-gradient';

import { useImageProcessor } from '../../hooks/useImageTools';
import type { ToolProps } from './types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CompressTool: React.FC<ToolProps> = ({ selectedImages, onImagesChange }) => {
  const { compressImage, isProcessing } = useImageProcessor();
  
  const [compressionQuality, setCompressionQuality] = useState(85);
  const [targetSize, setTargetSize] = useState('500');
  const [outputFormat, setOutputFormat] = useState('WebP');
  const [showBefore, setShowBefore] = useState(true);
  const [batchMode, setBatchMode] = useState(false);
  const [showFormatPicker, setShowFormatPicker] = useState(false);
  
  const currentImage = selectedImages[0];
  
  // Mock image info - in real app, get from actual image
  const imageInfo = {
    resolution: '4032 × 3024',
    fileSize: '12.4 MB',
    format: 'HEIC (Original)',
    dpi: '72 DPI',
  };
  
  const formats = ['WebP', 'JPEG', 'PNG', 'HEIC'];
  
  const handleCompress = () => {
    Alert.alert('Success', 'Image compressed successfully!');
  };
  
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Advertisement Space */}
      <View style={styles.adSpace}>
        <Text style={styles.adText}>ADVERTISEMENT SPACE</Text>
      </View>
      
      {/* Image Preview */}
      <View style={styles.previewSection}>
        <View style={styles.imagePreview}>
          {currentImage ? (
            <Image
              source={{ uri: currentImage }}
              style={styles.previewImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.placeholderImage}>
              <MaterialIcons name="image" size={64} color="#d0d5dd" />
              <Text style={styles.placeholderText}>No image selected</Text>
            </View>
          )}
          
          {/* BEFORE/AFTER Toggle */}
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[styles.toggleButton, !showBefore && styles.toggleButtonActive]}
              onPress={() => setShowBefore(false)}
            >
              <Text style={[styles.toggleText, !showBefore && styles.toggleTextActive]}>
                BEFORE
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, showBefore && styles.toggleButtonActive]}
              onPress={() => setShowBefore(true)}
            >
              <Text style={[styles.toggleText, showBefore && styles.toggleTextActive]}>
                AFTER
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Image Info Cards */}
        <View style={styles.infoGrid}>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>RESOLUTION</Text>
            <Text style={styles.infoValue}>{imageInfo.resolution}</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>FILE SIZE</Text>
            <Text style={styles.infoValue}>{imageInfo.fileSize}</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>FORMAT</Text>
            <Text style={styles.infoValue}>{imageInfo.format}</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>DPI</Text>
            <Text style={styles.infoValue}>{imageInfo.dpi}</Text>
          </View>
        </View>
      </View>
      
      {/* Compression Quality */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Compression Quality</Text>
          <Text style={styles.qualityValue}>{compressionQuality}%</Text>
        </View>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={100}
          value={compressionQuality}
          onValueChange={setCompressionQuality}
          minimumTrackTintColor="#5b5ff9"
          maximumTrackTintColor="#e5e7eb"
          thumbTintColor="#5b5ff9"
          step={1}
        />
      </View>
      
      {/* Target Size and Output Format */}
      <View style={styles.row}>
        <View style={styles.halfColumn}>
          <Text style={styles.label}>Target Size</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={targetSize}
              onChangeText={setTargetSize}
              keyboardType="numeric"
              placeholder="500"
            />
            <Text style={styles.inputUnit}>KB</Text>
          </View>
        </View>
        
        <View style={styles.halfColumn}>
          <Text style={styles.label}>Output Format</Text>
          <TouchableOpacity 
            style={styles.dropdown}
            onPress={() => setShowFormatPicker(!showFormatPicker)}
          >
            <Text style={styles.dropdownText}>{outputFormat}</Text>
            <MaterialIcons name="keyboard-arrow-down" size={20} color="#6b7280" />
          </TouchableOpacity>
          
          {showFormatPicker && (
            <View style={styles.formatPickerDropdown}>
              {formats.map((format) => (
                <TouchableOpacity
                  key={format}
                  style={styles.formatOption}
                  onPress={() => {
                    setOutputFormat(format);
                    setShowFormatPicker(false);
                  }}
                >
                  <Text style={[
                    styles.formatOptionText,
                    format === outputFormat && styles.formatOptionTextActive
                  ]}>
                    {format}
                  </Text>
                  {format === outputFormat && (
                    <MaterialIcons name="check" size={20} color="#5b5ff9" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>
      
      {/* Batch Mode */}
      <View style={styles.batchModeCard}>
        <View style={styles.batchModeIcon}>
          <Ionicons name="layers-outline" size={24} color="#5b5ff9" />
        </View>
        <View style={styles.batchModeInfo}>
          <Text style={styles.batchModeTitle}>Batch Mode</Text>
          <Text style={styles.batchModeDescription}>Process up to 50 images</Text>
        </View>
        <Switch
          value={batchMode}
          onValueChange={setBatchMode}
          trackColor={{ false: '#e5e7eb', true: '#c7d2fe' }}
          thumbColor={batchMode ? '#5b5ff9' : '#f3f4f6'}
        />
      </View>
      
      {/* Compress Button */}
      <TouchableOpacity 
        style={styles.compressButton}
        onPress={handleCompress}
        disabled={isProcessing}
      >
        <LinearGradient
          colors={['#5b5ff9', '#8b5cf6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.compressGradient}
        >
          <Ionicons name="flash" size={20} color="#ffffff" style={{marginRight: 8}} />
          <Text style={styles.compressText}>Compress & Save</Text>
        </LinearGradient>
      </TouchableOpacity>
      
      {/* Privacy Badge */}
      <View style={styles.privacyBadge}>
        <MaterialIcons name="lock-outline" size={14} color="#9ca3af" />
        <Text style={styles.privacyText}>
          PROCESSED LOCALLY ON DEVICE • 100% PRIVATE
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  adSpace: {
    backgroundColor: '#f0f0ff',
    borderRadius: 16,
    padding: 30,
    margin: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#e0e0ff',
    borderStyle: 'dashed',
  },
  adText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9095d6',
    letterSpacing: 1,
  },
  previewSection: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  imagePreview: {
    width: '100%',
    height: 380,
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 12,
  },
  toggleContainer: {
    position: 'absolute',
    bottom: 20,
    left: '50%',
    transform: [{ translateX: -90 }],
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    borderRadius: 12,
    padding: 4,
  },
  toggleButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  toggleButtonActive: {
    backgroundColor: '#5b5ff9',
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
    opacity: 0.7,
  },
  toggleTextActive: {
    opacity: 1,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  infoCard: {
    width: '50%',
    padding: 6,
  },
  infoCardInner: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 12,
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8991a0',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1d2e',
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1d2e',
  },
  qualityValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#5b5ff9',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  row: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  halfColumn: {
    flex: 1,
    position: 'relative',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1d2e',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#1a1d2e',
  },
  inputUnit: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8991a0',
    marginLeft: 8,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  dropdownText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1a1d2e',
  },
  formatPickerDropdown: {
    position: 'absolute',
    top: 76,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 8,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    zIndex: 1000,
  },
  formatOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
  },
  formatOptionText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1a1d2e',
  },
  formatOptionTextActive: {
    color: '#5b5ff9',
    fontWeight: '600',
  },
  batchModeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0ff',
    borderRadius: 20,
    padding: 18,
    marginHorizontal: 20,
    marginBottom: 24,
  },
  batchModeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  batchModeInfo: {
    flex: 1,
  },
  batchModeTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1d2e',
    marginBottom: 2,
  },
  batchModeDescription: {
    fontSize: 13,
    color: '#8991a0',
  },
  compressButton: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  compressGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 18,
    elevation: 6,
    shadowColor: '#5b5ff9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  compressText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  privacyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 30,
    gap: 6,
  },
  privacyText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#9ca3af',
    letterSpacing: 0.5,
  },
});

export default CompressTool;
