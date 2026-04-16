export {
  reducedMotion,
  prefersReducedMotion,
  motionSafe,
  safeDuration,
  onMotionChange,
} from './motion';

export {
  fontMode,
  toggleDyslexiaFont,
  setFontMode,
  isDyslexiaFont,
} from './fonts';
export type { FontMode } from './fonts';

export { SrOnly, SrOnlyStyles } from './sr-only';
export type { SrOnlyProps } from './sr-only';

export {
  theme,
  contrastLevel,
  isHighContrast,
  isDarkMode,
  toggleTheme,
  setTheme,
  toggleHighContrast,
  setContrastLevel,
  cycleDisplayMode,
} from './contrast';
export type { Theme, ContrastLevel } from './contrast';
