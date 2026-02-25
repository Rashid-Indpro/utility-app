import React from 'react';
import { Text as RNText, TextStyle, TextProps as RNTextProps } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';

import { useTheme } from '@/contexts/ThemeContext';
import { Typography, Colors } from '@/constants/theme';

interface TextProps extends Omit<RNTextProps, 'style'> {
  children: React.ReactNode;
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'caption' | 'button';
  color?: 'primary' | 'secondary' | 'tertiary' | 'accent' | 'gradient';
  weight?: keyof typeof Typography.fontWeight;
  align?: 'left' | 'center' | 'right';
  style?: TextStyle;
}

export const Text: React.FC<TextProps> = ({
  children,
  variant = 'body',
  color = 'primary',
  weight,
  align = 'left',
  style,
  ...props
}) => {
  const { colors } = useTheme();
  
  const getVariantStyles = (): TextStyle => {
    switch (variant) {
      case 'h1':
        return {
          fontSize: Typography.fontSize['4xl'],
          fontWeight: Typography.fontWeight.bold,
          lineHeight: Typography.fontSize['4xl'] * Typography.lineHeight.tight,
        };
      case 'h2':
        return {
          fontSize: Typography.fontSize['3xl'],
          fontWeight: Typography.fontWeight.bold,
          lineHeight: Typography.fontSize['3xl'] * Typography.lineHeight.tight,
        };
      case 'h3':
        return {
          fontSize: Typography.fontSize['2xl'],
          fontWeight: Typography.fontWeight.semibold,
          lineHeight: Typography.fontSize['2xl'] * Typography.lineHeight.snug,
        };
      case 'h4':
        return {
          fontSize: Typography.fontSize.xl,
          fontWeight: Typography.fontWeight.semibold,
          lineHeight: Typography.fontSize.xl * Typography.lineHeight.snug,
        };
      case 'caption':
        return {
          fontSize: Typography.fontSize.sm,
          fontWeight: Typography.fontWeight.normal,
          lineHeight: Typography.fontSize.sm * Typography.lineHeight.normal,
        };
      case 'button':
        return {
          fontSize: Typography.fontSize.base,
          fontWeight: Typography.fontWeight.semibold,
          lineHeight: Typography.fontSize.base * Typography.lineHeight.normal,
        };
      default: // body
        return {
          fontSize: Typography.fontSize.base,
          fontWeight: Typography.fontWeight.normal,
          lineHeight: Typography.fontSize.base * Typography.lineHeight.normal,
        };
    }
  };
  
  const getColorStyles = (): TextStyle => {
    switch (color) {
      case 'secondary':
        return { color: colors.text.secondary };
      case 'tertiary':
        return { color: colors.text.tertiary };
      case 'accent':
        return { color: Colors.accent.main };
      case 'gradient':
        return {}; // Handled separately with gradient
      default: // primary
        return { color: colors.text.primary };
    }
  };
  
  const textStyle: TextStyle = {
    ...getVariantStyles(),
    ...getColorStyles(),
    textAlign: align,
    fontFamily: Typography.fontFamily.regular,
    ...(weight && { fontWeight: Typography.fontWeight[weight] }),
    ...style,
  };
  
  // Handle gradient text
  if (color === 'gradient') {
    return (
      <MaskedView
        maskElement={
          <RNText
            style={[textStyle, { color: 'transparent' }]}
            {...props}
          >
            {children}
          </RNText>
        }
      >
        <LinearGradient
          colors={[Colors.primary.start, Colors.primary.end]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <RNText
            style={[textStyle, { opacity: 0 }]}
            {...props}
          >
            {children}
          </RNText>
        </LinearGradient>
      </MaskedView>
    );
  }
  
  return (
    <RNText style={textStyle} {...props}>
      {children}
    </RNText>
  );
};