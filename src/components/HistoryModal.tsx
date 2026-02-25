import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  Animated,
  RefreshControl,
  ActionSheetIOS,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { getInfoAsync } from 'expo-file-system/legacy';

import { Text } from './Text';
import { Card } from './Card';
import { Button } from './Button';
import { useTheme } from '../contexts/ThemeContext';
import { useHistory } from '../hooks/useStorage';
import { Colors, Spacing, BorderRadius } from '../constants/theme';
import type { HistoryItem } from '../utils/storage';

interface Props {
  visible: boolean;
  onClose: () => void;
  onReEdit?: (item: HistoryItem) => void;
}

const HistoryModal: React.FC<Props> = ({ visible, onClose, onReEdit }) => {
  const { colors } = useTheme();
  const { history, clearHistory, removeHistoryItem, isLoading } = useHistory();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const fadeAnimation = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    if (visible) {
      setSelectedItems(new Set());
      setIsSelectionMode(false);
      Animated.timing(fadeAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);
  
  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh delay
    await new Promise(resolve => setTimeout(resolve, 500));
    setRefreshing(false);
  };
  
  const handleClearAll = () => {
    Alert.alert(
      'Clear History',
      'Are you sure you want to delete all history items? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearHistory();
              setIsSelectionMode(false);
              setSelectedItems(new Set());
            } catch (error) {
              Alert.alert('Error', 'Failed to clear history.');
            }
          },
        },
      ]
    );
  };
  
  const handleDeleteItem = (item: HistoryItem) => {
    Alert.alert(
      'Delete Item',
      'Are you sure you want to delete this history item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeHistoryItem(item.id);
              setSelectedItems(prev => {
                const newSet = new Set(prev);
                newSet.delete(item.id);
                return newSet;
              });
            } catch (error) {
              Alert.alert('Error', 'Failed to delete item.');
            }
          },
        },
      ]
    );
  };
  
  const handleDeleteSelected = () => {
    const count = selectedItems.size;
    Alert.alert(
      'Delete Selected',
      `Are you sure you want to delete ${count} item${count > 1 ? 's' : ''}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              for (const itemId of selectedItems) {
                await removeHistoryItem(itemId);
              }
              setSelectedItems(new Set());
              setIsSelectionMode(false);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete selected items.');
            }
          },
        },
      ]
    );
  };
  
  const handleShareItem = async (item: HistoryItem) => {
    try {
      const fileExists = await getInfoAsync(item.outputPath);
      if (!fileExists.exists) {
        Alert.alert('Error', 'The processed image file could not be found.');
        return;
      }
      
      await Sharing.shareAsync(item.outputPath, {
        mimeType: `image/${item.outputFormat.toLowerCase()}`,
        dialogTitle: 'Share processed image',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share image.');
    }
  };
  
  const handleItemLongPress = (item: HistoryItem) => {
    if (!isSelectionMode) {
      setIsSelectionMode(true);
      setSelectedItems(new Set([item.id]));
    }
  };
  
  const handleItemPress = (item: HistoryItem) => {
    if (isSelectionMode) {
      setSelectedItems(prev => {
        const newSet = new Set(prev);
        if (newSet.has(item.id)) {
          newSet.delete(item.id);
        } else {
          newSet.add(item.id);
        }
        return newSet;
      });
    } else {
      showItemActions(item);
    }
  };
  
  const showItemActions = (item: HistoryItem) => {
    const options = ['Re-Edit', 'Share', 'Delete', 'Cancel'];
    const destructiveButtonIndex = 2;
    const cancelButtonIndex = 3;
    
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          destructiveButtonIndex,
          cancelButtonIndex,
        },
        (buttonIndex) => {
          switch (buttonIndex) {
            case 0:
              onReEdit?.(item);
              onClose();
              break;
            case 1:
              handleShareItem(item);
              break;
            case 2:
              handleDeleteItem(item);
              break;
          }
        }
      );
    } else {
      Alert.alert(
        'Actions',
        `What would you like to do with this ${item.operation}?`,
        [
          { text: 'Re-Edit', onPress: () => { onReEdit?.(item); onClose(); } },
          { text: 'Share', onPress: () => handleShareItem(item) },
          { text: 'Delete', style: 'destructive', onPress: () => handleDeleteItem(item) },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    }
  };
  
  const handleSelectAll = () => {
    if (selectedItems.size === history.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(history.map(item => item.id)));
    }
  };
  
  const handleExitSelection = () => {
    setIsSelectionMode(false);
    setSelectedItems(new Set());
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };
  
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };
  
  const getOperationIcon = (operation: string) => {
    switch (operation) {
      case 'crop':
        return 'crop';
      case 'resize':
        return 'photo-size-select-large';
      case 'compress':
        return 'compress';
      case 'filter':
        return 'filter';
      case 'watermark':
        return 'branding-watermark';
      case 'text':
        return 'text-fields';
      case 'convert':
        return 'swap-horiz';
      case 'metadata':
        return 'info';
      case 'background':
        return 'layers-clear';
      default:
        return 'image';
    }
  };
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          {isSelectionMode ? (
            <>
              <TouchableOpacity onPress={handleExitSelection} style={styles.headerButton}>
                <MaterialIcons name="close" size={24} color={colors.text.primary} />
              </TouchableOpacity>
              <Text variant="h4" weight="semibold">
                {selectedItems.size} selected
              </Text>
              <TouchableOpacity onPress={handleSelectAll} style={styles.headerButton}>
                <Text variant="body" color="primary">
                  {selectedItems.size === history.length ? 'None' : 'All'}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity onPress={onClose} style={styles.headerButton}>
                <MaterialIcons name="close" size={24} color={colors.text.primary} />
              </TouchableOpacity>
              <Text variant="h4" weight="semibold">
                History ({history.length})
              </Text>
              <TouchableOpacity onPress={handleClearAll} style={styles.headerButton}>
                <MaterialIcons name="delete-outline" size={24} color={colors.text.secondary} />
              </TouchableOpacity>
            </>
          )}
        </View>
        
        {/* Content */}
        {history.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="history" size={48} color={colors.text.tertiary} />
            <Text variant="h4" color="secondary" style={styles.emptyTitle}>
              No History Yet
            </Text>
            <Text variant="body" color="tertiary" style={styles.emptyDescription}>
              Your processed images will appear here for easy access and re-editing.
            </Text>
          </View>
        ) : (
          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
            }
          >
            <Animated.View style={{ opacity: fadeAnimation }}>
              {history.map((item, index) => {
                const isSelected = selectedItems.has(item.id);
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.historyItem,
                      isSelected && { backgroundColor: Colors.primary.light + '20' },
                    ]}
                    onPress={() => handleItemPress(item)}
                    onLongPress={() => handleItemLongPress(item)}
                    delayLongPress={200}
                  >
                    <Card style={styles.itemCard} glassmorphism={true}>
                      <View style={styles.itemContent}>
                        {/* Selection Indicator */}
                        {isSelectionMode && (
                          <View style={styles.selectionIndicator}>
                            <MaterialIcons
                              name={isSelected ? 'check-circle' : 'radio-button-unchecked'}
                              size={24}
                              color={isSelected ? Colors.primary.main : colors.text.tertiary}
                            />
                          </View>
                        )}
                        
                        {/* Thumbnail */}
                        <View style={styles.thumbnailContainer}>
                          <Image source={{ uri: item.outputPath }} style={styles.thumbnail} />
                          <View style={styles.operationBadge}>
                            <MaterialIcons
                              name={getOperationIcon(item.operation) as any}
                              size={16}
                              color="#ffffff"
                            />
                          </View>
                        </View>
                        
                        {/* Details */}
                        <View style={styles.itemDetails}>
                          <View style={styles.itemHeader}>
                            <Text variant="body" weight="medium" numberOfLines={1}>
                              {item.operation.charAt(0).toUpperCase() + item.operation.slice(1)} Operation
                            </Text>
                            <Text variant="caption" color="secondary">
                              {formatDate(item.timestamp)}
                            </Text>
                          </View>
                          
                          <View style={styles.itemMeta}>
                            <Text variant="caption" color="tertiary">
                              {item.outputFormat.toUpperCase()}
                            </Text>
                            <Text variant="caption" color="tertiary">
                              •
                            </Text>
                            <Text variant="caption" color="tertiary">
                              {formatFileSize(item.outputSize || 0)}
                            </Text>
                            {item.inputSize && (
                              <>
                                <Text variant="caption" color="tertiary">
                                  •
                                </Text>
                                <Text variant="caption" color="accent">
                                  {Math.round(((item.inputSize - (item.outputSize || 0)) / item.inputSize) * 100)}% saved
                                </Text>
                              </>
                            )}
                          </View>
                          
                          {item.settings && Object.keys(item.settings).length > 0 && (
                            <View style={styles.settingsBadges}>
                              {Object.entries(item.settings).slice(0, 2).map(([key, value], settingIndex) => (
                                <View key={key} style={[styles.settingBadge, { backgroundColor: colors.surface }]}>
                                  <Text variant="caption" color="secondary">
                                    {key}: {String(value)}
                                  </Text>
                                </View>
                              ))}
                            </View>
                          )}
                        </View>
                        
                        {/* Action Button */}
                        {!isSelectionMode && (
                          <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => showItemActions(item)}
                          >
                            <MaterialIcons name="more-vert" size={20} color={colors.text.secondary} />
                          </TouchableOpacity>
                        )}
                      </View>
                    </Card>
                  </TouchableOpacity>
                );
              })}
            </Animated.View>
          </ScrollView>
        )}
        
        {/* Selection Actions */}
        {isSelectionMode && selectedItems.size > 0 && (
          <View style={[styles.selectionActions, { borderTopColor: colors.border }]}>
            <Button
              title={`Delete (${selectedItems.size})`}
              onPress={handleDeleteSelected}
              variant="destructive"
              style={styles.selectionButton}
            />
          </View>
        )}
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
  headerButton: {
    padding: Spacing.sm,
    minWidth: 50,
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: Spacing.base,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: {
    marginTop: Spacing.base,
    marginBottom: Spacing.sm,
  },
  emptyDescription: {
    textAlign: 'center',
    lineHeight: 20,
  },
  historyItem: {
    marginBottom: Spacing.md,
  },
  itemCard: {
    padding: 0,
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
  },
  selectionIndicator: {
    marginRight: Spacing.md,
  },
  thumbnailContainer: {
    position: 'relative',
    marginRight: Spacing.md,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.sm,
    backgroundColor: '#f0f0f0',
  },
  operationBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: Colors.primary.main,
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemDetails: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  settingsBadges: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  settingBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  actionButton: {
    padding: Spacing.sm,
    marginLeft: Spacing.sm,
  },
  selectionActions: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
  },
  selectionButton: {
    flex: 1,
  },
});

export default HistoryModal;