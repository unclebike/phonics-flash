/**
 * Dyslexia font toggle — switches between primary and dyslexia-friendly fonts.
 *
 * Sets `data-font="dyslexia"` on <html> to activate the CSS overrides
 * in tokens.css (wider tracking, taller line-height, OpenDyslexic family).
 * Persists choice to localStorage.
 */

import { signal, effect } from '@preact/signals';

const STORAGE_KEY = 'phonics-flash:font-mode';

export type FontMode = 'default' | 'dyslexia';

/** Reactive signal for the current font mode */
export const fontMode = signal<FontMode>(loadFontMode());

function loadFontMode(): FontMode {
  if (typeof window === 'undefined') return 'default';
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'dyslexia') return 'dyslexia';
  return 'default';
}

function applyFontMode(mode: FontMode): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (mode === 'dyslexia') {
    root.setAttribute('data-font', 'dyslexia');
  } else {
    root.removeAttribute('data-font');
  }
}

// Apply on load
if (typeof window !== 'undefined') {
  applyFontMode(fontMode.value);
}

// Keep DOM + localStorage in sync whenever the signal changes
effect(() => {
  const mode = fontMode.value;
  applyFontMode(mode);
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, mode);
  }
});

/** Toggle between default and dyslexia font modes. */
export function toggleDyslexiaFont(): void {
  fontMode.value = fontMode.value === 'dyslexia' ? 'default' : 'dyslexia';
}

/** Set font mode explicitly. */
export function setFontMode(mode: FontMode): void {
  fontMode.value = mode;
}

/** Check if dyslexia font is currently active. */
export function isDyslexiaFont(): boolean {
  return fontMode.value === 'dyslexia';
}
