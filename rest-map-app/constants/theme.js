// Urban Minimalist Theme - 2025 Japan Trend
export const COLORS = {
  // Base colors
  background: '#F8F9FA',
  backgroundDark: '#121212',
  surface: '#FFFFFF',
  surfaceDark: '#1E1E1E',

  // Accent colors
  primary: '#3B82F6',      // Neon Blue
  primaryLight: '#60A5FA',
  primaryDark: '#2563EB',
  accent: '#F97316',       // Vivid Orange
  accentLight: '#FB923C',

  // Text colors
  textPrimary: '#1F2937',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  textLight: '#FFFFFF',

  // Status colors
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',

  // Glassmorphism
  glass: 'rgba(255, 255, 255, 0.85)',
  glassDark: 'rgba(30, 30, 30, 0.85)',
  glassLight: 'rgba(255, 255, 255, 0.6)',
  glassBorder: 'rgba(255, 255, 255, 0.3)',

  // Spot type colors (pastel)
  smoking: '#FEE2E2',      // Soft red
  smokingText: '#DC2626',
  toilet: '#DBEAFE',       // Soft blue
  toiletText: '#2563EB',
  cafe: '#FEF3C7',         // Soft yellow
  cafeText: '#D97706',

  // Shadows
  shadowColor: '#000',
};

export const SHADOWS = {
  small: {
    shadowColor: COLORS.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  medium: {
    shadowColor: COLORS.shadowColor,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  large: {
    shadowColor: COLORS.shadowColor,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
  },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const RADIUS = {
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  full: 9999,
};

export const FONTS = {
  regular: {
    fontSize: 14,
    fontWeight: '400',
  },
  medium: {
    fontSize: 14,
    fontWeight: '500',
  },
  semibold: {
    fontSize: 14,
    fontWeight: '600',
  },
  bold: {
    fontSize: 14,
    fontWeight: '700',
  },
  h1: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 22,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: 18,
    fontWeight: '600',
  },
  caption: {
    fontSize: 12,
    fontWeight: '400',
  },
};

export const SPOT_COLORS = {
  smoking: {
    bg: COLORS.smoking,
    text: COLORS.smokingText,
    emoji: '🚬',
  },
  toilet: {
    bg: COLORS.toilet,
    text: COLORS.toiletText,
    emoji: '🚻',
  },
  cafe: {
    bg: COLORS.cafe,
    text: COLORS.cafeText,
    emoji: '☕',
  },
};
