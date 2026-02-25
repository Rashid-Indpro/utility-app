import React from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';

import { useTheme } from '@/contexts/ThemeContext';
import { BorderRadius, Spacing, Shadows } from '@/constants/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  glassmorphism?: boolean;
  padding?: keyof typeof Spacing;
  borderRadius?: keyof typeof BorderRadius;
  shadow?: keyof typeof Shadows;
  onPress?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  glassmorphism = false,
  padding = 'lg',
  borderRadius = 'lg',
  shadow = 'md',
}) => {
  const { colors, isDark } = useTheme();
  
  const cardStyle: ViewStyle = {
    backgroundColor: glassmorphism ? colors.surfaceGlass : colors.surface,
    borderRadius: BorderRadius[borderRadius],
    padding: Spacing[padding],
    ...Shadows[shadow],
    shadowColor: colors.shadow,
  };
  
  if (glassmorphism) {
    return (
      <BlurView
        intensity={isDark ? 20 : 10}
        tint={isDark ? 'dark' : 'light'}
        style={[cardStyle, style]}
      >
        {children}
      </BlurView>
    );
  }
  
  return (
    <View style={[cardStyle, style]}>
      {children}
    </View>
  );
};