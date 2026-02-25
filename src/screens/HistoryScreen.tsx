import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  Text,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { Card, Button } from '@/components';
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
  const [activeTab, setActiveTab] = useState<'all' | 'compressed' | 'upscaled' | 'converted'>('all');
  
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
      hour12: true,
    }).format(date);
  };
  
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };
  
  // Filter history based on active tab
  const filteredHistory = history.filter(item => {
    if (activeTab === 'all') return true;
    if (activeTab === 'compressed') return item.operation === 'compress';
    if (activeTab === 'upscaled') return item.operation === 'resize';
    if (activeTab === 'converted') return item.operation === 'converter';
    return true;
  });
  
  const getOperationBadge = (operation: string) => {
    switch (operation) {
      case 'compress':
        return { label: 'COMPRESSED', detail: '• -45%', color: '#5b5ff9' };
      case 'resize':
        return { label: 'UPSCALED', detail: '• 4X AI', color: '#5b5ff9' };
      case 'converter':
        return { label: 'CONVERTED', detail: '• HEIC TO WEBP', color: '#5b5ff9' };
      case 'background':
        return { label: 'REMOVED BACKGROUND', detail: '', color: '#5b5ff9' };
      default:
        return { label: operation.toUpperCase(), detail: '', color: '#5b5ff9' };
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#ffffff"
        translucent={false}
      />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color="#5b5ff9" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Processing History</Text>
        
        {history.length > 0 && (
          <TouchableOpacity onPress={handleClearAll}>
            <Text style={styles.clearAllText}>Clear All</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={styles.tabItem} 
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}>
            All
          </Text>
          {activeTab === 'all' && <View style={styles.activeTabIndicator} />}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.tabItem} 
          onPress={() => setActiveTab('compressed')}
        >
          <Text style={[styles.tabText, activeTab === 'compressed' && styles.activeTabText]}>
            Compressed
          </Text>
          {activeTab === 'compressed' && <View style={styles.activeTabIndicator} />}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.tabItem} 
          onPress={() => setActiveTab('upscaled')}
        >
          <Text style={[styles.tabText, activeTab === 'upscaled' && styles.activeTabText]}>
            Upscaled
          </Text>
          {activeTab === 'upscaled' && <View style={styles.activeTabIndicator} />}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.tabItem} 
          onPress={() => setActiveTab('converted')}
        >
          <Text style={[styles.tabText, activeTab === 'converted' && styles.activeTabText]}>
            Converted
          </Text>
          {activeTab === 'converted' && <View style={styles.activeTabIndicator} />}
        </TouchableOpacity>
      </View>
      
      {/* Content */}
      <View style={styles.content}>
        {filteredHistory.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons 
              name="history" 
              size={64} 
              color="#d0d5dd" 
              style={styles.emptyIcon}
            />
            <Text style={styles.emptyTitle}>No History Yet</Text>
            <Text style={styles.emptyText}>
              Your processed images will appear here
            </Text>
          </View>
        ) : (
          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.historyList}
          >
            {filteredHistory.map((item) => {
              const badge = getOperationBadge(item.operation);
              return (
                <View key={item.id} style={styles.historyItem}>
                  <View style={styles.thumbnailContainer}>
                    <Image 
                      source={{ uri: item.thumbnail }} 
                      style={styles.thumbnail}
                      resizeMode="cover"
                    />
                    <View style={styles.formatBadge}>
                      <Text style={styles.formatText}>
                        {item.format.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.historyInfo}>
                    <View style={styles.badgeRow}>
                      <Text style={styles.badgeLabel}>{badge.label}</Text>
                      {badge.detail !== '' && (
                        <Text style={styles.badgeDetail}>{badge.detail}</Text>
                      )}
                    </View>
                    
                    <Text style={styles.fileName} numberOfLines={1}>
                      {item.fileName || `${item.operation}_image_01.${item.format}`}
                    </Text>
                    
                    <View style={styles.metaRow}>
                      <Text style={styles.metaText}>
                        {formatDate(item.dateTime)}
                      </Text>
                      <Text style={styles.metaText}> • </Text>
                      <Text style={styles.metaText}>
                        {formatFileSize(item.fileSize || 2400000)}
                      </Text>
                    </View>
                    
                    <View style={styles.actionsRow}>
                      <TouchableOpacity style={styles.reEditButton}>
                        <Ionicons name="create-outline" size={16} color="#5b5ff9" />
                        <Text style={styles.reEditText}>Re-edit</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity style={styles.iconButton}>
                        <Ionicons name="share-outline" size={20} color="#6b7280" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  <TouchableOpacity 
                    style={styles.deleteButton}
                    onPress={() => handleDeleteItem(item.id)}
                  >
                    <MaterialIcons name="delete-outline" size={22} color="#9ca3af" />
                  </TouchableOpacity>
                </View>
              );
            })}
          </ScrollView>
        )}
      </View>
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
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1d2e',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  clearAllText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#5b5ff9',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingTop: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tabItem: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    position: 'relative',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#8991a0',
  },
  activeTabText: {
    color: '#1a1d2e',
    fontWeight: '600',
  },
  activeTabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#5b5ff9',
  },
  content: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2d3142',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: '#8991a0',
    textAlign: 'center',
  },
  historyList: {
    padding: 20,
    paddingBottom: 40,
  },
  historyItem: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  thumbnailContainer: {
    marginRight: 14,
    position: 'relative',
  },
  thumbnail: {
    width: 90,
    height: 90,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
  },
  formatBadge: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(26, 29, 46, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  formatText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
  },
  historyInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  badgeLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#5b5ff9',
    letterSpacing: 0.5,
  },
  badgeDetail: {
    fontSize: 11,
    fontWeight: '600',
    color: '#5b5ff9',
    marginLeft: 4,
  },
  fileName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1d2e',
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  metaText: {
    fontSize: 13,
    color: '#8991a0',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reEditButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0ff',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    marginRight: 12,
  },
  reEditText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5b5ff9',
    marginLeft: 6,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
});

export default HistoryScreen;