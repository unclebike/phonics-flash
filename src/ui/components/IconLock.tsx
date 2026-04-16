export interface IconLockProps {
  /** Icon size in pixels (default 24) */
  size?: number;
  /** Stroke / fill color (default currentColor) */
  color?: string;
}

/**
 * IconLock — rounded, friendly lock icon for locked zones.
 *
 * Deliberately soft and child-friendly: generous corner radii, thick
 * rounded strokes, no sharp padlock shackle. Decorative by default
 * (aria-hidden); the parent should provide accessible text.
 */
export function IconLock({ size = 24, color = 'currentColor' }: IconLockProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      stroke-width="2.25"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {/* Shackle — rounded arch */}
      <path d="M7.5 10.5V7.5a4.5 4.5 0 0 1 9 0v3" />
      {/* Body — rounded rectangle */}
      <rect
        x="4.5"
        y="10.5"
        width="15"
        height="10.5"
        rx="3"
        ry="3"
        fill={color}
        fill-opacity="0.15"
      />
      {/* Keyhole — small circle + short drop */}
      <circle cx="12" cy="15" r="1.25" fill={color} stroke="none" />
      <path d="M12 16.25V17.5" />
    </svg>
  );
}
