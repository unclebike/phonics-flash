/**
 * Inject component CSS into the document head at runtime.
 * Call this once at app startup.
 *
 * This approach keeps styles colocated with components while
 * avoiding build-time CSS extraction complexity. The bundler
 * tree-shakes unused component styles since they are named exports.
 */

import { ButtonStyles } from './components/Button';
import { CardStyles } from './components/Card';
import { SparkleStyles } from './components/Sparkle';
import { ProgressRingStyles } from './components/ProgressRing';
import { MeterStyles } from './components/Meter';
import { SrOnlyStyles } from '../a11y/sr-only';

const ALL_STYLES = [
  ButtonStyles,
  CardStyles,
  SparkleStyles,
  ProgressRingStyles,
  MeterStyles,
  SrOnlyStyles,
].join('\n');

let injected = false;

export function injectComponentStyles(): void {
  if (injected || typeof document === 'undefined') return;
  const style = document.createElement('style');
  style.setAttribute('data-phonics-flash', 'components');
  style.textContent = ALL_STYLES;
  document.head.appendChild(style);
  injected = true;
}
