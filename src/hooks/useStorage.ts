import { useState, useEffect, useCallback } from 'react';
import {
  getHistory,
  saveHistoryItem,
  deleteHistoryItem,
  clearHistory,
  getSettings,
  saveSettings,
  resetSettings,
  getQuickActions,
  saveQuickActions,
  type HistoryItem,
  type AppSettings,
  type QuickAction,
} from '@/utils/storage';

export interface UseHistoryResult {
  history: HistoryItem[];
  addItem: (item: HistoryItem) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export interface UseSettingsResult {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  resetToDefaults: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export interface UseQuickActionsResult {
  quickActions: QuickAction[];
  updateActions: (actions: QuickAction[]) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook for managing history
 */
export const useHistory = (): UseHistoryResult => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Load history on mount
  useEffect(() => {
    const loadHistory = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const historyData = await getHistory();
        setHistory(historyData);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load history';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadHistory();
  }, []);
  
  const addItem = useCallback(async (item: HistoryItem) => {
    try {
      setError(null);
      await saveHistoryItem(item);
      
      // Update local state
      setHistory(prev => {
        const newHistory = [item, ...prev];
        return newHistory.slice(0, 20); // Keep only 20 items
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save history item';
      setError(errorMessage);
      throw err;
    }
  }, []);
  
  const removeItem = useCallback(async (id: string) => {
    try {
      setError(null);
      await deleteHistoryItem(id);
      
      // Update local state
      setHistory(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove history item';
      setError(errorMessage);
      throw err;
    }
  }, []);
  
  const clearAll = useCallback(async () => {
    try {
      setError(null);
      await clearHistory();
      
      // Update local state
      setHistory([]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to clear history';
      setError(errorMessage);
      throw err;
    }
  }, []);
  
  return {
    history,
    addItem,
    removeItem,
    clearAll,
    isLoading,
    error,
  };
};

/**
 * Hook for managing app settings
 */
export const useSettings = (): UseSettingsResult => {
  const [settings, setSettings] = useState<AppSettings>({
    defaultFormat: 'JPEG',
    defaultQuality: 0.8,
    autoSave: false,
    showTutorials: true,
    hapticFeedback: true,
    theme: 'light',
    compressionLevel: 'medium',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const settingsData = await getSettings();
        setSettings(settingsData);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load settings';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadSettings();
  }, []);
  
  const updateSettings = useCallback(async (newSettings: Partial<AppSettings>) => {
    try {
      setError(null);
      const updatedSettings = { ...settings, ...newSettings };
      
      await saveSettings(newSettings);
      setSettings(updatedSettings);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save settings';
      setError(errorMessage);
      throw err;
    }
  }, [settings]);
  
  const resetToDefaults = useCallback(async () => {
    try {
      setError(null);
      await resetSettings();
      
      // Reload settings from storage
      const defaultSettings = await getSettings();
      setSettings(defaultSettings);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reset settings';
      setError(errorMessage);
      throw err;
    }
  }, []);
  
  return {
    settings,
    updateSettings,
    resetToDefaults,
    isLoading,
    error,
  };
};

/**
 * Hook for managing quick actions
 */
export const useQuickActions = (): UseQuickActionsResult => {
  const [quickActions, setQuickActions] = useState<QuickAction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Load quick actions on mount
  useEffect(() => {
    const loadQuickActions = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const actionsData = await getQuickActions();
        setQuickActions(actionsData);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load quick actions';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadQuickActions();
  }, []);
  
  const updateActions = useCallback(async (actions: QuickAction[]) => {
    try {
      setError(null);
      await saveQuickActions(actions);
      setQuickActions(actions);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save quick actions';
      setError(errorMessage);
      throw err;
    }
  }, []);
  
  return {
    quickActions,
    updateActions,
    isLoading,
    error,
  };
};

/**
 * Combined hook for all storage operations
 */
export const useStorage = () => {
  const history = useHistory();
  const settings = useSettings();
  const quickActions = useQuickActions();
  
  return {
    history,
    settings,
    quickActions,
    isLoading: history.isLoading || settings.isLoading || quickActions.isLoading,
    hasError: !!(history.error || settings.error || quickActions.error),
    errors: {
      history: history.error,
      settings: settings.error,
      quickActions: quickActions.error,
    },
  };
};