export const colors = {
  light: {
    background: '#F9FAFB', // Minimalist off-white
    surface: '#FFFFFF',
    primary: '#000000',    // Stark black for contrast
    secondary: '#F3F4F6',
    textPrimary: '#111827',
    textSecondary: '#6B7280',
    border: '#E5E7EB',
    error: '#EF4444',
  },
  dark: {
    background: '#111827', // Deep minimalist dark
    surface: '#1F2937',
    primary: '#FFFFFF',
    secondary: '#374151',
    textPrimary: '#F9FAFB',
    textSecondary: '#9CA3AF',
    border: '#374151',
    error: '#F87171',
  }
};

export type ThemeColors = typeof colors.light;
