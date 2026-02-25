import React from 'react';
import {
  TouchableOpacity,
  Text,
  View,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { useTheme } from '@/contexts/ThemeContext';
import { Colors, Typography, Spacing, BorderRadius } from '@/constants/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
  haptic?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  style,
  textStyle,
  fullWidth = false,
  haptic = true,
}) => {
  const { colors, isDark } = useTheme();
  
  const handlePress = () => {
    if (disabled || loading) return;
    
    if (haptic) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    onPress();
  };
  
  const getButtonStyles = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: BorderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
    };
    
    // Size styles
    switch (size) {
      case 'small':
        baseStyle.paddingHorizontal = Spacing.md;
        baseStyle.paddingVertical = Spacing.sm;
        baseStyle.minHeight = 36;
        break;
      case 'large':
        baseStyle.paddingHorizontal = Spacing.xl;
        baseStyle.paddingVertical = Spacing.base;
        baseStyle.minHeight = 56;
        break;
      default: // medium
        baseStyle.paddingHorizontal = Spacing.lg;
        baseStyle.paddingVertical = Spacing.md;
        baseStyle.minHeight = 48;
    }
    
    if (fullWidth) {
      baseStyle.width = '100%';
    }
    
    // Variant styles
    switch (variant) {
      case 'secondary':
        return {
          ...baseStyle,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
        };
      case 'accent':
        return {
          ...baseStyle,
          backgroundColor: Colors.accent.main,
        };
      case 'ghost':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
        };
      default: // primary
        return baseStyle;
    }
  };
  
  const getTextStyles = (): TextStyle => {
    const baseTextStyle: TextStyle = {
      fontWeight: Typography.fontWeight.semibold,
      textAlign: 'center',
    };
    
    // Size styles
    switch (size) {
      case 'small':
        baseTextStyle.fontSize = Typography.fontSize.sm;
        break;
      case 'large':
        baseTextStyle.fontSize = Typography.fontSize.lg;
        break;
      default: // medium
        baseTextStyle.fontSize = Typography.fontSize.base;
    }
    
    // Color styles based on variant
    switch (variant) {
      case 'secondary':
      case 'ghost':
        baseTextStyle.color = colors.text.primary;
        break;
      default:
        baseTextStyle.color = '#ffffff';
    }
    
    if (disabled) {
      baseTextStyle.color = colors.text.tertiary;
    }
    
    return baseTextStyle;
  };
  
  const buttonStyles = getButtonStyles();
  const textStyles = getTextStyles();
  
  const ButtonComponent = variant === 'primary' ? LinearGradient : View;
  const gradientProps = variant === 'primary' ? {
    colors: [Colors.primary.start, Colors.primary.end],
    start: { x: 0, y: 0 },
    end: { x: 1, y: 1 },
  } : {};
  
  return (
    <TouchableOpacity
      style={[
        styles.touchable,
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        style,
      ]}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      <ButtonComponent
        {...gradientProps}
        style={[
          buttonStyles,
          disabled && styles.disabledBackground,
        ]}
      >
        {loading ? (
          <ActivityIndicator
            size="small"
            color={variant === 'primary' ? '#ffffff' : colors.text.primary}
          />
        ) : (
          <View style={styles.content}>
            {icon && <View style={styles.icon}>{icon}</View>}
            <Text style={[textStyles, textStyle]}>{title}</Text>
          </View>
        )}
      </ButtonComponent>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  touchable: {
    overflow: 'hidden',
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.6,
  },
  disabledBackground: {
    opacity: 0.6,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: Spacing.sm,
  },
});