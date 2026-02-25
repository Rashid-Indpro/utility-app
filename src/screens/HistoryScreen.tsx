import React from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { Text, Card, Button } from '@/components';
import { useTheme } from '@/contexts/ThemeContext';
import { useImageProcessing } from '@/contexts/ImageProcessingContext';
import { Colors, Spacing, BorderRadius } from '@/constants/theme';
import { RootStackParamList } from '@/navigation/AppNavigator';

interface Props {
  navigation: StackNavigationProp<RootStackParamList, 'History'>;
}

const HistoryScreen: React.FC<Props> = ({ navigation }) => {
  const { colors } = useTheme();
  const { history, removeFromHistory, clearHistory } = useImageProcessing();
  
  const goBack = () => {
    navigation.goBack();
  };
  
  const handleClearAll = () => {
    Alert.alert(
      'Clear History',
      'Are you sure you want to clear all history? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: clearHistory,
        },
      ]
    );
  };
  
  const handleDeleteItem = (id: string) => {
    Alert.alert(
      'Delete Item',
      'Are you sure you want to delete this item from history?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => removeFromHistory(id),
        },
      ]
    );
  };
  
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
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
            History
          </Text>
        </View>
        
        {history.length > 0 && (
          <TouchableOpacity onPress={handleClearAll} style={styles.actionButton}>
            <MaterialIcons name="clear-all" size={24} color="#ffffff" />
          </TouchableOpacity>
        )}
      </LinearGradient>
      
      {/* Content */}
      <View style={styles.content}>
        {history.length === 0 ? (
          <Card style={styles.emptyCard} glassmorphism={true}>
            <View style={styles.emptyState}>
              <MaterialIcons 
                name="history" 
                size={64} 
                color={colors.text.tertiary} 
                style={styles.emptyIcon}
              />
              <Text variant="h4" color="secondary" align="center">
                No History Yet
              </Text>
              <Text variant="body" color="tertiary" align="center" style={styles.emptyText}>
                Your processed images will appear here
              </Text>
            </View>
          </Card>
        ) : (
          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.historyList}
          >
            <Text variant="caption" color="secondary" style={styles.historyCount}>
              {history.length} item{history.length !== 1 ? 's' : ''} (last 20 shown)
            </Text>
            
            {history.map((item) => (
              <Card key={item.id} style={styles.historyItem} glassmorphism={true}>
                <View style={styles.historyContent}>
                  <View style={styles.thumbnailContainer}>
                    <Image 
                      source={{ uri: item.thumbnail }} 
                      style={styles.thumbnail}
                      resizeMode="cover"
                    />
                  </View>
                  
                  <View style={styles.historyInfo}>
                    <Text variant="body" weight="medium">
                      {item.toolUsed}
                    </Text>
                    <Text variant="caption" color="secondary">
                      {formatDate(item.dateTime)}
                    </Text>
                    <Text variant="caption" color="tertiary">
                      Format: {item.format.toUpperCase()}
                    </Text>
                  </View>
                  
                  <View style={styles.historyActions}>
                    <TouchableOpacity 
                      style={styles.actionIcon}
                      onPress={() => {/* Re-edit functionality */}}
                    >
                      <MaterialIcons name="edit" size={20} color={Colors.primary.main} />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={styles.actionIcon}
                      onPress={() => handleDeleteItem(item.id)}
                    >
                      <MaterialIcons name="delete" size={20} color={Colors.status.error} />
                    </TouchableOpacity>
                  </View>
                </View>
              </Card>
            ))}
          </ScrollView>
        )}
        
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
              History is stored locally on your device only.
            </Text>
          </View>
        </Card>
      </View>
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
  actionButton: {
    padding: Spacing.sm,
  },
  content: {
    flex: 1,
    padding: Spacing.base,
  },
  emptyCard: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
  },
  emptyIcon: {
    marginBottom: Spacing.lg,
  },
  emptyText: {
    marginTop: Spacing.sm,
  },
  historyList: {
    paddingBottom: Spacing.xl,
  },
  historyCount: {
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  historyItem: {
    marginBottom: Spacing.md,
  },
  historyContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  thumbnailContainer: {
    marginRight: Spacing.md,
  },
  thumbnail: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.sm,
  },
  historyInfo: {
    flex: 1,
  },
  historyActions: {
    flexDirection: 'row',
  },
  actionIcon: {
    padding: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  privacyCard: {
    marginTop: Spacing.lg,
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

export default HistoryScreen;