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
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { Text, Button } from './index';
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
        id: 'welcome',
        title: 'Your Images Stay Private',
        description: 'All image processing happens directly on your device. Your photos never leave your phone or get uploaded to any server.',
        illustration: '🔒',
        tips: ['No internet required for editing', 'Zero data collection', 'Complete offline functionality'],
      },
      {
        id: 'tools',
        title: '9 Professional Tools',
        description: 'Access crop, resize, compress, filters, watermark, text, converter, metadata, and background removal tools.',
        illustration: '🛠️',
        tips: ['One-tap quick actions', 'Batch processing support', 'Professional quality results'],
      },
      {
        id: 'navigation',
        title: 'Easy Navigation',
        description: 'Use the hamburger menu to access tools, history, and settings. Swipe gestures work throughout the app.',
        illustration: '🧭',
        tips: ['Pull-to-refresh in history', 'Swipe to dismiss modals', 'Long-press for quick actions'],
      },
      {
        id: 'export',
        title: 'Flexible Export Options',
        description: 'Choose from JPEG, PNG, or WEBP formats with custom quality settings. Batch export multiple images at once.',
        illustration: '📤',
        tips: ['Multiple format support', 'Quality presets available', 'Batch processing with ZIP export'],
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
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
            <Text variant="body" color="secondary">
              Skip
            </Text>
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <Text variant="h4" weight="semibold">
              {tutorial.title}
            </Text>
            <Text variant="caption" color="secondary">
              {tutorial.subtitle} • {tutorial.duration}
            </Text>
          </View>
          
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <MaterialIcons name="close" size={24} color={colors.text.primary} />
          </TouchableOpacity>
        </View>
        
        {/* Progress Bar */}
        <View style={[styles.progressContainer, { backgroundColor: colors.border }]}>
          <Animated.View
            style={[
              styles.progressBar,
              {
                backgroundColor: Colors.primary.main,
                width: progressAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
        
        {/* Steps Container */}
        <View style={styles.stepsContainer}>
          <Animated.View
            style={[
              styles.stepsWrapper,
              {
                transform: [{ translateX: slideAnimation }],
              },
            ]}
          >
            {tutorial.steps.map((step, index) => (
              <View key={step.id} style={styles.stepContainer}>
                <ScrollView
                  style={styles.stepContent}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.stepScrollContent}
                >
                  {/* Illustration */}
                  <View style={styles.illustrationContainer}>
                    <Text style={styles.illustration}>{step.illustration}</Text>
                  </View>
                  
                  {/* Content */}
                  <View style={styles.contentContainer}>
                    <Text variant="h3" weight="bold" style={styles.stepTitle}>
                      {step.title}
                    </Text>
                    
                    <Text variant="body" color="secondary" style={styles.stepDescription}>
                      {step.description}
                    </Text>
                    
                    {/* Tips */}
                    {step.tips && (
                      <View style={styles.tipsContainer}>
                        <Text variant="caption" weight="semibold" color="accent" style={styles.tipsTitle}>
                          💡 Tips:
                        </Text>
                        {step.tips.map((tip, tipIndex) => (
                          <View key={tipIndex} style={styles.tipItem}>
                            <Text variant="caption" style={styles.tipBullet}>•</Text>
                            <Text variant="caption" color="secondary" style={styles.tipText}>
                              {tip}
                            </Text>
                          </View>
                        ))}
                      </View>
                    )}
                    
                    {/* Action Highlight */}
                    {step.action && (
                      <View style={[styles.actionContainer, { borderColor: Colors.accent.main }]}>
                        <MaterialIcons 
                          name="touch-app" 
                          size={20} 
                          color={Colors.accent.main}
                          style={styles.actionIcon}
                        />
                        <Text variant="body" color="accent" weight="medium">
                          {step.action.text}
                        </Text>
                      </View>
                    )}
                  </View>
                </ScrollView>
              </View>
            ))}
          </Animated.View>
        </View>
        
        {/* Footer */}
        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <View style={styles.stepIndicator}>
            <Text variant="caption" color="secondary">
              {currentStep + 1} of {totalSteps}
            </Text>
          </View>
          
          <View style={styles.footerButtons}>
            {currentStep > 0 && (
              <Button
                title="Previous"
                onPress={handlePrevious}
                variant="secondary"
                style={styles.footerButton}
              />
            )}
            
            {isCompleted ? (
              <Button
                title="Get Started"
                onPress={handleComplete}
                variant="primary"
                style={[styles.footerButton, { flex: 1 }]}
              />
            ) : (
              <Button
                title={currentStep === totalSteps - 1 ? "Finish" : "Next"}
                onPress={handleNext}
                variant="primary"
                style={[styles.footerButton, { flex: 1 }]}
              />
            )}
          </View>
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
  skipButton: {
    padding: Spacing.sm,
    width: 60,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  closeButton: {
    padding: Spacing.sm,
    width: 60,
    alignItems: 'flex-end',
  },
  progressContainer: {
    height: 3,
    marginHorizontal: Spacing.base,
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 1.5,
  },
  stepsContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  stepsWrapper: {
    flexDirection: 'row',
    height: '100%',
  },
  stepContainer: {
    width: SCREEN_WIDTH,
    flex: 1,
  },
  stepContent: {
    flex: 1,
  },
  stepScrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.xl,
  },
  illustrationContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  illustration: {
    fontSize: 80,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  stepTitle: {
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  stepDescription: {
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing.xl,
  },
  tipsContainer: {
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  tipsTitle: {
    marginBottom: Spacing.sm,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.xs,
  },
  tipBullet: {
    marginRight: Spacing.sm,
    marginTop: 2,
  },
  tipText: {
    flex: 1,
    lineHeight: 18,
  },
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  actionIcon: {
    marginRight: Spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    justifyContent: 'space-between',
  },
  stepIndicator: {
    minWidth: 60,
  },
  footerButtons: {
    flexDirection: 'row',
    flex: 1,
    gap: Spacing.md,
    marginLeft: Spacing.md,
  },
  footerButton: {
    minWidth: 80,
  },
});

export default TutorialModal;