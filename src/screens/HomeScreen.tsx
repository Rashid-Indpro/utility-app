import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { DrawerActions } from '@react-navigation/drawer';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { 
  Text, 
  Card, 
  Button, 
  GlobalSettingsModal, 
  TutorialModal, 
  HistoryModal 
} from '@/components';
import { useTheme } from '@/contexts/ThemeContext';
import { useImageProcessing } from '@/contexts/ImageProcessingContext';
import { useSettings } from '../hooks/useStorage';
import { Colors, Spacing, BorderRadius, Layout } from '@/constants/theme';
import { RootStackParamList } from '@/navigation/AppNavigator';
import type { TutorialType } from '../components/TutorialModal';

interface Props {
  navigation: StackNavigationProp<RootStackParamList, 'Main'>;
}

interface QuickAction {
  id: string;
  title: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  action: () => void;
}

interface Tool {
  id: string;
  name: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  type: 'crop' | 'resize' | 'compress' | 'filters' | 'watermark' | 'text' | 'converter' | 'metadata' | 'background';
  description: string;
}

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const { colors } = useTheme();
  const { selectedImages } = useImageProcessing();
  const { settings } = useSettings();
  
  // Modal states
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialType, setTutorialType] = useState<TutorialType>('app-introduction');
  
  // Show app introduction tutorial on first launch
  useEffect(() => {
    if (settings.showTutorials) {
      const timer = setTimeout(() => {
        setTutorialType('app-introduction');
        setShowTutorial(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [settings.showTutorials]);
  
  // Quick Actions as per requirements
  const quickActions: QuickAction[] = [
    {
      id: 'compress500',
      title: 'Compress to 500KB',
      icon: 'compress',
      action: () => navigation.navigate('Tool', { toolName: 'Compress to 500KB', toolType: 'compress' }),
    },
    {
      id: 'instagram',
      title: 'Instagram Post Size',
      icon: 'crop',
      action: () => navigation.navigate('Tool', { toolName: 'Instagram Post Size', toolType: 'crop' }),
    },
    {
      id: 'resize1080',
      title: 'Resize to 1080p',
      icon: 'photo-size-select-large',
      action: () => navigation.navigate('Tool', { toolName: 'Resize to 1080p', toolType: 'resize' }),
    },
    {
      id: 'metadata',
      title: 'Remove Metadata',
      icon: 'cleaning-services',
      action: () => navigation.navigate('Tool', { toolName: 'Remove Metadata', toolType: 'metadata' }),
    },
  ];
  
  // Main Tools as per requirements
  const tools: Tool[] = [
    {
      id: 'crop',
      name: 'Crop',
      icon: 'crop',
      type: 'crop',
      description: 'Crop and rotate images',
    },
    {
      id: 'resize',
      name: 'Resize',
      icon: 'photo-size-select-large',
      type: 'resize',
      description: 'Change image dimensions',
    },
    {
      id: 'compress',
      name: 'Compress',
      icon: 'compress',
      type: 'compress',
      description: 'Reduce file size',
    },
    {
      id: 'filters',
      name: 'Filters',
      icon: 'filter',
      type: 'filters',
      description: 'Apply visual effects',
    },
    {
      id: 'watermark',
      name: 'Watermark',
      icon: 'branding-watermark',
      type: 'watermark',
      description: 'Add text or image overlay',
    },
    {
      id: 'text',
      name: 'Text Editor',
      icon: 'text-fields',
      type: 'text',
      description: 'Add and style text',
    },
    {
      id: 'converter',
      name: 'Converter',
      icon: 'transform',
      type: 'converter',
      description: 'Change file format',
    },
    {
      id: 'metadata',
      name: 'Metadata',
      icon: 'info',
      type: 'metadata',
      description: 'View and remove data',
    },
    {
      id: 'background',
      name: 'Background Tool',
      icon: 'layers',
      type: 'background',
      description: 'Remove or change background',
    },
  ];
  
  const openDrawer = () => {
    navigation.dispatch(DrawerActions.openDrawer());
  };
  
  const navigateToTool = (tool: Tool) => {
    navigation.navigate('Tool', { 
      toolName: tool.name, 
      toolType: tool.type 
    });
  };
  
  const navigateToHistory = () => {
    setShowHistory(true);
  };
  
  const openSettings = () => {
    setShowSettings(true);
  };
  
  const showToolTutorial = (toolType: TutorialType) => {
    setTutorialType(toolType);
    setShowTutorial(true);
  };
  
  const handleToolPress = (tool: Tool) => {
    // Show tutorial if it's enabled
    if (settings.showTutorials) {
      const tutorialType = `${tool.type}-tool` as TutorialType;
      if (tutorialType !== 'app-introduction') {
        showToolTutorial(tutorialType);
        return;
      }
    }
    navigateToTool(tool);
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
        <TouchableOpacity onPress={openDrawer} style={styles.headerButton}>
          <MaterialIcons name="menu" size={24} color="#ffffff" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text variant="h2" style={styles.appName}>
            Pixozen
          </Text>
          <Text variant="caption" style={styles.tagline}>
            Powerful Image Tools. Zero Cloud.
          </Text>
          <Text variant="caption" style={styles.ownership}>
            Owned by InteraMinds
          </Text>
        </View>
        
        <TouchableOpacity onPress={navigateToHistory} style={styles.headerButton}>
          <MaterialIcons name="history" size={24} color="#ffffff" />
        </TouchableOpacity>
        
        <TouchableOpacity onPress={openSettings} style={styles.headerButton}>
          <MaterialIcons name="settings" size={24} color="#ffffff" />
        </TouchableOpacity>
      </LinearGradient>
      
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Top Banner Ad Placeholder */}
        <Card style={styles.bannerAd} glassmorphism={false}>
          <Text variant="caption" color="tertiary" align="center">
            Banner Ad Placeholder
          </Text>
        </Card>
        
        {/* Privacy Promise */}
        <Card style={styles.privacyCard} glassmorphism={true}>
          <View style={styles.privacyContent}>
            <MaterialIcons 
              name="security" 
              size={24} 
              color={Colors.accent.main} 
              style={styles.privacyIcon}
            />
            <Text variant="body" weight="medium" style={styles.privacyText}>
              Your images never leave your device.
            </Text>
          </View>
        </Card>
        
        {/* Quick Actions Bar */}
        <View style={styles.sectionContainer}>
          <Text variant="h4" weight="semibold" style={styles.sectionTitle}>
            Quick Actions
          </Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickActionsContainer}
          >
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.quickActionButton}
                onPress={action.action}
                activeOpacity={0.7}
              >
                <Card style={styles.quickActionCard} glassmorphism={true}>
                  <MaterialIcons 
                    name={action.icon} 
                    size={24} 
                    color={Colors.primary.main} 
                  />
                  <Text variant="caption" align="center" style={styles.quickActionText}>
                    {action.title}
                  </Text>
                </Card>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        
        {/* Main Tool Grid */}
        <View style={styles.sectionContainer}>
          <Text variant="h4" weight="semibold" style={styles.sectionTitle}>
            Image Tools
          </Text>
          <View style={styles.toolGrid}>
            {tools.map((tool) => (
              <TouchableOpacity
                key={tool.id}
                style={styles.toolButton}
                onPress={() => handleToolPress(tool)}
                activeOpacity={0.7}
              >
                <Card style={styles.toolCard} glassmorphism={true}>
                  <View style={styles.toolIcon}>
                    <MaterialIcons 
                      name={tool.icon} 
                      size={32} 
                      color={Colors.primary.main} 
                    />
                  </View>
                  <Text variant="body" weight="medium" align="center">
                    {tool.name}
                  </Text>
                  <Text variant="caption" color="secondary" align="center" style={styles.toolDescription}>
                    {tool.description}
                  </Text>
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        {/* Footer */}
        <View style={styles.footer}>
          <Text variant="caption" color="tertiary" align="center">
            Made with ❤️
          </Text>
          <Text variant="caption" color="tertiary" align="center">
            Made in 🇮🇳 India
          </Text>
        </View>
      </ScrollView>
      
      {/* Modals */}
      <GlobalSettingsModal
        visible={showSettings}
        onClose={() => setShowSettings(false)}
      />
      
      <TutorialModal
        visible={showTutorial}
        type={tutorialType}
        onClose={() => setShowTutorial(false)}
        onComplete={() => {
          setShowTutorial(false);
          // Navigate to tool if tutorial was for a specific tool
          if (tutorialType !== 'app-introduction') {
            const toolType = tutorialType.replace('-tool', '') as Tool['type'];
            const tool = tools.find(t => t.type === toolType);
            if (tool) {
              navigateToTool(tool);
            }
          }
        }}
      />
      
      <HistoryModal
        visible={showHistory}
        onClose={() => setShowHistory(false)}
        onReEdit={(item) => {
          // Navigate to the appropriate tool with the history item
          const tool = tools.find(t => t.type === item.operation as Tool['type']);
          if (tool) {
            navigation.navigate('Tool', {
              toolName: tool.name,
              toolType: tool.type,
              historyItem: item,
            });
          }
        }}
      />
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
  menuButton: {
    padding: Spacing.sm,
  },
  headerButton: {
    padding: Spacing.sm,
    marginHorizontal: Spacing.xs,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  appName: {
    color: '#ffffff',
    fontWeight: '700',
  },
  tagline: {
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  ownership: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xl,
  },
  bannerAd: {
    height: 80,
    marginHorizontal: Spacing.base,
    marginTop: Spacing.base,
    justifyContent: 'center',
    backgroundColor: Colors.light.borderLight,
  },
  privacyCard: {
    marginHorizontal: Spacing.base,
    marginTop: Spacing.base,
  },
  privacyContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  privacyIcon: {
    marginRight: Spacing.sm,
  },
  privacyText: {
    flex: 1,
  },
  sectionContainer: {
    marginTop: Spacing.xl,
  },
  sectionTitle: {
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.md,
  },
  quickActionsContainer: {
    paddingLeft: Spacing.base,
    paddingRight: Spacing.sm,
  },
  quickActionButton: {
    marginRight: Spacing.sm,
  },
  quickActionCard: {
    width: 100,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionText: {
    marginTop: Spacing.xs,
    lineHeight: 14,
  },
  toolGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.base,
    justifyContent: 'space-between',
  },
  toolButton: {
    width: '48%',
    marginBottom: Spacing.md,
  },
  toolCard: {
    minHeight: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toolIcon: {
    marginBottom: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
  },
  toolDescription: {
    marginTop: Spacing.xs,
  },
  footer: {
    marginTop: Spacing['3xl'],
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.xl,
  },
});

export default HomeScreen;