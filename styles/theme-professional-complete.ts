// Professional Loop Theme System - Complete Specification
// Based on "LinkedIn built by Apple in 2030" aesthetic

export const professionalTheme = {
  // Core Color Palette
  colors: {
    // Primary Neon Accent
    primary: '#00F6FF',      // Neon Teal
    primaryRgb: '0, 246, 255',
    
    // Secondary Accents
    secondary: '#00FF88',     // Neon Green
    warning: '#FFD700',       // Gold
    error: '#FF4757',         // Neon Red
    
    // Background System
    background: {
      primary: '#0B1622',     // Deep Blue Black
      secondary: '#111827',   // Charcoal
      tertiary: '#1F2937',    // Darker Gray
      glass: 'rgba(30, 41, 59, 0.3)',
      card: 'rgba(255, 255, 255, 0.05)',
    },
    
    // Text System
    text: {
      primary: '#FFFFFF',
      secondary: 'rgba(255, 255, 255, 0.7)',
      tertiary: 'rgba(255, 255, 255, 0.5)',
      muted: 'rgba(255, 255, 255, 0.4)',
      accent: '#00F6FF',
    },
    
    // Border System
    border: {
      default: 'rgba(255, 255, 255, 0.1)',
      hover: 'rgba(0, 246, 255, 0.3)',
      active: 'rgba(0, 246, 255, 0.5)',
      focus: 'rgba(0, 246, 255, 0.6)',
    }
  },
  
  // Typography Scale (Inter/Montserrat)
  typography: {
    fonts: {
      primary: "'Inter', system-ui, sans-serif",
      secondary: "'Montserrat', system-ui, sans-serif",
      mono: "'JetBrains Mono', monospace",
    },
    
    sizes: {
      xs: '0.75rem',      // 12px
      sm: '0.875rem',     // 14px
      base: '1rem',       // 16px
      lg: '1.125rem',     // 18px
      xl: '1.25rem',      // 20px
      '2xl': '1.5rem',    // 24px
      '3xl': '1.875rem',  // 30px
      '4xl': '2.25rem',   // 36px
      '5xl': '3rem',      // 48px
    },
    
    weights: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    
    lineHeights: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.625,
    }
  },
  
  // Spacing System
  spacing: {
    xs: '0.25rem',    // 4px
    sm: '0.5rem',     // 8px
    md: '1rem',       // 16px
    lg: '1.5rem',     // 24px
    xl: '2rem',       // 32px
    '2xl': '3rem',    // 48px
    '3xl': '4rem',    // 64px
    '4xl': '6rem',    // 96px
  },
  
  // Border Radius System
  radius: {
    none: '0',
    sm: '0.125rem',   // 2px
    md: '0.375rem',   // 6px
    lg: '0.5rem',     // 8px
    xl: '0.75rem',    // 12px
    '2xl': '1rem',    // 16px
    full: '9999px',
  },
  
  // Shadow System (minimal, neon-focused)
  shadows: {
    none: 'none',
    neon: '0 0 4px rgba(0, 246, 255, 0.3)',
    'neon-lg': '0 0 8px rgba(0, 246, 255, 0.4)',
    'neon-xl': '0 0 12px rgba(0, 246, 255, 0.5)',
    glass: '0 4px 16px rgba(0, 0, 0, 0.1)',
  },
  
  // Animation System
  animations: {
    durations: {
      fast: '0.15s',
      normal: '0.3s',
      slow: '0.5s',
    },
    
    easings: {
      ease: 'ease',
      'ease-in': 'ease-in',
      'ease-out': 'ease-out',
      'ease-in-out': 'ease-in-out',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    },
    
    keyframes: {
      pulse: {
        '0%, 100%': { opacity: '1' },
        '50%': { opacity: '0.7' },
      },
      glow: {
        '0%, 100%': { 
          filter: 'drop-shadow(0 0 2px rgba(0, 246, 255, 0.3))' 
        },
        '50%': { 
          filter: 'drop-shadow(0 0 4px rgba(0, 246, 255, 0.5))' 
        },
      },
      fadeIn: {
        '0%': { opacity: '0', transform: 'translateY(10px)' },
        '100%': { opacity: '1', transform: 'translateY(0)' },
      },
      slideIn: {
        '0%': { transform: 'translateX(-100%)' },
        '100%': { transform: 'translateX(0)' },
      },
    }
  },
  
  // Component Variants
  components: {
    // Glass Panel
    glassPanel: {
      base: 'backdrop-blur-md bg-white/5 border border-white/10',
      hover: 'hover:border-[var(--color-primary)]/30',
      active: 'border-[var(--color-primary)]/50',
    },
    
    // Buttons
    button: {
      primary: 'bg-[var(--color-primary)]/20 text-[var(--color-primary)] border border-[var(--color-primary)]/50 hover:bg-[var(--color-primary)]/30',
      ghost: 'bg-transparent border border-white/20 text-white/70 hover:border-[var(--color-primary)]/50 hover:text-[var(--color-primary)]',
      minimal: 'text-white/60 hover:text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10',
    },
    
    // Status Indicators
    status: {
      bonded: 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]',
      pending: 'border-white/30 bg-white/5 text-white/60',
      active: 'shadow-[0_0_8px_rgba(0,246,255,0.4)]',
    },
    
    // Input Fields
    input: {
      base: 'bg-white/5 border border-white/10 text-white placeholder:text-white/40',
      focus: 'focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]/20',
    },
  },
  
  // Breakpoints
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
}

// CSS Custom Properties for use with Tailwind or CSS-in-JS
export const cssVariables = `
:root {
  /* Colors */
  --color-primary: ${professionalTheme.colors.primary};
  --color-primary-rgb: ${professionalTheme.colors.primaryRgb};
  --color-secondary: ${professionalTheme.colors.secondary};
  --color-warning: ${professionalTheme.colors.warning};
  --color-error: ${professionalTheme.colors.error};
  
  /* Backgrounds */
  --bg-primary: ${professionalTheme.colors.background.primary};
  --bg-secondary: ${professionalTheme.colors.background.secondary};
  --bg-tertiary: ${professionalTheme.colors.background.tertiary};
  --bg-glass: ${professionalTheme.colors.background.glass};
  --bg-card: ${professionalTheme.colors.background.card};
  
  /* Text */
  --text-primary: ${professionalTheme.colors.text.primary};
  --text-secondary: ${professionalTheme.colors.text.secondary};
  --text-tertiary: ${professionalTheme.colors.text.tertiary};
  --text-muted: ${professionalTheme.colors.text.muted};
  --text-accent: ${professionalTheme.colors.text.accent};
  
  /* Borders */
  --border-default: ${professionalTheme.colors.border.default};
  --border-hover: ${professionalTheme.colors.border.hover};
  --border-active: ${professionalTheme.colors.border.active};
  --border-focus: ${professionalTheme.colors.border.focus};
  
  /* Fonts */
  --font-primary: ${professionalTheme.typography.fonts.primary};
  --font-secondary: ${professionalTheme.typography.fonts.secondary};
  --font-mono: ${professionalTheme.typography.fonts.mono};
  
  /* Shadows */
  --shadow-neon: ${professionalTheme.shadows.neon};
  --shadow-neon-lg: ${professionalTheme.shadows['neon-lg']};
  --shadow-neon-xl: ${professionalTheme.shadows['neon-xl']};
  --shadow-glass: ${professionalTheme.shadows.glass};
}

/* Animation Classes */
@keyframes pulse-neon {
  ${Object.entries(professionalTheme.animations.keyframes.pulse)
    .map(([key, value]) => `${key} { ${Object.entries(value as any).map(([prop, val]) => `${prop}: ${val};`).join(' ')} }`)
    .join('\n  ')}
}

@keyframes glow-neon {
  ${Object.entries(professionalTheme.animations.keyframes.glow)
    .map(([key, value]) => `${key} { ${Object.entries(value as any).map(([prop, val]) => `${prop}: ${val};`).join(' ')} }`)
    .join('\n  ')}
}

@keyframes fade-in {
  ${Object.entries(professionalTheme.animations.keyframes.fadeIn)
    .map(([key, value]) => `${key} { ${Object.entries(value as any).map(([prop, val]) => `${prop}: ${val};`).join(' ')} }`)
    .join('\n  ')}
}

/* Utility Classes */
.glass-panel {
  ${professionalTheme.components.glassPanel.base.split(' ').map(cls => `${cls}: true;`).join('\n  ')}
}

.glass-panel:hover {
  ${professionalTheme.components.glassPanel.hover.split(' ').map(cls => `${cls}: true;`).join('\n  ')}
}

.btn-primary {
  ${professionalTheme.components.button.primary.split(' ').map(cls => `${cls}: true;`).join('\n  ')}
}

.btn-ghost {
  ${professionalTheme.components.button.ghost.split(' ').map(cls => `${cls}: true;`).join('\n  ')}
}

.status-bonded {
  ${professionalTheme.components.status.bonded.split(' ').map(cls => `${cls}: true;`).join('\n  ')}
}

.status-pending {
  ${professionalTheme.components.status.pending.split(' ').map(cls => `${cls}: true;`).join('\n  ')}
}

/* Professional Loop Animations */
.pulse-accent {
  animation: pulse-neon 2s ${professionalTheme.animations.easings['ease-in-out']} infinite;
}

.glow-accent {
  animation: glow-neon 3s ${professionalTheme.animations.easings['ease-in-out']} infinite;
}

.fade-in {
  animation: fade-in ${professionalTheme.animations.durations.normal} ${professionalTheme.animations.easings['ease-out']};
}

/* Professional Typography */
.heading-primary {
  font-family: var(--font-primary);
  font-weight: ${professionalTheme.typography.weights.medium};
  font-size: ${professionalTheme.typography.sizes['3xl']};
  line-height: ${professionalTheme.typography.lineHeights.tight};
  letter-spacing: -0.025em;
  color: var(--text-primary);
}

.body-primary {
  font-family: var(--font-primary);
  font-weight: ${professionalTheme.typography.weights.normal};
  font-size: ${professionalTheme.typography.sizes.base};
  line-height: ${professionalTheme.typography.lineHeights.normal};
  color: var(--text-secondary);
}

.body-muted {
  font-family: var(--font-primary);
  font-weight: ${professionalTheme.typography.weights.light};
  font-size: ${professionalTheme.typography.sizes.sm};
  line-height: ${professionalTheme.typography.lineHeights.normal};
  color: var(--text-muted);
}
`

// React Hook for Theme Context
export const useProfessionalTheme = () => {
  return {
    theme: professionalTheme,
    cssVariables,
  }
}

export default professionalTheme