/**
 * STARFRONT WORLD — UI V2 TOKENS & DESIGN CONSTANTS
 * Modern Aerospace Sci-Fi Architecture
 * 
 * Strictly isolated from V1 styling and CRT scanlines.
 */

export const V2_TOKENS = {
  colors: {
    canvas: 'var(--sf-v2-canvas, #070A12)',
    panel: 'var(--sf-v2-panel, #0F172A)',
    panelRaised: 'var(--sf-v2-panel-raised, #142338)',
    border: 'var(--sf-v2-border, #26384D)',
    borderLight: '#3B526D',
    text: 'var(--sf-v2-text, #F1F5F9)',
    textMuted: 'var(--sf-v2-text-muted, #A7B6C8)',
    accentCyan: 'var(--sf-v2-accent-cyan, #06B6D4)',
    accentTeal: 'var(--sf-v2-accent-teal, #14B8A6)',
    warning: 'var(--sf-v2-warning, #FBBF24)',
    danger: 'var(--sf-v2-danger, #F87171)',
    success: 'var(--sf-v2-success, #34D399)',
  },
  typography: {
    bodySize: '16px',
    storySize: '17px',
    storyLineHeight: '1.65',
    secondarySize: '14px',
    minSize: '12px',
  },
  touchTarget: {
    minSize: '44px',
  },
  zIndex: {
    dropdown: 50,
    drawer: 60,
    modal: 70,
    tooltip: 80,
    notification: 90,
  },
} as const

export type V2ColorToken = keyof typeof V2_TOKENS.colors
