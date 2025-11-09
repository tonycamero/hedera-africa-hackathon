/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  prefix: "",
  theme: {
    /* Removed container config that was causing width issues */
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
        // Signal category colors
        social: "hsl(var(--social))",
        academic: "hsl(var(--academic))",
        professional: "hsl(var(--professional))",
        success: "hsl(var(--success))",
        trust: "hsl(var(--trust))",
        // Card border utility
        "card-border": "var(--card-border)",
        // Neon colors
        "neon-green": "var(--neon-green)",
        // GenZ Design System - Dark Campus + Purple Glow
        ink: '#0B0F14',
        panel: '#111827',
        panel2: '#0F172A',
        pri: {
          500: '#A78BFA', // purple/violet - primary actions
          600: '#8B5CF6', // purple/violet darker
          glow: '#C4B5FD', // purple lighter glow
        },
        sec: {
          500: '#A78BFA', // violet 400 - signal send
          600: '#8B5CF6', // violet 500
        },
        genz: {
          text: '#E5E7EB', // gray 200
          'text-dim': '#9CA3AF', // gray 400
          border: '#1F2937', // gray 800
          success: '#10B981',
          warn: '#F59E0B',
          danger: '#EF4444',
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        // GenZ rounded corners
        'xl': '0.875rem', // 14px
        '2xl': '1rem', // 16px
      },
      boxShadow: {
        // GenZ elevation & glows
        'glow': '0 0 24px rgba(34,211,238,0.25)',
        'glow-violet': '0 0 24px rgba(167,139,250,0.25)',
        'modal': '0 0 40px rgba(103,232,249,0.12), 0 24px 60px rgba(0,0,0,0.5)',
        'card': '0 8px 24px rgba(0,0,0,0.35)',
        'panel': '0 0 0 1px rgba(103,232,249,0), 0 8px 24px rgba(0,0,0,0.35)',
      },
      transitionDuration: {
        'fast': '150ms',
        'norm': '180ms',
        'slow': '200ms',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        // GenZ breathing glow effect
        "breathe-glow": {
          "0%, 100%": { opacity: "0.75" },
          "50%": { opacity: "1" },
        },
        // GenZ subtle float
        "float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-2px)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "breathe-glow": "breathe-glow 2.4s ease-in-out infinite",
        "float": "float 3s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/line-clamp")],
}