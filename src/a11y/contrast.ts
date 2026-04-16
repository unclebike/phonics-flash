/**
 * Contrast mode utilities — theme and high-contrast switching.
 *
 * Sets `data-theme` ("light" | "dark") and `data-contrast` ("normal" | "high")
 * on <html>. Tokens.css has overrides for each combination.
 * Persists to localStorage. Respects prefers-color-scheme on first visit.
 */

import { signal, effect, computed } from '@preact/signals';

const THEME_KEY = 'phonics-flash:theme';
const CONTRAST_KEY = 'phonics-flash:contrast';

export type Theme = 'light' | 'dark';
export type ContrastLevel = 'normal' | 'high';

export const theme = signal<Theme>(loadTheme());
export const contrastLevel = signal<ContrastLevel>(loadContrast());
export const isHighContrast = computed(() => contrastLevel.value === 'high');
export const isDarkMode = computed(() => theme.value === 'dark');

function loadTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function loadContrast(): ContrastLevel {
  if (typeof window === 'undefined') return 'normal';
  const stored = localStorage.getItem(CONTRAST_KEY);
  if (stored === 'high') return 'high';
  if (window.matchMedia('(prefers-contrast: more)').matches) return 'high';
  return 'normal';
}

function applyTheme(t: Theme): void {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme', t);
}

function applyContrast(c: ContrastLevel): void {
  if (typeof document === 'undefined') return;
  if (c === 'high') {
    document.documentElement.setAttribute('data-contrast', 'high');
  } else {
    document.documentElement.removeAttribute('data-contrast');
  }
}

// Apply on load
if (typeof window !== 'undefined') {
  applyTheme(theme.value);
  applyContrast(contrastLevel.value);
}

// Sync to DOM + localStorage
effect(() => {
  const t = theme.value;
  applyTheme(t);
  if (typeof window !== 'undefined') localStorage.setItem(THEME_KEY, t);
});

effect(() => {
  const c = contrastLevel.value;
  applyContrast(c);
  if (typeof window !== 'undefined') localStorage.setItem(CONTRAST_KEY, c);
});

// Listen for OS-level changes
if (typeof window !== 'undefined') {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem(THEME_KEY)) {
      theme.value = e.matches ? 'dark' : 'light';
    }
  });
  window.matchMedia('(prefers-contrast: more)').addEventListener('change', (e) => {
    if (!localStorage.getItem(CONTRAST_KEY)) {
      contrastLevel.value = e.matches ? 'high' : 'normal';
    }
  });
}

/** Toggle between light and dark themes */
export function toggleTheme(): void {
  theme.value = theme.value === 'dark' ? 'light' : 'dark';
}

/** Set theme explicitly */
export function setTheme(t: Theme): void {
  theme.value = t;
}

/** Toggle high-contrast mode */
export function toggleHighContrast(): void {
  contrastLevel.value = contrastLevel.value === 'high' ? 'normal' : 'high';
}

/** Set contrast level explicitly */
export function setContrastLevel(c: ContrastLevel): void {
  contrastLevel.value = c;
}

/**
 * Cycle through display modes in kid-friendly order:
 * light -> dark -> high-contrast light -> high-contrast dark -> light
 */
export function cycleDisplayMode(): void {
  const t = theme.value;
  const c = contrastLevel.value;

  if (c === 'normal' && t === 'light') {
    theme.value = 'dark';
  } else if (c === 'normal' && t === 'dark') {
    contrastLevel.value = 'high';
    theme.value = 'light';
  } else if (c === 'high' && t === 'light') {
    theme.value = 'dark';
  } else {
    contrastLevel.value = 'normal';
    theme.value = 'light';
  }
}
