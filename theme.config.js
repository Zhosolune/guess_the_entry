/**
 * 主题设计系统配置（明暗主题）
 * 提供颜色、字体、圆角与过渡等基础设计变量。
 *
 * 使用方式：
 * - 在 CSS 中通过 `var(--color-*)` 引用；
 * - 在组件中使用 Tailwind 的任意类时，优先改为 `text-[var(--color-text)]` 等变量驱动避免硬编码颜色。
 */

export const designTokens = {
  light: {
    colors: {
      bgApp: '#ffffff',
      surface: '#ffffff',
      border: '#e5e7eb', // gray-200
      text: '#111827', // gray-900
      textMuted: '#6b7280', // gray-500
      btnBg: '#f3f4f6', // gray-100
      btnFg: '#111827', // gray-900
      btnBgHover: '#e5e7eb', // gray-200
      btnBorder: '#e5e7eb', // gray-200
      primary: '#4772c3',
      primaryHover: '#3d62a9',
      primaryActive: '#34528f',
      success: '#4CAF50',
      accent: '#4772c3'
    },
    fonts: {
      base: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
    },
    radius: '0.75rem',
    transition: '0.3s ease'
  },
  dark: {
    colors: {
      bgApp: '#0f172a', // slate-900
      surface: '#111827', // gray-900
      border: '#334155', // slate-700
      // 再调暗一级，采用 slate-300，降低眩光同时保持与 textMuted 区分
      text: '#cbd5e1', // slate-300
      textMuted: '#94a3b8', // slate-400
      btnBg: '#1f2937', // gray-800
      btnFg: '#cbd5e1', // slate-300
      btnBgHover: '#374151', // gray-700
      btnBorder: '#334155', // slate-700
      primary: '#4772c3',
      primaryHover: '#3d62a9',
      primaryActive: '#34528f',
      success: '#4CAF50',
      accent: '#64748b' // slate-500
    },
    fonts: {
      base: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
    },
    radius: '0.75rem',
    transition: '0.3s ease'
  }
};

export default designTokens;