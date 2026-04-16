import type { ComponentChildren } from 'preact';

export interface CardProps {
  /** The grapheme string to display, e.g. "sh", "ai", "s" */
  grapheme: string;
  /** 0-indexed position of the ORP (Optimal Recognition Point) character */
  orpIndex: number;
  /** Whether this card is currently the active RSVP display */
  isActive?: boolean;
  /** Optional children rendered below the grapheme (e.g. example word) */
  children?: ComponentChildren;
  /** Accessible label override */
  'aria-label'?: string;
}

/**
 * Card — fixed-position RSVP display for phoneme presentation.
 *
 * The grapheme is rendered character-by-character so the ORP character
 * can be visually highlighted. This guides the reader's eye to the
 * optimal fixation point, which is critical for the RSVP technique.
 *
 * Design:
 * - Centered in viewport for RSVP
 * - Large, clear typography with phoneme letter-spacing
 * - ORP character highlighted with accent color + subtle background
 * - Warm card surface, soft shadow for tactile feel
 * - Transitions gated by prefers-reduced-motion via tokens
 */
export function Card({
  grapheme,
  orpIndex,
  isActive = false,
  children,
  ...rest
}: CardProps) {
  const ariaLabel = rest['aria-label'] ?? `Phoneme: ${grapheme}`;
  const clampedOrp = Math.max(0, Math.min(orpIndex, grapheme.length - 1));

  return (
    <div
      class={`card ${isActive ? 'card--active' : ''}`}
      role="img"
      aria-label={ariaLabel}
      aria-live={isActive ? 'assertive' : 'off'}
      aria-atomic="true"
    >
      <span class="card__grapheme" aria-hidden="true">
        {[...grapheme].map((char, i) => (
          <span
            key={`${char}-${i}`}
            class={i === clampedOrp ? 'card__char card__char--orp' : 'card__char'}
          >
            {char}
          </span>
        ))}
      </span>

      {children && (
        <div class="card__body">
          {children}
        </div>
      )}
    </div>
  );
}

export const CardStyles = /* css */ `
  .card {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-4);

    background-color: var(--color-card);
    border-radius: var(--radius-xl);
    box-shadow: var(--shadow-md);
    padding: var(--space-8) var(--space-10);

    min-width: 240px;
    min-height: 180px;

    position: relative;
    z-index: var(--z-card);

    transition-property: transform, box-shadow, opacity;
    transition-duration: var(--duration-normal);
    transition-timing-function: var(--ease-out);
  }

  .card--active {
    box-shadow: var(--shadow-lg);
    transform: scale(1);
  }

  /* --- Grapheme display --- */
  .card__grapheme {
    display: flex;
    align-items: baseline;
    justify-content: center;

    font-family: var(--font-active);
    font-size: var(--text-3xl);
    font-weight: var(--weight-extrabold);
    letter-spacing: var(--tracking-phoneme);
    line-height: var(--leading-tight);
    color: var(--color-text);
  }

  /* Individual character */
  .card__char {
    display: inline-block;
    padding: 0 2px;
    transition: color var(--duration-fast) var(--ease-out);
  }

  /* ORP-highlighted character */
  .card__char--orp {
    color: var(--color-orp);
    background-color: var(--color-orp-bg);
    border-radius: var(--radius-sm);
    padding: 2px 4px;
    margin: 0 -2px;
  }

  /* Body area below grapheme */
  .card__body {
    font-size: var(--text-lg);
    font-weight: var(--weight-semibold);
    color: var(--color-text-muted);
    text-align: center;
  }
`;
