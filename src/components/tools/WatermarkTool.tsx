import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { Text } from '../Text';
import { Card } from '../Card';
import { Colors, Spacing } from '../../constants/theme';
import type { ToolProps } from './types';

const WatermarkTool: React.FC<ToolProps> = ({ selectedImages }) => {
  return (
    <Card style={styles.container} glassmorphism={true}>
      <View style={styles.placeholder}>
        <MaterialIcons 
          name="branding-watermark" 
          size={48} 
          color={Colors.primary.main} 
          style={styles.icon}
        />
        <Text variant="h4" align="center" style={styles.title}>
          Watermark Tool
        </Text>
        <Text variant="body" color="secondary" align="center" style={styles.message}>
          Text & image watermarks coming soon...
        </Text>
        <Text variant="caption" color="tertiary" align="center">
          {selectedImages.length} image{selectedImages.length !== 1 ? 's' : ''} selected
        </Text>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
    paddingVertical: Spacing.xl,
  },
  placeholder: {
    alignItems: 'center',
  },
  icon: {
    marginBottom: Spacing.lg,
    padding: Spacing.base,
    borderRadius: 50,
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
  },
  title: {
    marginBottom: Spacing.md,
  },
  message: {
    marginBottom: Spacing.sm,
  },
});

export default WatermarkTool;