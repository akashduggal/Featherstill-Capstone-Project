import { Platform } from 'react-native';

// Modern vibrant color palette
const tintColorLight = '#6366F1'; // Indigo
const tintColorDark = '#818CF8'; // Lighter indigo for dark mode

export const Colors = {
    light: {
        text: '#0F172A',
        background: '#FFFFFF',
        tint: tintColorLight,
        icon: '#64748B',
        tabIconDefault: '#94A3B8',
        tabIconSelected: tintColorLight,
        card: '#FFFFFF',
        cardBorder: '#E2E8F0',
        surface: '#F8FAFC',
        surfaceElevated: '#FFFFFF',
        accent: '#6366F1',
        accentLight: '#818CF8',
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#3B82F6',
    },
    dark: {
        text: '#F1F5F9',
        background: '#0F172A',
        tint: tintColorDark,
        icon: '#94A3B8',
        tabIconDefault: '#64748B',
        tabIconSelected: tintColorDark,
        card: '#1E293B',
        cardBorder: '#334155',
        surface: '#1E293B',
        surfaceElevated: '#334155',
        accent: '#818CF8',
        accentLight: '#A5B4FC',
        success: '#34D399',
        warning: '#FBBF24',
        error: '#F87171',
        info: '#60A5FA',
    },
};

export const Fonts = Platform.select({
    ios: {
        /** iOS UIFontDescriptorSystemDesignDefault */
        sans: 'system-ui',
        /** iOS UIFontDescriptorSystemDesignSerif */
        serif: 'ui-serif',
        /** iOS UIFontDescriptorSystemDesignRounded */
        rounded: 'ui-rounded',
        /** iOS UIFontDescriptorSystemDesignMonospaced */
        mono: 'ui-monospace',
    },
    default: {
        sans: 'normal',
        serif: 'serif',
        rounded: 'normal',
        mono: 'monospace',
    },
    web: {
        sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        serif: "Georgia, 'Times New Roman', serif",
        rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
        mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
    },
});