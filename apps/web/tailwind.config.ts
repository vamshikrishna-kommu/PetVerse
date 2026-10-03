import type { Config } from 'tailwindcss';
import formsPlugin from '@tailwindcss/forms';
import typographyPlugin from '@tailwindcss/typography';

const config: Config = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        background: 'hsl(var(--background))',
        'background-2': 'hsl(var(--background-2))',
        'background-3': 'hsl(var(--background-3))',
        surface: 'hsl(var(--surface))',
        'surface-2': 'hsl(var(--surface-2))',
        'surface-3': 'hsl(var(--surface-3))',
        border: 'hsl(var(--border))',
        'border-strong': 'hsl(var(--border-strong))',
        foreground: 'hsl(var(--foreground))',
        'foreground-2': 'hsl(var(--foreground-2))',
        muted: 'hsl(var(--muted))',
        'muted-fg': 'hsl(var(--muted-fg))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          dark: 'hsl(var(--primary-dark))',
          light: 'hsl(var(--primary-light))',
          fg: 'hsl(var(--primary-fg))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          dark: 'hsl(var(--accent-dark))',
          fg: 'hsl(var(--accent-fg))',
        },
        success: {
          DEFAULT: 'hsl(var(--success))',
          light: 'hsl(var(--success-light))',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          light: 'hsl(var(--warning-light))',
        },
        danger: {
          DEFAULT: 'hsl(var(--danger))',
          light: 'hsl(var(--danger-light))',
        },
        info: {
          DEFAULT: 'hsl(var(--info))',
          light: 'hsl(var(--info-light))',
        },
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        DEFAULT: 'var(--radius)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
      },
      boxShadow: {
        xs: 'var(--shadow-xs)',
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        xl: 'var(--shadow-xl)',
        glow: 'var(--shadow-glow)',
        'glow-accent': 'var(--shadow-glow-accent)',
      },
      animation: {
        'fade-in': 'fadeIn 200ms ease forwards',
        'slide-up': 'slideUp 200ms ease forwards',
        'scale-in': 'scaleIn 150ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        'spin-slow': 'spin-slow 3s linear infinite',
        'pulse-glow': 'pulse-glow 2s ease infinite',
        float: 'float 3s ease-in-out infinite',
        shimmer: 'shimmer 1.5s infinite linear',
        'gradient-shift': 'gradient-shift 4s ease infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 0 0 hsl(217 91% 60% / 0.4)' },
          '50%': { boxShadow: '0 0 0 8px hsl(217 91% 60% / 0)' },
        },
        'gradient-shift': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        'spin-slow': {
          to: { transform: 'rotate(360deg)' },
        },
      },
      screens: {
        xs: '480px',
        '3xl': '1920px',
      },
      spacing: {
        sidebar: 'var(--sidebar-width)',
        'sidebar-collapsed': 'var(--sidebar-width-collapsed)',
        navbar: 'var(--navbar-height)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'hero-gradient':
          'linear-gradient(135deg, hsl(217 91% 60% / 0.15) 0%, hsl(258 90% 66% / 0.15) 100%)',
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [formsPlugin, typographyPlugin],
};

export default config;
