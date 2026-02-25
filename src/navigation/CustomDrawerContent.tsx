import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import {
  DrawerContentScrollView,
  DrawerContentComponentProps,
} from '@react-navigation/drawer';
import { MaterialIcons } from '@expo/vector-icons';

import { Text, Card } from '@/components';
import { useTheme } from '@/contexts/ThemeContext';
import { Colors, Spacing, Typography } from '@/constants/theme';

interface DrawerMenuItem {
  id: string;
  title: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  type: 'internal' | 'external';
  url?: string;
  onPress?: () => void;
}

const CustomDrawerContent: React.FC<DrawerContentComponentProps> = (props) => {
  const { colors } = useTheme();
  
  // Handle social media modal
  const handleFollowUs = () => {
    Alert.alert(
      'Follow Us',
      'Choose a platform to follow us on:',
      [
        {
          text: 'Instagram',
          onPress: () => Linking.openURL('https://instagram.com/interaminds'),
        },
        {
          text: 'Twitter/X',
          onPress: () => Linking.openURL('https://x.com/interaminds'),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };
  
  // Handle internal web view navigation
  const handleInternalNavigation = (url: string, title: string) => {
    props.navigation.navigate('WebView', { url, title });
  };
  
  // Drawer menu items as per requirements
  const menuItems: DrawerMenuItem[] = [
    {
      id: 'team',
      title: 'Team',
      icon: 'group',
      type: 'internal',
      url: 'https://interaminds.com/#founders',
      onPress: () => handleInternalNavigation('https://interaminds.com/#founders', 'Team'),
    },
    {
      id: 'privacy',
      title: 'Privacy Policy',
      icon: 'privacy-tip',
      type: 'internal',
      url: 'https://interaminds.com/#privacy',
      onPress: () => handleInternalNavigation('https://interaminds.com/#privacy', 'Privacy Policy'),
    },
    {
      id: 'terms',
      title: 'Terms & Conditions',
      icon: 'description',
      type: 'internal',
      url: 'https://interaminds.com/#terms',
      onPress: () => handleInternalNavigation('https://interaminds.com/#terms', 'Terms & Conditions'),
    },
    {
      id: 'contact',
      title: 'Contact Us',
      icon: 'contact-mail',
      type: 'internal',
      url: 'https://interaminds.com/#contact',
      onPress: () => handleInternalNavigation('https://interaminds.com/#contact', 'Contact Us'),
    },
    {
      id: 'follow',
      title: 'Follow Us',
      icon: 'share',
      type: 'external',
      onPress: handleFollowUs,
    },
  ];
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text variant="h3" color="gradient" weight="bold">
          Pixozen
        </Text>
        <Text variant="caption" color="secondary" style={styles.tagline}>
          Powerful Image Tools. Zero Cloud.
        </Text>
        <Text variant="caption" color="tertiary" style={styles.ownership}>
          Owned by InteraMinds
        </Text>
      </View>
      
      {/* Menu Items */}
      <ScrollView 
        style={styles.menuContainer}
        showsVerticalScrollIndicator={false}
      >
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.menuItem,
              { borderBottomColor: colors.borderLight }
            ]}
            onPress={item.onPress}
            activeOpacity={0.7}
          >
            <MaterialIcons
              name={item.icon}
              size={24}
              color={colors.text.secondary}
              style={styles.menuIcon}
            />
            <Text variant="body" style={styles.menuText}>
              {item.title}
            </Text>
            <MaterialIcons
              name={item.type === 'external' ? 'open-in-new' : 'chevron-right'}
              size={20}
              color={colors.text.tertiary}
            />
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      {/* Footer */}
      <View style={styles.footer}>
        <Text variant="caption" color="tertiary" align="center">
          Made with ❤️
        </Text>
        <Text variant="caption" color="tertiary" align="center">
          Made in 🇮🇳 India
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Spacing['3xl'],
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  tagline: {
    marginTop: Spacing.xs,
  },
  ownership: {
    marginTop: Spacing.xs,
  },
  menuContainer: {
    flex: 1,
    paddingTop: Spacing.base,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.base,
    borderBottomWidth: 1,
  },
  menuIcon: {
    marginRight: Spacing.md,
    width: 24,
  },
  menuText: {
    flex: 1,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderLight,
  },
});

export default CustomDrawerContent;