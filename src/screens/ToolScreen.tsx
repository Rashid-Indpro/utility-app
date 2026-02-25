import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { Text, Card, Button } from '../components';
import { useTheme } from '../contexts/ThemeContext';
import { useImageTools } from '../hooks/useImageTools';
import { Colors, Spacing } from '../constants/theme';
import type { RootStackParamList } from '../navigation/AppNavigator';
import type { HistoryItem } from '../utils/storage';

// Import tool components
import CropTool from '../components/tools/CropTool';
import ResizeTool from '../components/tools/ResizeTool';
import CompressTool from '../components/tools/CompressTool';
import FiltersTool from '../components/tools/FiltersTool';
import WatermarkTool from '../components/tools/WatermarkTool';
import TextTool from '../components/tools/TextTool';
import ConverterTool from '../components/tools/ConverterTool';
import MetadataTool from '../components/tools/MetadataTool';
import BackgroundTool from '../components/tools/BackgroundTool';

interface Props {
  navigation: StackNavigationProp<RootStackParamList, 'Tool'>;
  route: RouteProp<RootStackParamList, 'Tool'>;
}

const ToolScreen: React.FC<Props> = ({ navigation, route }) => {
  const { colors } = useTheme();
  const { toolName, toolType, historyItem } = route.params;
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const { picker } = useImageTools();
  
  // Handle re-editing from history
  useEffect(() => {
    if (historyItem) {
      // Load the original input image for re-editing
      setSelectedImages([historyItem.inputPath]);
    }
  }, [historyItem]);
  
  const goBack = () => {
    navigation.goBack();
  };
  
  const selectImages = async () => {
    try {
      const images = await picker.pickImages();
      const uris = images.map(img => img.uri);
      setSelectedImages(uris);
    } catch (error) {
      Alert.alert('Error', 'Failed to select images');
    }
  };
  
  const selectSingleImage = async () => {
    try {
      const image = await picker.pickImage();
      if (image) {
        setSelectedImages([image.uri]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to select image');
    }
  };
  
  const renderTool = () => {
    const commonProps = {
      selectedImages,
      onImagesChange: setSelectedImages,
      historyItem, // Pass history item for re-editing
    };
    
    switch (toolType) {
      case 'crop':
        return <CropTool {...commonProps} />;
      case 'resize':
        return <ResizeTool {...commonProps} />;
      case 'compress':
        return <CompressTool {...commonProps} />;
      case 'filters':
        return <FiltersTool {...commonProps} />;
      case 'watermark':
        return <WatermarkTool {...commonProps} />;
      case 'text':
        return <TextTool {...commonProps} />;
      case 'converter':
        return <ConverterTool {...commonProps} />;
      case 'metadata':
        return <MetadataTool {...commonProps} />;
      case 'background':
        return <BackgroundTool {...commonProps} />;
      default:
        return (
          <Card style={styles.placeholderCard} glassmorphism={true}>
            <View style={styles.placeholder}>
              <MaterialIcons 
                name="construction" 
                size={48} 
                color={Colors.primary.main} 
                style={styles.placeholderIcon}
              />
              <Text variant="h4" align="center" style={styles.placeholderTitle}>
                {toolName}
              </Text>
              <Text variant="body" color="secondary" align="center" style={styles.placeholderMessage}>
                Tool implementation in progress...
              </Text>
            </View>
          </Card>
        );
    }
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={Colors.primary.start}
        translucent={false}
      />
      
      {/* Header */}
      <LinearGradient
        colors={[Colors.primary.start, Colors.primary.end]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity onPress={goBack} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text variant="h4" style={styles.headerTitle}>
            {toolName}
          </Text>
        </View>
        
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.actionButton}>
            <MaterialIcons name="settings" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>
      
      {/* Banner Ad Placeholder */}
      <Card style={styles.bannerAd} glassmorphism={false}>
        <Text variant="caption" color="tertiary" align="center">
          Banner Ad Placeholder
        </Text>
      </Card>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Image Selection */}
        {selectedImages.length === 0 ? (
          <Card style={styles.imageSelectionCard} glassmorphism={true}>
            <View style={styles.imageSelection}>
              <MaterialIcons 
                name="add-photo-alternate" 
                size={48} 
                color={Colors.primary.main} 
                style={styles.selectionIcon}
              />
              <Text variant="h4" align="center" style={styles.selectionTitle}>
                Select Images
              </Text>
              <Text variant="body" color="secondary" align="center" style={styles.selectionMessage}>
                Choose one or more images to get started
              </Text>
              
              <View style={styles.selectionButtons}>
                <Button
                  title="Select Single"
                  onPress={selectSingleImage}
                  variant="primary"
                  style={styles.selectionButton}
                />
                <Button
                  title="Select Multiple"
                  onPress={selectImages}
                  variant="secondary"
                  style={styles.selectionButton}
                />
              </View>
            </View>
          </Card>
        ) : (
          <View style={styles.selectedImagesHeader}>
            <Text variant="body" weight="medium">
              {selectedImages.length} image{selectedImages.length !== 1 ? 's' : ''} selected
            </Text>
            <TouchableOpacity onPress={() => setSelectedImages([])}>
              <Text variant="caption" color="accent">
                Clear Selection
              </Text>
            </TouchableOpacity>
          </View>
        )}
        
        {/* Tool Component */}
        {selectedImages.length > 0 && renderTool()}
        
        {/* Privacy Reminder */}
        <Card style={styles.privacyCard} glassmorphism={true}>
          <View style={styles.privacyContent}>
            <MaterialIcons 
              name="security" 
              size={20} 
              color={Colors.accent.main} 
              style={styles.privacyIcon}
            />
            <Text variant="caption" style={styles.privacyText}>
              Your images never leave your device.
            </Text>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
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
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  backButton: {
    padding: Spacing.sm,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    color: '#ffffff',
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: Spacing.sm,
  },
  bannerAd: {
    height: 60,
    marginHorizontal: Spacing.base,
    marginTop: Spacing.sm,
    justifyContent: 'center',
    backgroundColor: Colors.light.borderLight,
  },
  content: {
    flex: 1,
    padding: Spacing.base,
  },
  imageSelectionCard: {
    marginTop: Spacing.lg,
    paddingVertical: Spacing.xl,
  },
  imageSelection: {
    alignItems: 'center',
  },
  selectionIcon: {
    marginBottom: Spacing.lg,
    padding: Spacing.base,
    borderRadius: 50,
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
  },
  selectionTitle: {
    marginBottom: Spacing.md,
  },
  selectionMessage: {
    marginBottom: Spacing.xl,
    textAlign: 'center',
  },
  selectionButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  selectionButton: {
    minWidth: 120,
  },
  selectedImagesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  placeholderCard: {
    marginTop: Spacing.lg,
    paddingVertical: Spacing.xl,
  },
  placeholder: {
    alignItems: 'center',
  },
  placeholderIcon: {
    marginBottom: Spacing.lg,
    padding: Spacing.base,
    borderRadius: 50,
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
  },
  placeholderTitle: {
    marginBottom: Spacing.md,
  },
  placeholderMessage: {
    marginBottom: Spacing.sm,
  },
  privacyCard: {
    marginTop: Spacing.auto,
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
  },
});

export default ToolScreen;