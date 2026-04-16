export interface IconStarProps {
  /** Icon size in pixels (default 24) */
  size?: number;
  /** Whether the star is filled (default false) */
  filled?: boolean;
  /** Color (default currentColor, or reward yellow when filled) */
  color?: string;
}

/**
 * IconStar — classic five-point star for completed markers and rewards.
 *
 * When `filled`, renders as a solid star (good for earned/unlocked);
 * otherwise an outlined star (good for potential / placeholder).
 */
export function IconStar({
  size = 24,
  filled = false,
  color,
}: IconStarProps) {
  const resolved = color ?? (filled ? 'var(--color-reward)' : 'currentColor');

  // Five-point star path centered on a 24x24 viewBox.
  const starPath =
    'M12 2.5l2.95 6.2 6.8.78-5.05 4.72 1.36 6.72L12 17.67l-6.06 3.25 1.36-6.72L2.25 9.48l6.8-.78L12 2.5z';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? resolved : 'none'}
      stroke={resolved}
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={starPath} />
    </svg>
  );
}
