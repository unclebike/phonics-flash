import type { ComponentChildren } from 'preact';

export interface ProgressRingProps {
  /** Progress value in the range [0, 1] */
  progress: number;
  /** Outer diameter in pixels (default 48) */
  size?: number;
  /** Ring stroke width in pixels (default 4) */
  strokeWidth?: number;
  /** Ring color — CSS color or `var(--token)` reference. Default: var(--color-primary) */
  color?: string;
  /** Track (unfilled) color. Default: muted text at low opacity */
  trackColor?: string;
  /** Content rendered absolutely-centered inside the ring */
  children?: ComponentChildren;
  /** Accessible label for screen readers */
  label?: string;
}

/**
 * ProgressRing — circular progress indicator.
 *
 * SVG-based ring using stroke-dasharray / stroke-dashoffset. Progress
 * animates smoothly; animation duration collapses to 0ms under
 * prefers-reduced-motion (via --duration-normal token).
 *
 * Children render absolutely-positioned in the center for labels or
 * small icons (e.g. a star on completion).
 */
export function ProgressRing({
  progress,
  size = 48,
  strokeWidth = 4,
  color = 'var(--color-primary)',
  trackColor = 'rgba(74, 74, 74, 0.2)',
  children,
  label,
}: ProgressRingProps) {
  const clamped = Math.max(0, Math.min(1, progress));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - clamped);
  const center = size / 2;

  const percent = Math.round(clamped * 100);
  const ariaLabel = label ?? `${percent}% complete`;

  return (
    <div
      class="progress-ring"
      style={{ width: `${size}px`, height: `${size}px` }}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      aria-label={ariaLabel}
    >
      <svg
        class="progress-ring__svg"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        aria-hidden="true"
      >
        <circle
          class="progress-ring__track"
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={trackColor}
          stroke-width={strokeWidth}
        />
        <circle
          class="progress-ring__fill"
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          stroke-width={strokeWidth}
          stroke-linecap="round"
          stroke-dasharray={circumference}
          stroke-dashoffset={dashOffset}
          transform={`rotate(-90 ${center} ${center})`}
        />
      </svg>
      {children != null && (
        <div class="progress-ring__content" aria-hidden="true">
          {children}
        </div>
      )}
    </div>
  );
}

export const ProgressRingStyles = /* css */ `
  .progress-ring {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    line-height: 0;
  }

  .progress-ring__svg {
    display: block;
  }

  .progress-ring__fill {
    transition: stroke-dashoffset var(--duration-normal) var(--ease-out);
  }

  .progress-ring__content {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: var(--leading-tight);
    font-family: var(--font-active);
    font-weight: var(--weight-bold);
    color: var(--color-text);
  }
`;
