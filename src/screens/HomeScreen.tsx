import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Text,
} from 'react-native';
import { DrawerActions } from '@react-navigation/drawer';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { 
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
  iconColor: string;
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
  
  // Quick Actions as per requirements - update icons to match design
  const quickActions: QuickAction[] = [
    {
      id: 'compress500',
      title: 'Compress to\n500KB',
      icon: 'compress',
      iconColor: '#5b5ff9',
      action: () => navigation.navigate('Tool', { toolName: 'Compress to 500KB', toolType: 'compress' }),
    },
    {
      id: 'instagram',
      title: 'Instagram\nSize',
      icon: 'crop-square',
      iconColor: '#ec4899',
      action: () => navigation.navigate('Tool', { toolName: 'Instagram Size', toolType: 'crop' }),
    },
    {
      id: 'resize1080',
      title: 'Resize\n1080p',
      icon: 'photo-size-select-large',
      iconColor: '#8b5cf6',
      action: () => navigation.navigate('Tool', { toolName: 'Resize 1080p', toolType: 'resize' }),
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
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#f8f8f8"
        translucent={false}
      />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={openDrawer} style={styles.menuButton}>
          <View style={styles.menuIconCircle}>
            <MaterialIcons name="menu" size={24} color="#5b5ff9" />
          </View>
        </TouchableOpacity>
        
        <Text style={styles.appName}>PIXOZEN</Text>
        
        <TouchableOpacity onPress={openSettings} style={styles.userButton}>
          <View style={styles.userIconCircle}>
            <MaterialIcons name="person" size={24} color="#ffffff" />
          </View>
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.heroIconContainer}>
            <View style={styles.heroIconGlow}>
              <View style={styles.heroIconCircle}>
                <Ionicons name="image-outline" size={42} color="#5b5ff9" />
                <View style={styles.magnifyIcon}>
                  <Ionicons name="search" size={20} color="#5b5ff9" />
                </View>
              </View>
            </View>
          </View>
          
          <Text style={styles.heroTitle}>
            Powerful Image Tools.{'\n'}
            <Text style={styles.heroTitleBlue}>Zero Cloud.</Text>
          </Text>
          
          <Text style={styles.ownership}>Owned by InteraMinds</Text>
        </View>
        
        {/* PRO Feature Card */}
        <View style={styles.proCard}>
          <Text style={styles.proLabel}>PRO FEATURE</Text>
          <Text style={styles.proTitle}>Batch Process Images Offline</Text>
          <TouchableOpacity style={styles.upgradeButton}>
            <LinearGradient
              colors={['#5b5ff9', '#8b5cf6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.upgradeGradient}
            >
              <Text style={styles.upgradeText}>Upgrade Now</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
        
        {/* Quick Action Bar */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>QUICK ACTION BAR</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickActionsScroll}
          >
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.quickActionCard}
                onPress={action.action}
                activeOpacity={0.7}
              >
                <View style={styles.quickActionIconCircle}>
                  <MaterialIcons 
                    name={action.icon} 
                    size={28} 
                    color={action.iconColor} 
                  />
                </View>
                <Text style={styles.quickActionText}>{action.title}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        
        {/* Main Tool Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>MAIN TOOL GRID</Text>
          <View style={styles.toolGrid}>
            {tools.map((tool) => (
              <TouchableOpacity
                key={tool.id}
                style={styles.toolCard}
                onPress={() => handleToolPress(tool)}
                activeOpacity={0.7}
              >
                <View style={styles.toolIconCircle}>
                  <MaterialIcons 
                    name={tool.icon} 
                    size={28} 
                    color="#5b5ff9" 
                  />
                </View>
                <Text style={styles.toolName}>{tool.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
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
    backgroundColor: '#f8f8f8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  menuButton: {
    width: 44,
    height: 44,
  },
  menuIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e8e8f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1d2e',
    letterSpacing: 0.5,
  },
  userButton: {
    width: 44,
    height: 44,
  },
  userIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#5b5ff9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  heroIconContainer: {
    marginBottom: 30,
  },
  heroIconGlow: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(91, 95, 249, 0.08)',
    shadowColor: '#5b5ff9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  heroIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  magnifyIcon: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1a1d2e',
    textAlign: 'center',
    lineHeight: 36,
    marginBottom: 8,
  },
  heroTitleBlue: {
    color: '#5b5ff9',
  },
  ownership: {
    fontSize: 14,
    color: '#8991a0',
    fontWeight: '400',
  },
  proCard: {
    backgroundColor: '#f0f0ff',
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 24,
    marginBottom: 30,
  },
  proLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7c7ff9',
    letterSpacing: 1,
    marginBottom: 8,
  },
  proTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1d2e',
    marginBottom: 16,
  },
  upgradeButton: {
    alignSelf: 'flex-start',
  },
  upgradeGradient: {
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 16,
  },
  upgradeText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
  section: {
    marginBottom: 30,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#a0a8b8',
    letterSpacing: 1,
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  quickActionsScroll: {
    paddingLeft: 20,
    paddingRight: 10,
  },
  quickActionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginRight: 12,
    width: 140,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  quickActionIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f5f5ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  quickActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2d3142',
    textAlign: 'center',
    lineHeight: 18,
  },
  toolGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 12,
  },
  toolCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    width: '30.5%',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    minHeight: 105,
    justifyContent: 'center',
  },
  toolIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f5f5ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  toolName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2d3142',
    textAlign: 'center',
  },
});

export default HomeScreen;