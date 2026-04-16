/**
 * Motion utilities — gate all animations on user preference.
 *
 * CSS tokens already collapse durations to 0ms when reduced motion
 * is preferred (see tokens.css). These JS utilities are for imperative
 * animation code (requestAnimationFrame, Web Animations API, canvas).
 */

import { signal, effect } from '@preact/signals';

/** Reactive signal: true if user prefers reduced motion */
export const reducedMotion = signal(
  typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false
);

// Keep the signal in sync with OS-level changes
if (typeof window !== 'undefined') {
  const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
  mql.addEventListener('change', (e) => {
    reducedMotion.value = e.matches;
  });
}

/**
 * Static check — returns true if the user prefers reduced motion.
 */
export function prefersReducedMotion(): boolean {
  return reducedMotion.value;
}

/**
 * Run a callback only when motion is allowed.
 * If motion is reduced, the fallback (if provided) runs instead.
 */
export function motionSafe(
  action: () => void,
  fallback?: () => void,
): void {
  if (prefersReducedMotion()) {
    fallback?.();
  } else {
    action();
  }
}

/**
 * Returns a duration in ms, respecting reduced motion preference.
 * When motion is reduced, returns 0.
 */
export function safeDuration(ms: number): number {
  return prefersReducedMotion() ? 0 : ms;
}

/**
 * Subscribe to motion preference changes. Returns an unsubscribe function.
 */
export function onMotionChange(callback: (reduced: boolean) => void): () => void {
  return effect(() => {
    callback(reducedMotion.value);
  });
}
