/**
 * Fairfield Voice Theme - Professional Civic Campaign Aesthetic
 * Following Professional lens theming patterns for consistency
 */

export const fairfieldVoiceTheme = {
  // Core Color Palette - High contrast civic theme
  colors: {
    // Primary Civic Colors
    primary: '#000000',           // Black for maximum professionalism
    primaryRgb: '0, 0, 0',
    
    // Secondary Accents
    secondary: '#ffffff',         // Pure white for contrast
    accent: '#2563eb',           // Professional blue for highlights
    success: '#16a34a',          // Green for positive actions
    warning: '#eab308',          // Gold for attention
    error: '#dc2626',            // Red for errors
    
    // Background System - Clean white-based
    background: {
      primary: '#ffffff',        // Pure white background
      secondary: '#f8fafc',      // Off-white for panels
      tertiary: '#f1f5f9',       // Light gray for cards
      glass: 'rgba(248, 250, 252, 0.95)', // Semi-transparent panels
      card: '#f5f5f5',           // Card background with subtle gray
    },
    
    // Text System - High contrast black-based
    text: {
      primary: '#000000',        // Pure black for headlines
      secondary: '#1f2937',      // Dark gray for body text
      tertiary: '#374151',       // Medium gray for captions
      muted: '#6b7280',          // Light gray for metadata
      accent: '#2563eb',         // Blue for links/highlights
    },
    
    // Border System - Strong definition
    border: {
      default: '#000000',        // Black borders for definition
      light: '#e5e7eb',          // Light gray for subtle borders
      accent: '#2563eb',         // Blue for interactive elements
      focus: '#3b82f6',          // Brighter blue for focus states
    }
  },
  
  // Typography Scale - Professional civic fonts
  typography: {
    fonts: {
      display: "ui-serif, Georgia, 'Times New Roman', Times, serif", // Serif for headlines
      body: "ui-sans-serif, system-ui, -apple-system, sans-serif",   // Sans for body
      mono: "'JetBrains Mono', Consolas, Monaco, monospace",
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
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
      black: 900,
    },
    
    lineHeights: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.6,
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
    lg: '0.75rem',    // 12px
    xl: '1rem',       // 16px
    '2xl': '1.5rem',  // 24px
    full: '9999px',
  },
  
  // Shadow System - Minimal, clean shadows
  shadows: {
    none: 'none',
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
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
      'ease-in-out': 'ease-in-out',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    },
  },
  
  // Component Variants
  components: {
    // Cards
    card: {
      base: 'bg-[var(--fairfield-card)] border-4 border-[var(--fairfield-border)] rounded-xl',
      interactive: 'hover:bg-[var(--fairfield-card-hover)] hover:shadow-lg transition-all duration-300',
      disabled: 'opacity-60 cursor-not-allowed bg-[var(--fairfield-card-disabled)]',
    },
    
    // Buttons
    button: {
      primary: 'bg-[var(--fairfield-primary)] text-[var(--fairfield-primary-foreground)] border-4 border-[var(--fairfield-primary)] font-bold',
      secondary: 'bg-[var(--fairfield-secondary)] text-[var(--fairfield-secondary-foreground)] border-4 border-[var(--fairfield-border)] font-bold',
      ghost: 'bg-transparent text-[var(--fairfield-text-primary)] border-2 border-[var(--fairfield-border)] hover:bg-[var(--fairfield-card)]',
    },
    
    // Status Indicators
    status: {
      available: 'bg-[var(--fairfield-success)] text-white border-4 border-[var(--fairfield-border)] font-bold',
      locked: 'bg-[var(--fairfield-warning)] text-black border-4 border-[var(--fairfield-border)] font-bold',
      leader: 'bg-black text-white border-4 border-[var(--fairfield-warning)]',
    },
    
    // Input Fields
    input: {
      base: 'bg-white border-4 border-[var(--fairfield-border)] text-[var(--fairfield-text-primary)] font-medium',
      focus: 'focus:border-[var(--fairfield-accent)] focus:ring-2 focus:ring-[var(--fairfield-accent)]/20',
    },
  },
}

// CSS Custom Properties for Fairfield Voice Theme
export const fairfieldVoiceCSS = `
:root.theme-fairfield-voice,
.theme-fairfield-voice,
html.theme-fairfield-voice,
html.theme-fairfield-voice * {
  /* ==> FAIRFIELD VOICE BRAND COLORS */
  --fairfield-primary: #000000 !important;
  --fairfield-primary-foreground: #ffffff !important;
  --fairfield-secondary: #ffffff !important;
  --fairfield-secondary-foreground: #000000 !important;
  --fairfield-accent: #2563eb !important;
  --fairfield-success: #16a34a !important;
  --fairfield-warning: #eab308 !important;
  --fairfield-error: #dc2626 !important;
  
  /* ==> BACKGROUND SURFACES */
  --background: #ffffff !important;
  --fairfield-background: #ffffff !important;
  --fairfield-background-secondary: #f8fafc !important;
  --fairfield-card: #f5f5f5 !important;
  --fairfield-card-hover: #eeeeee !important;
  --fairfield-card-disabled: #f0f0f0 !important;
  
  /* ==> TEXT HIERARCHY */
  --foreground: #000000 !important;
  --fairfield-text-primary: #000000 !important;
  --fairfield-text-secondary: #1f2937 !important;
  --fairfield-text-tertiary: #374151 !important;
  --fairfield-text-muted: #6b7280 !important;
  
  /* ==> BORDERS */
  --fairfield-border: #000000 !important;
  --fairfield-border-light: #e5e7eb !important;
  --fairfield-border-accent: #2563eb !important;
  
  /* ==> COMPONENT OVERRIDES */
  --card: var(--fairfield-card) !important;
  --card-foreground: var(--fairfield-text-primary) !important;
  --primary: var(--fairfield-primary) !important;
  --primary-foreground: var(--fairfield-primary-foreground) !important;
  --secondary: var(--fairfield-card) !important;
  --secondary-foreground: var(--fairfield-text-primary) !important;
  --muted: var(--fairfield-background-secondary) !important;
  --muted-foreground: var(--fairfield-text-muted) !important;
  --border: var(--fairfield-border-light) !important;
  --input: #ffffff !important;
  --ring: var(--fairfield-accent) !important;
}

/* ==> UNIVERSAL ELEMENT OVERRIDES */
html.theme-fairfield-voice,
html.theme-fairfield-voice body {
  background-color: var(--fairfield-background) !important;
  color: var(--fairfield-text-primary) !important;
  font-family: ui-sans-serif, system-ui, -apple-system, sans-serif !important;
}

/* ==> FAIRFIELD VOICE COMPONENT STYLES */

/* Display Typography */
.fairfield-display {
  font-family: ui-serif, Georgia, 'Times New Roman', Times, serif !important;
  font-weight: 900 !important;
  color: var(--fairfield-text-primary) !important;
  line-height: 1.2 !important;
}

/* Heading Typography */
.fairfield-heading {
  font-family: ui-sans-serif, system-ui, -apple-system, sans-serif !important;
  font-weight: 800 !important;
  color: var(--fairfield-text-primary) !important;
  line-height: 1.3 !important;
}

/* Body Typography */
.fairfield-body {
  font-family: ui-sans-serif, system-ui, -apple-system, sans-serif !important;
  font-weight: 700 !important;
  color: var(--fairfield-text-primary) !important;
  line-height: 1.5 !important;
}

/* Caption Typography */
.fairfield-caption {
  font-family: ui-sans-serif, system-ui, -apple-system, sans-serif !important;
  font-weight: 700 !important;
  color: var(--fairfield-text-primary) !important;
  line-height: 1.4 !important;
}

/* Muted Typography */
.fairfield-muted {
  font-family: ui-sans-serif, system-ui, -apple-system, sans-serif !important;
  font-weight: 600 !important;
  color: var(--fairfield-text-muted) !important;
  line-height: 1.4 !important;
}

/* ==> LAYOUT COMPONENTS */

.fairfield-page {
  min-height: 100vh !important;
  background: var(--fairfield-background) !important;
  padding: 1.5rem 1rem !important;
}

.fairfield-container {
  max-width: 28rem !important;
  margin: 0 auto !important;
  display: flex !important;
  flex-direction: column !important;
  gap: 1.5rem !important;
}

/* ==> CARD SYSTEM */

.fairfield-card {
  background: var(--fairfield-card) !important;
  border: 4px solid var(--fairfield-border) !important;
  border-radius: 1rem !important;
  padding: 2rem !important;
  transition: all 0.2s ease !important;
}

.fairfield-card:hover {
  background: var(--fairfield-card-hover) !important;
}

.fairfield-card-interactive {
  cursor: pointer !important;
}

.fairfield-card-interactive:hover {
  background: var(--fairfield-card-hover) !important;
  transform: translateY(-2px) !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
}

.fairfield-card-disabled {
  opacity: 0.6 !important;
  cursor: not-allowed !important;
  background: var(--fairfield-card-disabled) !important;
  border-color: var(--fairfield-text-muted) !important;
}

.fairfield-card-leader {
  background: var(--fairfield-primary) !important;
  border: 4px solid var(--fairfield-warning) !important;
  color: var(--fairfield-primary-foreground) !important;
}

.fairfield-card-leader * {
  color: var(--fairfield-primary-foreground) !important;
}

/* ==> BUTTON SYSTEM */

.fairfield-btn {
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 0.5rem !important;
  padding: 0.875rem 1.5rem !important;
  font-family: ui-sans-serif, system-ui, -apple-system, sans-serif !important;
  font-weight: 700 !important;
  font-size: 1rem !important;
  line-height: 1.25 !important;
  border-radius: 0.75rem !important;
  border: none !important;
  cursor: pointer !important;
  transition: all 0.2s ease !important;
  text-decoration: none !important;
}

.fairfield-btn-primary {
  background: var(--fairfield-primary) !important;
  color: var(--fairfield-primary-foreground) !important;
  border: 4px solid var(--fairfield-primary) !important;
}

.fairfield-btn-primary:hover {
  background: #333333 !important;
  border-color: #333333 !important;
  transform: translateY(-1px) !important;
}

.fairfield-btn-primary * {
  color: var(--fairfield-primary-foreground) !important;
}

.fairfield-btn-secondary {
  background: var(--fairfield-secondary) !important;
  color: var(--fairfield-secondary-foreground) !important;
  border: 4px solid var(--fairfield-border) !important;
}

.fairfield-btn-secondary:hover {
  background: var(--fairfield-card-hover) !important;
  border-color: var(--fairfield-border) !important;
}

/* ==> STATUS SYSTEM */

.fairfield-status {
  padding: 0.75rem 1rem !important;
  border-radius: 0.5rem !important;
  font-weight: 700 !important;
  font-size: 0.875rem !important;
  text-align: center !important;
}

.fairfield-status-locked {
  background: var(--fairfield-warning) !important;
  color: var(--fairfield-primary) !important;
  border: 4px solid var(--fairfield-border) !important;
}

.fairfield-status-available {
  background: var(--fairfield-success) !important;
  color: var(--fairfield-primary-foreground) !important;
  border: 4px solid var(--fairfield-border) !important;
}

/* ==> PROGRESS SYSTEM */

.fairfield-progress-ring {
  width: 6rem !important;
  height: 6rem !important;
  margin: 0 auto !important;
  position: relative !important;
}

.fairfield-progress-ring svg {
  transform: rotate(-90deg) !important;
  width: 100% !important;
  height: 100% !important;
}

.fairfield-progress-bg {
  fill: none !important;
  stroke: var(--fairfield-border-light) !important;
  stroke-width: 4 !important;
}

.fairfield-progress-fill {
  fill: none !important;
  stroke: var(--fairfield-primary) !important;
  stroke-width: 4 !important;
  transition: stroke-dasharray 0.5s ease !important;
}

.fairfield-progress-text {
  position: absolute !important;
  inset: 0 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  font-weight: 900 !important;
  font-size: 1.5rem !important;
  color: var(--fairfield-text-primary) !important;
}

/* ==> ICON SYSTEM */

.fairfield-icon {
  width: 1.5rem !important;
  height: 1.5rem !important;
  flex-shrink: 0 !important;
  color: currentColor !important;
}

.fairfield-icon-lg {
  width: 2rem !important;
  height: 2rem !important;
  flex-shrink: 0 !important;
  color: currentColor !important;
}

.fairfield-icon-container {
  padding: 0.75rem !important;
  border-radius: 0.75rem !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  border: 2px solid var(--fairfield-border) !important;
}

.fairfield-icon-blue {
  background: var(--fairfield-accent) !important;
  color: white !important;
}

.fairfield-icon-green {
  background: var(--fairfield-success) !important;
  color: white !important;
}

.fairfield-icon-purple {
  background: #9c27b0 !important;
  color: white !important;
}

.fairfield-icon-gray {
  background: var(--fairfield-text-muted) !important;
  color: white !important;
}

/* ==> FOOTER SYSTEM */

.fairfield-footer {
  margin-top: 3rem !important;
  padding-top: 2rem !important;
  border-top: 4px solid var(--fairfield-border) !important;
  text-align: center !important;
}

.fairfield-footer-primary {
  font-weight: 800 !important;
  color: var(--fairfield-text-primary) !important;
  margin-bottom: 0.75rem !important;
  font-size: 1.125rem !important;
}

.fairfield-footer-secondary {
  font-weight: 700 !important;
  color: var(--fairfield-text-secondary) !important;
  font-size: 1rem !important;
}

/* ==> RESPONSIVE ADJUSTMENTS */
@media (max-width: 640px) {
  .fairfield-page {
    padding: 1rem 0.75rem !important;
  }
  
  .fairfield-container {
    gap: 1.25rem !important;
  }
  
  .fairfield-card {
    padding: 1.25rem !important;
  }
}
`;