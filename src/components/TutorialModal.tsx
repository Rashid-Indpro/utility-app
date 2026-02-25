import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  Image,
  StatusBar,
  Text,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '../contexts/ThemeContext';
import { Colors, Spacing, BorderRadius } from '../constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export type TutorialType = 
  | 'app-introduction' 
  | 'crop-tool' 
  | 'compress-tool' 
  | 'resize-tool' 
  | 'filters-tool'
  | 'watermark-tool'
  | 'text-tool'
  | 'converter-tool'
  | 'metadata-tool'
  | 'background-tool';

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  illustration?: string;
  tips?: string[];
  action?: {
    text: string;
    highlight: boolean;
  };
}

interface TutorialData {
  title: string;
  subtitle: string;
  steps: TutorialStep[];
  duration: string;
}

interface Props {
  visible: boolean;
  type: TutorialType;
  onClose: () => void;
  onComplete: () => void;
}

const tutorials: Record<TutorialType, TutorialData> = {
  'app-introduction': {
    title: 'Welcome to Pixozen',
    subtitle: 'Privacy-first image editing tools',
    duration: '3 min',
    steps: [
      {
        id: 'privacy',
        title: '100% Offline Privacy',
        description: 'Your images never leave your device. No cloud, no tracking, just local power.',
        illustration: 'shield-checkmark',
      },
      {
        id: 'batch',
        title: 'Professional Batch Tools',
        description: 'Process 50+ images at once with ease. Resize, compress, and convert in seconds.',
        illustration: 'folder-open',
      },
      {
        id: 'ownership',
        title: 'You Own Your Data',
        description: 'Owned by InteraMinds. Powerful tools for your professional workflow. Everything stays offline and secure.',
        illustration: 'trophy',
      },
    ],
  },
  'crop-tool': {
    title: 'Crop Tool',
    subtitle: 'Perfect framing for every platform',
    duration: '2 min',
    steps: [
      {
        id: 'basics',
        title: 'Basic Cropping',
        description: 'Select an image and drag the corners to resize the crop area. Tap and drag the center to move the selection.',
        illustration: '✂️',
        tips: ['Pinch to zoom for precision', 'Double-tap to fit image', 'Use grid for composition'],
      },
      {
        id: 'aspect-ratios',
        title: 'Aspect Ratios',
        description: 'Choose from common ratios like 1:1 (square), 4:3 (classic), or 16:9 (widescreen) for consistent results.',
        illustration: '📐',
        tips: ['Ratios lock proportions', 'Free crop allows any shape', 'Custom ratios available'],
      },
      {
        id: 'social-presets',
        title: 'Social Media Presets',
        description: 'Quick presets for Instagram posts, stories, Facebook covers, and other social platforms.',
        illustration: '📱',
        tips: ['Optimized for each platform', 'Saves time on sizing', 'Perfect fit guaranteed'],
      },
      {
        id: 'transforms',
        title: 'Transform Options',
        description: 'Rotate your image in 90° increments or flip horizontally/vertically before cropping.',
        illustration: '🔄',
        tips: ['Rotate before cropping', 'Mirror selfies easily', 'Fix orientation issues'],
      },
    ],
  },
  'compress-tool': {
    title: 'Compress Tool',
    subtitle: 'Optimize file sizes without quality loss',
    duration: '2 min',
    steps: [
      {
        id: 'basics',
        title: 'Smart Compression',
        description: 'Reduce file sizes while maintaining visual quality. Choose between target size or quality-based compression.',
        illustration: '🗜️',
        tips: ['AI-powered optimization', 'Real-time preview', 'Before/after comparison'],
      },
      {
        id: 'modes',
        title: 'Compression Modes',
        description: 'Target Size mode lets you specify exact file size limits. Quality mode preserves visual fidelity.',
        illustration: '⚖️',
        tips: ['Target size for email limits', 'Quality mode for printing', 'Preview shows file size'],
      },
      {
        id: 'presets',
        title: 'Quick Presets',
        description: 'Use presets optimized for web, email, social media, or print to get perfect results instantly.',
        illustration: '🎯',
        tips: ['Web: fast loading', 'Email: size limits', 'Social: platform specific'],
      },
      {
        id: 'batch',
        title: 'Batch Processing',
        description: 'Apply the same compression settings to multiple images at once for consistent results.',
        illustration: '📦',
        tips: ['Process multiple images', 'Consistent settings', 'Time-saving workflow'],
      },
    ],
  },
  'resize-tool': {
    title: 'Resize Tool',
    subtitle: 'Scale images to any dimension',
    duration: '2 min',
    steps: [
      {
        id: 'dimensions',
        title: 'Custom Dimensions',
        description: 'Set exact width and height values or use percentage scaling for precise control.',
        illustration: '📏',
      },
      {
        id: 'aspect-lock',
        title: 'Maintain Proportions',
        description: 'Lock aspect ratio to prevent distortion when resizing.',
        illustration: '🔒',
      },
    ],
  },
  'filters-tool': {
    title: 'Filters Tool',
    subtitle: 'Enhance your images with professional filters',
    duration: '3 min',
    steps: [
      {
        id: 'categories',
        title: 'Filter Categories',
        description: 'Browse artistic, vintage, black & white, and color enhancement filters.',
        illustration: '🎨',
      },
      {
        id: 'intensity',
        title: 'Adjust Intensity',
        description: 'Control how strong each filter effect appears on your image.',
        illustration: '🎚️',
      },
    ],
  },
  'watermark-tool': {
    title: 'Watermark Tool',
    subtitle: 'Protect your images with custom marks',
    duration: '2 min',
    steps: [
      {
        id: 'text-watermark',
        title: 'Text Watermarks',
        description: 'Add custom text with adjustable opacity, size, and position.',
        illustration: '📝',
      },
      {
        id: 'logo-watermark',
        title: 'Logo Watermarks',
        description: 'Use your own logo or signature image as a watermark.',
        illustration: '🎭',
      },
    ],
  },
  'text-tool': {
    title: 'Text Tool',
    subtitle: 'Add beautiful text to your images',
    duration: '3 min',
    steps: [
      {
        id: 'fonts',
        title: 'Font Selection',
        description: 'Choose from a variety of fonts to match your style.',
        illustration: '🔤',
      },
      {
        id: 'styling',
        title: 'Text Styling',
        description: 'Adjust color, size, alignment, and add shadows or outlines.',
        illustration: '✨',
      },
    ],
  },
  'converter-tool': {
    title: 'Converter Tool',
    subtitle: 'Change image formats effortlessly',
    duration: '1 min',
    steps: [
      {
        id: 'formats',
        title: 'Format Options',
        description: 'Convert between JPEG, PNG, WEBP, and other popular formats.',
        illustration: '🔄',
      },
      {
        id: 'batch-convert',
        title: 'Batch Conversion',
        description: 'Convert multiple images to the same format at once.',
        illustration: '📦',
      },
    ],
  },
  'metadata-tool': {
    title: 'Metadata Tool',
    subtitle: 'View and edit image information',
    duration: '2 min',
    steps: [
      {
        id: 'view-data',
        title: 'View Metadata',
        description: 'See camera settings, GPS location, timestamps, and technical details.',
        illustration: '📊',
      },
      {
        id: 'remove-data',
        title: 'Remove for Privacy',
        description: 'Strip sensitive metadata like location data before sharing.',
        illustration: '🔒',
      },
    ],
  },
  'background-tool': {
    title: 'Background Tool',
    subtitle: 'Remove and replace backgrounds with AI',
    duration: '2 min',
    steps: [
      {
        id: 'auto-remove',
        title: 'Automatic Removal',
        description: 'AI automatically detects and removes the background from your image.',
        illustration: '🤖',
      },
      {
        id: 'replace',
        title: 'Replace Background',
        description: 'Add solid colors, gradients, or your own images as new backgrounds.',
        illustration: '🎨',
      },
    ],
  },
};

const TutorialModal: React.FC<Props> = ({ visible, type, onClose, onComplete }) => {
  const { colors } = useTheme();
  const [currentStep, setCurrentStep] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const slideAnimation = useRef(new Animated.Value(0)).current;
  const progressAnimation = useRef(new Animated.Value(0)).current;
  
  const tutorial = tutorials[type];
  const totalSteps = tutorial.steps.length;
  const progress = (currentStep + 1) / totalSteps;
  
  useEffect(() => {
    if (visible) {
      setCurrentStep(0);
      setIsCompleted(false);
      progressAnimation.setValue(0);
      slideAnimation.setValue(0);
    }
  }, [visible, type]);
  
  useEffect(() => {
    Animated.spring(progressAnimation, {
      toValue: progress,
      useNativeDriver: false,
      tension: 100,
      friction: 8,
    }).start();
  }, [progress]);
  
  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      Animated.timing(slideAnimation, {
        toValue: -(currentStep + 1) * SCREEN_WIDTH,
        duration: 250,
        useNativeDriver: true,
      }).start();
      setCurrentStep(currentStep + 1);
    } else {
      setIsCompleted(true);
    }
  };
  
  const handlePrevious = () => {
    if (currentStep > 0) {
      Animated.timing(slideAnimation, {
        toValue: -(currentStep - 1) * SCREEN_WIDTH,
        duration: 250,
        useNativeDriver: true,
      }).start();
      setCurrentStep(currentStep - 1);
    }
  };
  
  const handleComplete = () => {
    onComplete();
    onClose();
  };
  
  const handleSkip = () => {
    onClose();
  };
  
  if (!tutorial) return null;

  const getCurrentStepData = () => tutorial.steps[currentStep];
  const currentStepData = getCurrentStepData();
  const isDarkMode = currentStep < 2; // First 2 screens are dark
  const bgColor = isDarkMode ? '#1c1c2e' : '#f8f8f8';
  const textColor = isDarkMode ? '#ffffff' : '#1a1d2e';
  const subtextColor = isDarkMode ? '#9ba3b4' : '#6b7280';

  const renderIllustration = () => {
    const step = currentStepData;
    
    if (step.id === 'privacy') {
      // Screen 1: Shield with camera
      return (
        <View style={[styles.illustrationCard, { backgroundColor: '#2a2a45' }]}>
          <View style={[styles.iconCircle, { backgroundColor: '#35354f' }]}>
            <View style={styles.shieldContainer}>
              <Ionicons name="shield" size={110} color="#5b5ff9" />
              <View style={styles.cameraIconOverlay}>
                <Ionicons name="camera" size={48} color="#ffffff" />
              </View>
            </View>
          </View>
        </View>
      );
    } else if (step.id === 'batch') {
      // Screen 2: Folder with files
      return (
        <View style={[styles.illustrationCard, { backgroundColor: '#2a2a45' }]}>
          <View style={[styles.iconCircle, { backgroundColor: '#35354f' }]}>
            <Ionicons name="folder-open" size={100} color="#5b5ff9" />
          </View>
        </View>
      );
    } else if (step.id === 'ownership') {
      // Screen 3: Trophy person illustration
      // Note: Using simplified version - replace with actual illustration asset for 100% match
      return (
        <View style={[styles.illustrationCard, { backgroundColor: '#f5d5a0' }]}>
          <View style={styles.trophyIllustration}>
            {/* Person */}
            <View style={styles.personContainer}>
              <View style={styles.personHead} />
              <View style={styles.personBody} />
              <View style={styles.personArms} />
            </View>
            {/* Trophy on left */}
            <View style={styles.trophyLeft}>
              <Ionicons name="trophy" size={56} color="#d4a574" />
            </View>
            {/* Medal on right */}
            <View style={styles.medalRight}>
              <View style={styles.medalBadge}>
                <Ionicons name="checkmark" size={32} color="#fff" />
              </View>
            </View>
            {/* Decorative leaves */}
            <View style={styles.leafLeft}>
              <Ionicons name="leaf" size={44} color="#d4a574" />
            </View>
            <View style={styles.leafRight}>
              <Ionicons name="leaf" size={38} color="#d4a574" />
            </View>
          </View>
        </View>
      );
    }
    return null;
  };

  const renderFloatingIcons = () => {
    const step = currentStepData;
    
    if (step.id === 'privacy') {
      return (
        <>
          <View style={[styles.floatingIcon, { top: '20%', right: '10%' }]}>
            <View style={styles.floatingCircle}>
              <Ionicons name="lock-closed" size={26} color="#5b5ff9" />
            </View>
          </View>
          <View style={[styles.floatingIcon, { bottom: '48%', left: '8%' }]}>
            <View style={styles.floatingCircle}>
              <Ionicons name="eye-off" size={24} color="#5b5ff9" />
            </View>
          </View>
        </>
      );
    } else if (step.id === 'batch') {
      return (
        <>
          <View style={[styles.floatingIcon, { top: '18%', left: '10%' }]}>
            <View style={styles.floatingCircle}>
              <Ionicons name="color-wand" size={22} color="#5b5ff9" />
            </View>
          </View>
          <View style={[styles.floatingIcon, { top: '16%', right: '12%' }]}>
            <View style={styles.floatingCircle}>
              <Ionicons name="images" size={26} color="#5b5ff9" />
            </View>
          </View>
          <View style={[styles.floatingIcon, { bottom: '50%', left: '14%' }]}>
            <View style={styles.floatingCircle}>
              <Ionicons name="book" size={20} color="#5b5ff9" />
            </View>
          </View>
        </>
      );
    }
    return null;
  };
  
  return (
    <Modal
      visible={visible}
      animationType="fade"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      <View style={[styles.container, { backgroundColor: bgColor }]}>
        {/* Skip Button */}
        <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
          <Text style={[styles.skipText, { color: isDarkMode ? '#9ba3b4' : '#5b5ff9' }]}>
            Skip
          </Text>
        </TouchableOpacity>

        {/* Floating Icons */}
        {isDarkMode && renderFloatingIcons()}
        
        {/* Main Content */}
        <View style={styles.contentWrapper}>
          {/* Illustration */}
          <View style={styles.illustrationWrapper}>
            {renderIllustration()}
          </View>
          
          {/* Title */}
          <Text style={[styles.title, { color: textColor }]}>
            {currentStepData.title}
          </Text>
          
          {/* Description */}
          <Text style={[styles.description, { color: subtextColor }]}>
            {currentStepData.description}
          </Text>
        </View>
        
        {/* Bottom Section */}
        <View style={styles.bottomSection}>
          {/* Progress Dots */}
          <View style={styles.dotsContainer}>
            {tutorial.steps.map((_, idx) => (
              <View
                key={idx}
                style={[
                  styles.dot,
                  {
                    backgroundColor: idx === currentStep
                      ? '#6366f1'
                      : isDarkMode ? '#4a4a6a' : '#d0d0d0',
                    width: idx === currentStep ? 32 : 8,
                  },
                ]}
              />
            ))}
          </View>
          
          {/* Next Button */}
          <TouchableOpacity
            style={styles.nextButton}
            onPress={currentStep === tutorial.steps.length - 1 ? handleComplete : handleNext}
          >
            <LinearGradient
              colors={['#5b5ff9', '#8b5cf6', '#a855f7']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.nextButtonGradient}
            >
              <Text style={styles.nextButtonText}>
                {currentStep === tutorial.steps.length - 1 ? 'Get Started' : 'Next'}
              </Text>
              <Ionicons name="arrow-forward" size={20} color="#ffffff" style={{ marginLeft: 8 }} />
            </LinearGradient>
          </TouchableOpacity>
          
          {/* Privacy Badge - Only on Screen 2 */}
          {currentStep === 1 && (
            <View style={styles.privacyBadge}>
              <Ionicons name="lock-closed" size={12} color="#8b8b9a" />
              <Text style={styles.privacyText}>PRIVACY-FIRST PROCESSING</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skipButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 100,
    padding: 12,
  },
  skipText: {
    fontSize: 17,
    fontWeight: '500',
  },
  floatingIcon: {
    position: 'absolute',
    zIndex: 1,
  },
  floatingCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(42, 42, 69, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(91, 95, 249, 0.25)',
  },
  contentWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  illustrationWrapper: {
    marginBottom: 50,
  },
  illustrationCard: {
    width: SCREEN_WIDTH - 70,
    height: SCREEN_WIDTH - 70,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
  },
  iconCircle: {
    width: 180,
    height: 180,
    borderRadius: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shieldContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    width: 100,
    height: 100,
  },
  cameraIconOverlay: {
    position: 'absolute',
    top: 30,
    left: 26,
  },
  trophyIllustration: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  personContainer: {
    alignItems: 'center',
    zIndex: 2,
  },
  personHead: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#2d3e50',
    marginBottom: 2,
  },
  personBody: {
    width: 85,
    height: 95,
    backgroundColor: '#f4f4f4',
    borderRadius: 12,
    position: 'relative',
    zIndex: 1,
  },
  personArms: {
    width: 140,
    height: 12,
    backgroundColor: '#f4f4f4',
    borderRadius: 6,
    position: 'absolute',
    top: 85,
  },
  trophyLeft: {
    position: 'absolute',
    left: 30,
    bottom: 75,
    zIndex: 0,
  },
  medalRight: {
    position: 'absolute',
    right: 25,
    top: 45,
    zIndex: 0,
  },
  medalBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f9a825',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fdd835',
  },
  leafLeft: {
    position: 'absolute',
    left: 45,
    bottom: 120,
    transform: [{ rotate: '-25deg' }],
    opacity: 0.6,
  },
  leafRight: {
    position: 'absolute',
    right: 50,
    bottom: 100,
    transform: [{ rotate: '30deg' }],
    opacity: 0.6,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 14,
    lineHeight: 40,
    paddingHorizontal: 20,
    letterSpacing: -0.5,
  },
  description: {
    fontSize: 17,
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: 32,
    fontWeight: '400',
  },
  bottomSection: {
    paddingBottom: 40,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  nextButton: {
    width: SCREEN_WIDTH - 80,
    marginBottom: 20,
  },
  nextButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 19,
    borderRadius: 18,
    elevation: 10,
    shadowColor: '#5b5ff9',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
  },
  nextButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  privacyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  privacyText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#8b8b9a',
    letterSpacing: 0.8,
  },
});

export default TutorialModal;