/** @type {import('tailwindcss').Config} */

// 导入设计令牌
import {
  mintColors,
  primaryColors,
  neutralColors,
  semanticColors,
  spacing,
  borderRadius,
  shadows,
  fontFamily,
  durations,
  easings,
} from './src/design/tokens.ts';

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      // 颜色系统
      colors: {
        // 薄荷绿主题色
        // Requirements: 1.1, 1.2 - 使用薄荷绿作为主题色
        mint: mintColors,
        // 主色 - 薄荷绿色系
        // Requirements: 1.3, 1.4, 1.5 - 所有使用主色的 UI 元素显示薄荷绿色
        primary: primaryColors,
        // 中性色
        neutral: neutralColors,
        // 语义色
        success: {
          light: semanticColors.success.light,
          dark: semanticColors.success.dark,
          DEFAULT: semanticColors.success.light,
        },
        warning: {
          light: semanticColors.warning.light,
          dark: semanticColors.warning.dark,
          DEFAULT: semanticColors.warning.light,
        },
        error: {
          light: semanticColors.error.light,
          dark: semanticColors.error.dark,
          DEFAULT: semanticColors.error.light,
        },
        info: {
          light: semanticColors.info.light,
          dark: semanticColors.info.dark,
          DEFAULT: semanticColors.info.light,
        },
        // 暗色主题背景（保留兼容性）
        dark: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
      },
      // 间距系统
      spacing: {
        '0': spacing[0],
        '1': spacing[1],
        '2': spacing[2],
        '3': spacing[3],
        '4': spacing[4],
        '6': spacing[6],
        '8': spacing[8],
        '12': spacing[12],
        '16': spacing[16],
      },
      // 圆角系统
      borderRadius: {
        'none': borderRadius.none,
        'sm': borderRadius.sm,
        'md': borderRadius.md,
        'lg': borderRadius.lg,
        'xl': borderRadius.xl,
        'full': borderRadius.full,
      },
      // 阴影系统
      boxShadow: {
        'none': shadows.none,
        'sm': shadows.sm,
        'md': shadows.md,
        'lg': shadows.lg,
        'xl': shadows.xl,
      },
      // 字体系统
      fontFamily: {
        sans: [fontFamily.sans],
        mono: [fontFamily.mono],
      },
      // 动画时长
      transitionDuration: {
        'fast': durations.fast,
        'normal': durations.normal,
        'slow': durations.slow,
      },
      // 缓动函数
      transitionTimingFunction: {
        'ease-out': easings.easeOut,
        'ease-in': easings.easeIn,
        'ease-in-out': easings.easeInOut,
      },
      // 动画
      animation: {
        'fade-in': `fadeIn ${durations.normal} ${easings.easeOut}`,
        'fade-out': `fadeOut ${durations.normal} ${easings.easeIn}`,
        'scale-in': `scaleIn ${durations.normal} ${easings.easeOut}`,
        'scale-out': `scaleOut ${durations.normal} ${easings.easeIn}`,
        'slide-in-right': `slideInRight ${durations.slow} ${easings.easeOut}`,
        'slide-out-right': `slideOutRight ${durations.slow} ${easings.easeIn}`,
      },
      // 关键帧
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        scaleOut: {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '100%': { transform: 'scale(0.95)', opacity: '0' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideOutRight: {
          '0%': { transform: 'translateX(0)', opacity: '1' },
          '100%': { transform: 'translateX(100%)', opacity: '0' },
        },
      },
    },
  },
  plugins: [],
}
