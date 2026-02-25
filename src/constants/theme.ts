// Design System for Pixozen - Premium Minimal with Glassmorphism
export const Colors = {
  // Primary Gradient: Deep Blue → Royal Purple
  primary: {
    start: '#1e3a8a', // Deep Blue
    end: '#7c3aed',   // Royal Purple
    main: '#4f46e5',  // Blend color for solid needs
  },
  
  // Accent Colors
  accent: {
    orange: '#fb923c', // Soft Orange
    teal: '#14b8a6',   // Teal
    main: '#fb923c',   // Default accent
  },
  
  // Light Mode (Default)
  light: {
    background: '#ffffff',
    surface: '#f8fafc',
    surfaceGlass: 'rgba(248, 250, 252, 0.8)',
    text: {
      primary: '#0f172a',
      secondary: '#64748b',
      tertiary: '#94a3b8',
    },
    border: '#e2e8f0',
    borderLight: '#f1f5f9',
    shadow: 'rgba(15, 23, 42, 0.1)',
  },
  
  // Dark Mode (Optional)
  dark: {
    background: '#0f172a',
    surface: '#1e293b',
    surfaceGlass: 'rgba(30, 41, 59, 0.8)',
    text: {
      primary: '#f8fafc',
      secondary: '#cbd5e1',
      tertiary: '#94a3b8',
    },
    border: '#334155',
    borderLight: '#475569',
    shadow: 'rgba(0, 0, 0, 0.3)',
  },
  
  // Status Colors
  status: {
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },
  
  // Glassmorphism
  glass: {
    light: 'rgba(255, 255, 255, 0.1)',
    medium: 'rgba(255, 255, 255, 0.2)',
    strong: 'rgba(255, 255, 255, 0.3)',
  },
};

export const Typography = {
  // Font Families
  fontFamily: {
    regular: 'System',
    medium: 'System',
    semibold: 'System',
    bold: 'System',
  },
  
  // Font Sizes
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
    '5xl': 48,
  },
  
  // Line Heights
  lineHeight: {
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
  },
  
  // Font Weights
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
  '4xl': 64,
  '5xl': 80,
};

export const BorderRadius = {
  none: 0,
  sm: 4,
  base: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 9999,
};

export const Shadows = {
  none: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  base: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  md: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  lg: {
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 16,
  },
};

export const Layout = {
  // Screen Padding
  screenPadding: Spacing.base,
  
  // Component Heights
  header: 60,
  bottomTab: 80,
  button: 48,
  input: 48,
  
  // Grid
  gridGap: Spacing.base,
  cardPadding: Spacing.lg,
};

export const Animation = {
  duration: {
    fast: 150,
    normal: 300,
    slow: 500,
  },
  easing: {
    easeOut: 'easeOut',
    easeIn: 'easeIn',
    easeInOut: 'easeInOut',
  },
};