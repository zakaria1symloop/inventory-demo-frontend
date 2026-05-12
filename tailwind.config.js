/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#3b82f6',
          dark: '#2563eb',
        },
        secondary: '#64748b',
        success: '#22c55e',
        warning: '#f59e0b',
        danger: '#ef4444',
        border: '#e2e8f0',
        muted: '#94a3b8',
        gray: {
          // 50-700: keep Tailwind defaults (used for text colors in light mode)
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          // 750+: OpenAI-inspired dark tones (used as dark:bg-*)
          750: '#2a2a2a',
          800: '#212121',
          850: '#1a1a1a',
          900: '#171717',
          950: '#0f0f0f',
        },
      },
      fontFamily: {
        sans: ['Tajawal', 'Segoe UI', 'Tahoma', 'Geneva', 'Verdana', 'sans-serif'],
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
}
