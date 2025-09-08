/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        brand: {
          DEFAULT: '#10b981',
          dark: '#0f766e',
        },
        surface: {
          light: '#ffffff',
          dark: '#1f2937',
        },
        gradient: {
          start: '#106d69',
          mid: '#139287',
          end: '#18b3ac',
          darkStart: '#18b3ac',
          darkMid: '#139287',
          darkEnd: '#106d69',
        },
        stage: {
          application: '#14b8a6',
          approval: '#6b7280',
          processing: '#0ea5e9',
          underwriting: '#f43f5e',
          conditional: '#facc15',
          docs: '#84cc16',
          postclose: '#6366f1',
        },
        status: {
          track: '#22c55e',
          delayed: '#fbbf24',
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-in-left': 'slideInLeft 0.4s ease-out',
        'slide-in-right': 'slideInRight 0.4s ease-out',
        'slide-in-up': 'slideInUp 0.5s ease-out',
        'zoom-fade': 'zoomFade 0.4s ease-out',
        'pop': 'pop 0.35s ease-in-out',
        'fade-up-stagger': 'fadeUpStagger 0.5s ease-in-out',
        'task-bounce': 'taskBounce 0.5s ease-in-out',
        'chart-float': 'chartFloat 3s ease-in-out infinite',
        'gradient-x': 'gradientX 12s ease infinite',
        'gradient-y': 'gradientY 12s ease infinite',
        'shimmer': 'shimmer 2s infinite linear',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0, transform: 'translateY(10px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        slideInLeft: {
          '0%': { transform: 'translateX(-30px)', opacity: 0 },
          '100%': { transform: 'translateX(0)', opacity: 1 },
        },
        slideInRight: {
          '0%': { transform: 'translateX(30px)', opacity: 0 },
          '100%': { transform: 'translateX(0)', opacity: 1 },
        },
        slideInUp: {
          '0%': { transform: 'translateY(20px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
        zoomFade: {
          '0%': { opacity: 0, transform: 'scale(0.95)' },
          '100%': { opacity: 1, transform: 'scale(1)' },
        },
        gradientX: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        gradientY: {
          '0%, 100%': { backgroundPosition: '50% 0%' },
          '50%': { backgroundPosition: '50% 100%' },
        },
        pop: {
          '0%': { transform: 'scale(0.8)', opacity: 0 },
          '100%': { transform: 'scale(1)', opacity: 1 },
        },
        fadeUpStagger: {
          '0%': { opacity: 0, transform: 'translateY(15px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        taskBounce: {
          '0%': { transform: 'scale(0.95)', opacity: 0 },
          '50%': { transform: 'scale(1.03)', opacity: 1 },
          '100%': { transform: 'scale(1)', opacity: 1 },
        },
        chartFloat: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
      backgroundSize: {
        '300': '300% 300%',
      },
      backgroundImage: {
        'campaign-gradient': 'linear-gradient(to right, #f87171, #a78bfa, #60a5fa, #facc15)',
        'campaign-dark-gradient': 'linear-gradient(to right, #facc15, #60a5fa, #a78bfa, #f87171)',
        'header-gradient': 'linear-gradient(to right, #0ea5e9, #6366f1, #ec4899)',
      },
      boxShadow: {
        'chart-glow': '0 0 10px rgba(255,255,255,0.25)',
        'glow': '0 0 6px rgba(255,255,255,0.6)',
      },
      dropShadow: {
        glow: '0 0 6px rgba(255, 255, 255, 0.6)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
      zIndex: {
        60: '60',
        70: '70',
        80: '80',
        90: '90',
        100: '100',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
};
