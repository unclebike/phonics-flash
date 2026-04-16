import { CONTENT_MANIFEST } from '../content/manifest';

export interface AvatarProps {
  masteryPoints: number;
  size?: 'sm' | 'md' | 'lg';
  animate?: boolean;
  /** Optional aria-label override. */
  label?: string;
}

const SIZE_PX: Record<NonNullable<AvatarProps['size']>, number> = {
  sm: 48,
  md: 96,
  lg: 160,
};

/**
 * Determine tier index (0-indexed) for the given mastery points.
 * Tier thresholds come from CONTENT_MANIFEST.avatar.tiers.
 */
export function tierFor(masteryPoints: number): number {
  const tiers = CONTENT_MANIFEST.avatar.tiers;
  let idx = 0;
  for (let i = 0; i < tiers.length; i++) {
    if (masteryPoints >= tiers[i].threshold) idx = i;
  }
  return idx;
}

/**
 * Avatar — a small sprout-creature that grows leaves as mastery increases.
 *
 * Tier 0: a single round seedling with a sprout.
 * Tier 1: adds side leaves + a bud.
 * Tier 2: adds a small flower-crown and sparkle.
 *
 * Pure inline SVG — no external assets. Palette pulled from design tokens.
 */
export function Avatar({
  masteryPoints,
  size = 'md',
  animate = true,
  label,
}: AvatarProps) {
  const tier = tierFor(masteryPoints);
  const px = SIZE_PX[size];

  const ariaLabel =
    label ?? `Avatar at tier ${tier + 1} of ${CONTENT_MANIFEST.avatar.tiers.length}`;

  return (
    <svg
      class={`avatar avatar--size-${size} avatar--tier-${tier}${animate ? ' avatar--animate' : ''}`}
      width={px}
      height={px}
      viewBox="0 0 100 100"
      role="img"
      aria-label={ariaLabel}
      data-tier={tier}
    >
      {/* Soft ground shadow */}
      <ellipse cx="50" cy="88" rx="26" ry="4" fill="rgba(0,0,0,0.08)" />

      {/* Body — round seedling */}
      <g class="avatar__body">
        <circle
          cx="50"
          cy="62"
          r="22"
          fill="var(--color-success, #2D8659)"
          stroke="var(--color-success-active, #1C5D3D)"
          stroke-width="2"
        />
        {/* belly highlight */}
        <ellipse cx="44" cy="58" rx="7" ry="5" fill="rgba(255,255,255,0.18)" />
      </g>

      {/* Eyes */}
      <g class="avatar__face">
        <circle cx="42" cy="60" r="2.6" fill="#1A1A1A" />
        <circle cx="58" cy="60" r="2.6" fill="#1A1A1A" />
        {/* gentle smile */}
        <path
          d="M44 69 Q50 73 56 69"
          fill="none"
          stroke="#1A1A1A"
          stroke-width="1.8"
          stroke-linecap="round"
        />
      </g>

      {/* Central sprout — always present */}
      <g class="avatar__sprout">
        <path
          d="M50 40 Q50 28 50 22"
          stroke="var(--color-success-active, #1C5D3D)"
          stroke-width="2.5"
          fill="none"
          stroke-linecap="round"
        />
        <path
          d="M50 26 Q56 20 60 22 Q56 26 50 28 Z"
          fill="var(--color-success, #2D8659)"
        />
      </g>

      {/* Tier 1+: side leaves + bud */}
      {tier >= 1 && (
        <g class="avatar__leaves">
          <path
            d="M28 62 Q18 58 16 50 Q24 52 30 58 Z"
            fill="var(--color-success, #2D8659)"
            stroke="var(--color-success-active, #1C5D3D)"
            stroke-width="1.5"
          />
          <path
            d="M72 62 Q82 58 84 50 Q76 52 70 58 Z"
            fill="var(--color-success, #2D8659)"
            stroke="var(--color-success-active, #1C5D3D)"
            stroke-width="1.5"
          />
          {/* bud on main sprout */}
          <circle
            cx="50"
            cy="20"
            r="3.5"
            fill="var(--color-reward, #E8A817)"
          />
        </g>
      )}

      {/* Tier 2: flower crown + sparkle */}
      {tier >= 2 && (
        <g class="avatar__crown">
          {/* petals around the bud */}
          <circle cx="50" cy="14" r="3" fill="var(--color-reward-glow, #F5C842)" />
          <circle cx="44" cy="18" r="2.6" fill="var(--color-reward-glow, #F5C842)" />
          <circle cx="56" cy="18" r="2.6" fill="var(--color-reward-glow, #F5C842)" />
          <circle cx="50" cy="20" r="2" fill="var(--color-reward, #E8A817)" />
          {/* sparkle */}
          <path
            class="avatar__sparkle"
            d="M80 30 L82 34 L86 36 L82 38 L80 42 L78 38 L74 36 L78 34 Z"
            fill="var(--color-reward-glow, #F5C842)"
          />
          {/* secondary leaves */}
          <path
            d="M22 72 Q14 74 12 68 Q18 66 24 68 Z"
            fill="var(--color-success-hover, #24714A)"
          />
          <path
            d="M78 72 Q86 74 88 68 Q82 66 76 68 Z"
            fill="var(--color-success-hover, #24714A)"
          />
        </g>
      )}
    </svg>
  );
}

export const AvatarStyles = `
.avatar {
  display: block;
  overflow: visible;
}
.avatar__body,
.avatar__sprout,
.avatar__leaves,
.avatar__crown {
  transform-origin: 50px 62px;
}
.avatar--animate .avatar__body {
  animation: avatar-breathe 3.2s ease-in-out infinite;
}
.avatar--animate .avatar__sprout {
  animation: avatar-sway 4s ease-in-out infinite;
  transform-origin: 50px 40px;
}
.avatar--animate .avatar__sparkle {
  transform-origin: 80px 36px;
  animation: avatar-sparkle 2.4s ease-in-out infinite;
}
@keyframes avatar-breathe {
  0%, 100% { transform: scale(1); }
  50%      { transform: scale(1.03); }
}
@keyframes avatar-sway {
  0%, 100% { transform: rotate(-2deg); }
  50%      { transform: rotate(2deg); }
}
@keyframes avatar-sparkle {
  0%, 100% { transform: scale(0.6); opacity: 0.5; }
  50%      { transform: scale(1.2); opacity: 1; }
}
@media (prefers-reduced-motion: reduce) {
  .avatar--animate .avatar__body,
  .avatar--animate .avatar__sprout,
  .avatar--animate .avatar__sparkle {
    animation: none;
  }
}
`;
