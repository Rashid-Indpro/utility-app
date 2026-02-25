import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const STORAGE_KEYS = {
  HISTORY: 'pixozen_history',
  SETTINGS: 'pixozen_settings',
  THEME: 'pixozen_theme',
  QUICK_ACTIONS: 'pixozen_quick_actions',
} as const;

export interface HistoryItem {
  id: string;
  thumbnail: string;
  toolUsed: string;
  dateTime: Date;
  format: string;
  originalImage: {
    uri: string;
    width: number;
    height: number;
    size?: number;
    name?: string;
  };
  processedImage: {
    uri: string;
    width: number;
    height: number;
    originalUri: string;
    processedAt: Date;
    operations: string[];
    size?: number;
  };
}

export interface AppSettings {
  defaultFormat: 'JPEG' | 'PNG' | 'WEBP';
  defaultQuality: number;
  autoSave: boolean;
  showTutorials: boolean;
  hapticFeedback: boolean;
  theme: 'light' | 'dark' | 'auto';
  compressionLevel: 'high' | 'medium' | 'low';
}

const DEFAULT_SETTINGS: AppSettings = {
  defaultFormat: 'JPEG',
  defaultQuality: 0.8,
  autoSave: false,
  showTutorials: true,
  hapticFeedback: true,
  theme: 'light',
  compressionLevel: 'medium',
};

/**
 * History Management
 */

export const saveHistoryItem = async (item: HistoryItem): Promise<void> => {
  try {
    const history = await getHistory();
    const newHistory = [item, ...history];
    
    // Keep only last 20 items as per requirements
    const limitedHistory = newHistory.slice(0, 20);
    
    await AsyncStorage.setItem(
      STORAGE_KEYS.HISTORY,
      JSON.stringify(limitedHistory, (key, value) => {
        // Convert Date objects to strings for JSON serialization
        if (value instanceof Date) {
          return value.toISOString();
        }
        return value;
      })
    );
  } catch (error) {
    console.error('Failed to save history item:', error);
    throw new Error('Failed to save to history');
  }
};

export const getHistory = async (): Promise<HistoryItem[]> => {
  try {
    const historyJson = await AsyncStorage.getItem(STORAGE_KEYS.HISTORY);
    
    if (!historyJson) {
      return [];
    }
    
    const history = JSON.parse(historyJson, (key, value) => {
      // Convert ISO strings back to Date objects
      if (typeof value === 'string' && key === 'dateTime' || key === 'processedAt') {
        return new Date(value);
      }
      return value;
    });
    
    return history;
  } catch (error) {
    console.error('Failed to load history:', error);
    return [];
  }
};

export const deleteHistoryItem = async (id: string): Promise<void> => {
  try {
    const history = await getHistory();
    const filteredHistory = history.filter(item => item.id !== id);
    
    await AsyncStorage.setItem(
      STORAGE_KEYS.HISTORY,
      JSON.stringify(filteredHistory, (key, value) => {
        if (value instanceof Date) {
          return value.toISOString();
        }
        return value;
      })
    );
  } catch (error) {
    console.error('Failed to delete history item:', error);
    throw new Error('Failed to delete history item');
  }
};

export const clearHistory = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.HISTORY);
  } catch (error) {
    console.error('Failed to clear history:', error);
    throw new Error('Failed to clear history');
  }
};

/**
 * Settings Management
 */

export const saveSettings = async (settings: Partial<AppSettings>): Promise<void> => {
  try {
    const currentSettings = await getSettings();
    const newSettings = { ...currentSettings, ...settings };
    
    await AsyncStorage.setItem(
      STORAGE_KEYS.SETTINGS,
      JSON.stringify(newSettings)
    );
  } catch (error) {
    console.error('Failed to save settings:', error);
    throw new Error('Failed to save settings');
  }
};

export const getSettings = async (): Promise<AppSettings> => {
  try {
    const settingsJson = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
    
    if (!settingsJson) {
      return DEFAULT_SETTINGS;
    }
    
    const settings = JSON.parse(settingsJson);
    return { ...DEFAULT_SETTINGS, ...settings };
  } catch (error) {
    console.error('Failed to load settings:', error);
    return DEFAULT_SETTINGS;
  }
};

export const resetSettings = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem(
      STORAGE_KEYS.SETTINGS,
      JSON.stringify(DEFAULT_SETTINGS)
    );
  } catch (error) {
    console.error('Failed to reset settings:', error);
    throw new Error('Failed to reset settings');
  }
};

/**
 * Theme Management
 */

export const saveTheme = async (theme: 'light' | 'dark'): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.THEME, theme);
  } catch (error) {
    console.error('Failed to save theme:', error);
  }
};

export const getTheme = async (): Promise<'light' | 'dark'> => {
  try {
    const theme = await AsyncStorage.getItem(STORAGE_KEYS.THEME);
    return (theme as 'light' | 'dark') || 'light';
  } catch (error) {
    console.error('Failed to load theme:', error);
    return 'light';
  }
};

/**
 * Quick Actions Management
 */

export interface QuickAction {
  id: string;
  name: string;
  icon: string;
  enabled: boolean;
  order: number;
}

const DEFAULT_QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'compress500',
    name: 'Compress to 500KB',
    icon: 'compress',
    enabled: true,
    order: 0,
  },
  {
    id: 'instagram',
    name: 'Instagram Post Size',
    icon: 'crop',
    enabled: true,
    order: 1,
  },
  {
    id: 'resize1080',
    name: 'Resize to 1080p',
    icon: 'photo-size-select-large',
    enabled: true,
    order: 2,
  },
  {
    id: 'metadata',
    name: 'Remove Metadata',
    icon: 'cleaning-services',
    enabled: true,
    order: 3,
  },
];

export const saveQuickActions = async (actions: QuickAction[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(
      STORAGE_KEYS.QUICK_ACTIONS,
      JSON.stringify(actions)
    );
  } catch (error) {
    console.error('Failed to save quick actions:', error);
  }
};

export const getQuickActions = async (): Promise<QuickAction[]> => {
  try {
    const actionsJson = await AsyncStorage.getItem(STORAGE_KEYS.QUICK_ACTIONS);
    
    if (!actionsJson) {
      return DEFAULT_QUICK_ACTIONS;
    }
    
    return JSON.parse(actionsJson);
  } catch (error) {
    console.error('Failed to load quick actions:', error);
    return DEFAULT_QUICK_ACTIONS;
  }
};

/**
 * Generic Storage Operations
 */

export const getAllStorageData = async (): Promise<Record<string, any>> => {
  try {
    const keys = Object.values(STORAGE_KEYS);
    const data: Record<string, any> = {};
    
    for (const key of keys) {
      const value = await AsyncStorage.getItem(key);
      if (value) {
        data[key] = JSON.parse(value);
      }
    }
    
    return data;
  } catch (error) {
    console.error('Failed to get all storage data:', error);
    return {};
  }
};

export const clearAllStorageData = async (): Promise<void> => {
  try {
    const keys = Object.values(STORAGE_KEYS);
    await AsyncStorage.multiRemove(keys);
  } catch (error) {
    console.error('Failed to clear all storage data:', error);
    throw new Error('Failed to clear app data');
  }
};

export const getStorageSize = async (): Promise<{ totalSize: number; itemCount: number }> => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const pixozenKeys = keys.filter(key => key.startsWith('pixozen_'));
    
    let totalSize = 0;
    for (const key of pixozenKeys) {
      const value = await AsyncStorage.getItem(key);
      if (value) {
        totalSize += value.length;
      }
    }
    
    return {
      totalSize, // in bytes (approximate)
      itemCount: pixozenKeys.length,
    };
  } catch (error) {
    console.error('Failed to calculate storage size:', error);
    return { totalSize: 0, itemCount: 0 };
  }
};

/**
 * Data Export/Import (for backup/restore)
 */

export const exportAppData = async (): Promise<string> => {
  try {
    const allData = await getAllStorageData();
    return JSON.stringify(allData, null, 2);
  } catch (error) {
    console.error('Failed to export app data:', error);
    throw new Error('Failed to export app data');
  }
};

export const importAppData = async (jsonData: string): Promise<void> => {
  try {
    const data = JSON.parse(jsonData);
    
    // Validate data structure
    const validKeys = Object.values(STORAGE_KEYS);
    for (const key of Object.keys(data)) {
      if (!validKeys.includes(key as any)) {
        throw new Error(`Invalid data key: ${key}`);
      }
    }
    
    // Import data
    for (const [key, value] of Object.entries(data)) {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    }
  } catch (error) {
    console.error('Failed to import app data:', error);
    throw new Error('Failed to import app data');
  }
};