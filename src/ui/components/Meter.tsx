export type MeterVariant = 'primary' | 'success';
export type MeterSize = 'sm' | 'md';

export interface MeterProps {
  /** Progress value in the range [0, 1] */
  value: number;
  /** Accessible label */
  label?: string;
  /** Color variant (default 'primary') */
  variant?: MeterVariant;
  /** Height variant (default 'md') */
  size?: MeterSize;
}

/**
 * Meter — horizontal progress bar for session-level progress.
 *
 * Token-driven colors; fill width animates smoothly (duration
 * collapses under prefers-reduced-motion via token).
 */
export function Meter({
  value,
  label,
  variant = 'primary',
  size = 'md',
}: MeterProps) {
  const clamped = Math.max(0, Math.min(1, value));
  const percent = Math.round(clamped * 100);
  const ariaLabel = label ?? `${percent}% complete`;

  const classes = ['meter', `meter--${variant}`, `meter--${size}`].join(' ');

  return (
    <div
      class={classes}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      aria-label={ariaLabel}
    >
      <div
        class="meter__fill"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

export const MeterStyles = /* css */ `
  .meter {
    position: relative;
    width: 100%;
    background-color: rgba(74, 74, 74, 0.15);
    border-radius: var(--radius-full);
    overflow: hidden;
  }

  .meter--sm { height: 6px; }
  .meter--md { height: 12px; }

  .meter__fill {
    height: 100%;
    border-radius: var(--radius-full);
    transition: width var(--duration-normal) var(--ease-out);
  }

  .meter--primary .meter__fill {
    background-color: var(--color-primary);
  }

  .meter--success .meter__fill {
    background-color: var(--color-success);
  }
`;
