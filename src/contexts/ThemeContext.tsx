import React, { createContext, useContext, useState, useEffect } from 'react';
import { Appearance, ColorSchemeName } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { Colors } from '@/constants/theme';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  mode: ThemeMode;
  colors: typeof Colors.light;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'pixozen_theme_mode';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>('light'); // Default to light mode
  
  useEffect(() => {
    // Load saved theme or use system default
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
          setMode(savedTheme);
        } else {
          // Default to light mode as per requirements
          setMode('light');
        }
      } catch (error) {
        console.log('Error loading theme:', error);
        setMode('light');
      }
    };
    
    loadTheme();
  }, []);
  
  const toggleTheme = async () => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    setMode(newMode);
    
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newMode);
    } catch (error) {
      console.log('Error saving theme:', error);
    }
  };
  
  const colors = mode === 'light' ? Colors.light : Colors.dark;
  const isDark = mode === 'dark';
  
  const value: ThemeContextType = {
    mode,
    colors,
    toggleTheme,
    isDark,
  };
  
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};