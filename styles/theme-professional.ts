/**
 * Professional Loop Theme - Minimal Corporate Aesthetic
 * Based on TrustMesh baseline with refinements for corporate/professional networking
 */

export const professionalTheme = {
  // Core brand colors (keeping Hedera/TRST alignment)
  colors: {
    // Background system
    background: {
      primary: '#0B1622',     // Deep navy (current baseline)
      secondary: '#111827',   // Slightly lighter panels
      glass: '#1E293B',       // Glass panel overlay
      gradient: 'linear-gradient(135deg, #0B1622 0%, #111827 100%)',
    },
    
    // Accent system (teal/cyan for professional)
    accent: {
      primary: '#00F6FF',     // Teal neon (current - perfect for professional)
      secondary: '#16A34A',   // Neon green for trust elements
      tertiary: '#06B6D4',    // Cyan variant for highlights
    },
    
    // Text hierarchy
    text: {
      primary: '#E5E7EB',     // Light gray (current)
      secondary: '#9CA3AF',   // Muted gray (current)
      tertiary: '#6B7280',    // Even more muted for metadata
      accent: '#00F6FF',      // Accent color text
    },
    
    // Status indicators
    status: {
      success: '#22C55E',     // Green (trust LED)
      warning: '#FACC15',     // Yellow (pending)
      error: '#EF4444',       // Red (error states)
      info: '#3B82F6',        // Blue (informational)
    },
    
    // Border system (key for minimal aesthetic)
    border: {
      default: '#334155',     // Subtle gray border
      accent: '#00F6FF',      // Neon accent border
      glass: 'rgba(0, 246, 255, 0.1)', // Translucent accent
      glow: '0 0 4px rgba(0, 246, 255, 0.3)', // Neon glow effect
    }
  },
  
  // Typography scale
  typography: {
    fonts: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'Consolas', 'Monaco', 'monospace'],
    },
    weights: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    sizes: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem', // 30px
    }
  },
  
  // Spacing system
  spacing: {
    xs: '0.25rem',  // 4px
    sm: '0.5rem',   // 8px
    md: '1rem',     // 16px
    lg: '1.5rem',   // 24px
    xl: '2rem',     // 32px
    '2xl': '3rem',  // 48px
    '3xl': '4rem',  // 64px
  },
  
  // Component-specific styles
  components: {
    card: {
      background: 'rgba(30, 41, 59, 0.7)',  // Glass effect
      border: '1px solid #334155',
      borderRadius: '0.75rem',  // 12px
      backdropBlur: 'blur(8px)',
      hover: {
        border: '1px solid #00F6FF',
        boxShadow: '0 0 4px rgba(0, 246, 255, 0.3)',
      }
    },
    
    button: {
      primary: {
        background: 'linear-gradient(135deg, #00F6FF 0%, #06B6D4 100%)',
        color: '#0B1622',
        hover: {
          transform: 'translateY(-1px)',
          boxShadow: '0 4px 8px rgba(0, 246, 255, 0.3)',
        }
      },
      ghost: {
        background: 'transparent',
        color: '#E5E7EB',
        border: '1px solid #334155',
        hover: {
          background: 'rgba(0, 246, 255, 0.1)',
          border: '1px solid #00F6FF',
        }
      }
    },
    
    input: {
      background: 'rgba(30, 41, 59, 0.5)',
      border: '2px solid #334155',
      focus: {
        border: '2px solid #00F6FF',
        boxShadow: '0 0 4px rgba(0, 246, 255, 0.3)',
      }
    },
    
    badge: {
      primary: {
        background: 'rgba(0, 246, 255, 0.2)',
        color: '#00F6FF',
        border: '1px solid rgba(0, 246, 255, 0.3)',
      },
      success: {
        background: 'rgba(34, 197, 94, 0.2)',
        color: '#22C55E',
        border: '1px solid rgba(34, 197, 94, 0.3)',
      }
    }
  },
  
  // Animation system
  animations: {
    duration: {
      fast: '150ms',
      normal: '300ms',
      slow: '500ms',
    },
    easing: {
      default: 'cubic-bezier(0.4, 0, 0.2, 1)',
      smooth: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    }
  }
} as const

// Tailwind CSS custom properties for theme
export const professionalThemeCSS = `
:root {
  /* Background system */
  --bg-primary: #0B1622;
  --bg-secondary: #111827;
  --bg-glass: rgba(30, 41, 59, 0.7);
  --bg-gradient: linear-gradient(135deg, #0B1622 0%, #111827 100%);
  
  /* Accent system */
  --accent-primary: #00F6FF;
  --accent-secondary: #16A34A;
  --accent-tertiary: #06B6D4;
  
  /* Text colors */
  --text-primary: #E5E7EB;
  --text-secondary: #9CA3AF;
  --text-tertiary: #6B7280;
  --text-accent: #00F6FF;
  
  /* Status colors */
  --status-success: #22C55E;
  --status-warning: #FACC15;
  --status-error: #EF4444;
  --status-info: #3B82F6;
  
  /* Border system */
  --border-default: #334155;
  --border-accent: #00F6FF;
  --border-glass: rgba(0, 246, 255, 0.1);
  --border-glow: 0 0 4px rgba(0, 246, 255, 0.3);
}

/* Component overrides for professional theme */
.theme-professional {
  background: var(--bg-gradient);
  color: var(--text-primary);
}

.theme-professional .card-glass {
  background: var(--bg-glass);
  backdrop-filter: blur(8px);
  border: 1px solid var(--border-default);
  transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
}

.theme-professional .card-glass:hover {
  border-color: var(--accent-primary);
  box-shadow: var(--border-glow);
}

.theme-professional .btn-primary {
  background: linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-tertiary) 100%);
  color: var(--bg-primary);
  font-weight: 500;
  transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
}

.theme-professional .btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 246, 255, 0.3);
}

.theme-professional .input-field {
  background: rgba(30, 41, 59, 0.5);
  border: 2px solid var(--border-default);
  transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
}

.theme-professional .input-field:focus {
  border-color: var(--accent-primary);
  box-shadow: var(--border-glow);
  outline: none;
}

.theme-professional .badge-accent {
  background: rgba(0, 246, 255, 0.2);
  color: var(--accent-primary);
  border: 1px solid rgba(0, 246, 255, 0.3);
}

.theme-professional .pulse-accent {
  animation: pulse-neon 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse-neon {
  0%, 100% {
    opacity: 1;
    filter: drop-shadow(0 0 4px rgba(0, 246, 255, 0.3));
  }
  50% {
    opacity: 0.8;
    filter: drop-shadow(0 0 8px rgba(0, 246, 255, 0.5));
  }
}

.theme-professional .sparkle-animation {
  animation: sparkle 3s ease-in-out infinite;
}

@keyframes sparkle {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.05); }
}
`