import { useEffect, useRef } from 'preact/hooks';
import { prefersReducedMotion } from '../../a11y/motion';

export interface SparkleProps {
  /** When true, the sparkle animation plays */
  active: boolean;
  /** Called when the animation finishes (or immediately if motion is reduced) */
  onComplete?: () => void;
}

/** Number of sparkle particles */
const PARTICLE_COUNT = 8;

/**
 * Sparkle — reward micro-animation on correct answer.
 *
 * Renders a burst of small star/dot elements that animate outward
 * from center, then fade. Fully CSS-driven for performance.
 *
 * Motion safety:
 * - If prefers-reduced-motion is active, no animation plays;
 *   onComplete fires immediately.
 * - Animation uses transform + opacity only (no layout thrash).
 * - Duration well under flicker thresholds (no 3-60 Hz patterns).
 */
export function Sparkle({ active, onComplete }: SparkleProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!active) return;

    // If user prefers reduced motion, skip animation entirely
    if (prefersReducedMotion()) {
      onComplete?.();
      return;
    }

    const timer = setTimeout(() => {
      onComplete?.();
    }, 600); // matches --duration-sparkle

    return () => clearTimeout(timer);
  }, [active, onComplete]);

  if (!active) return null;

  // If reduced motion, render a static subtle indicator instead
  if (prefersReducedMotion()) {
    return (
      <div class="sparkle sparkle--static" aria-hidden="true">
        <span class="sparkle__star">&#9733;</span>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      class="sparkle"
      aria-hidden="true"
    >
      {Array.from({ length: PARTICLE_COUNT }, (_, i) => (
        <span
          key={i}
          class="sparkle__particle"
          style={{ '--particle-index': i } as any}
        />
      ))}
    </div>
  );
}

export const SparkleStyles = /* css */ `
  .sparkle {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    z-index: var(--z-sparkle);
    pointer-events: none;
  }

  /* Static fallback for reduced motion */
  .sparkle--static {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .sparkle__star {
    font-size: var(--text-xl);
    color: var(--color-reward);
  }

  /* Individual particle */
  .sparkle__particle {
    position: absolute;
    width: 10px;
    height: 10px;
    border-radius: var(--radius-full);
    background-color: var(--color-reward);
    transform: translate(-50%, -50%);
    animation: sparkle-burst var(--duration-sparkle) var(--ease-out) forwards;
    animation-delay: calc(var(--particle-index, 0) * 30ms);
  }

  /* Alternate colors for variety */
  .sparkle__particle:nth-child(2n) {
    background-color: var(--color-reward-glow);
    width: 8px;
    height: 8px;
  }

  .sparkle__particle:nth-child(3n) {
    background-color: var(--color-primary);
    width: 6px;
    height: 6px;
  }

  @keyframes sparkle-burst {
    0% {
      opacity: 1;
      transform: translate(-50%, -50%) scale(0)
        rotate(calc(var(--particle-index, 0) * 45deg))
        translateY(0);
    }
    50% {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1.2)
        rotate(calc(var(--particle-index, 0) * 45deg))
        translateY(-40px);
    }
    100% {
      opacity: 0;
      transform: translate(-50%, -50%) scale(0.6)
        rotate(calc(var(--particle-index, 0) * 45deg))
        translateY(-70px);
    }
  }

  /* Kill animation entirely when reduced motion */
  @media (prefers-reduced-motion: reduce) {
    .sparkle__particle {
      animation: none;
      display: none;
    }
  }
`;
