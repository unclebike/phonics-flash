import { useRef } from 'preact/hooks';
import type { ZoneConfig } from '../content/types';
import type { ZoneStatus } from './unlock';
import { Avatar } from './Avatar';

/* ------------------------------------------------------------------ */
/* Layout                                                             */
/* ------------------------------------------------------------------ */

/**
 * Hand-placed zone positions on a 100x60 viewBox. These are deliberately
 * organic — not on a grid, not in a line — so the map feels like a region
 * rather than a progress bar.
 */
interface ZonePlacement {
  id: string;
  /** center x on the 100-unit canvas */
  cx: number;
  /** center y on the 60-unit canvas */
  cy: number;
  /** approximate radius for hit area */
  r: number;
  /** rendering kind, controls the biome SVG */
  kind: 'meadow' | 'woods' | 'shore' | 'peaks' | 'cavern' | 'forge' | 'summit';
}

const PLACEMENTS: ZonePlacement[] = [
  { id: 'whispering-meadows', cx: 14, cy: 44, r: 9, kind: 'meadow' },
  { id: 'rumble-woods',       cx: 32, cy: 28, r: 9, kind: 'woods'  },
  { id: 'echo-shores',        cx: 52, cy: 46, r: 9, kind: 'shore'  },
  { id: 'cloud-peaks',        cx: 66, cy: 20, r: 9, kind: 'peaks'  },
  { id: 'frost-cavern',       cx: 80, cy: 38, r: 9, kind: 'cavern' },
  { id: 'lava-forge',         cx: 90, cy: 20, r: 8, kind: 'forge'  },
  { id: 'star-summit',        cx: 92, cy: 52, r: 8, kind: 'summit' },
];

/**
 * Path segments connecting zones in manifest order. Drawn as a hand-drawn
 * route so players sense where to go next. Not a linear track — curves.
 */
const PATH_D =
  'M 14 44 Q 22 36 32 28 Q 42 34 52 46 Q 58 32 66 20 Q 74 26 80 38 Q 84 28 90 20 Q 91 36 92 52';

/* ------------------------------------------------------------------ */
/* Props                                                              */
/* ------------------------------------------------------------------ */

export interface WorldMapZoneData {
  zone: ZoneConfig;
  status: ZoneStatus;
  /** 0..1 — fraction of zone phonemes mastered. */
  completion: number;
}

export interface WorldMapProps {
  zones: WorldMapZoneData[];
  /** Total mastery points — drives avatar rendering. */
  masteryPoints: number;
  onZoneSelect: (zoneId: string) => void;
}

/* ------------------------------------------------------------------ */
/* Biome glyphs                                                       */
/* ------------------------------------------------------------------ */

function BiomeGlyph({
  kind,
  cx,
  cy,
  locked,
}: {
  kind: ZonePlacement['kind'];
  cx: number;
  cy: number;
  locked: boolean;
}) {
  const dim = locked ? 0.35 : 1;
  const style = { opacity: dim };

  switch (kind) {
    case 'meadow':
      return (
        <g style={style}>
          {/* gentle grass tufts */}
          <ellipse cx={cx} cy={cy + 1} rx="8" ry="4.5" fill="#8BC186" />
          <ellipse cx={cx - 2} cy={cy - 1} rx="4" ry="2" fill="#6FAE6A" />
          <path d={`M ${cx - 4} ${cy + 2} l 1 -3 M ${cx} ${cy + 2} l 0 -3 M ${cx + 4} ${cy + 2} l -1 -3`}
            stroke="#4A7C47" stroke-width="0.5" fill="none" stroke-linecap="round" />
        </g>
      );
    case 'woods':
      return (
        <g style={style}>
          <ellipse cx={cx} cy={cy + 2} rx="8" ry="3" fill="#3F6B3A" />
          {/* pine trees */}
          <polygon points={`${cx - 4},${cy + 1} ${cx - 6},${cy + 3} ${cx - 2},${cy + 3}`} fill="#2F5A2B" />
          <polygon points={`${cx - 4},${cy - 2} ${cx - 6.5},${cy + 1} ${cx - 1.5},${cy + 1}`} fill="#3C7038" />
          <polygon points={`${cx + 2},${cy + 0} ${cx - 0.5},${cy + 3} ${cx + 4.5},${cy + 3}`} fill="#2F5A2B" />
          <polygon points={`${cx + 2},${cy - 3} ${cx - 1},${cy}    ${cx + 5},${cy}`}    fill="#3C7038" />
          <polygon points={`${cx + 5},${cy}    ${cx + 2.5},${cy + 3} ${cx + 7.5},${cy + 3}`} fill="#2F5A2B" />
        </g>
      );
    case 'shore':
      return (
        <g style={style}>
          {/* sandy crescent */}
          <ellipse cx={cx} cy={cy + 2} rx="8" ry="3" fill="#E8D3A0" />
          {/* water */}
          <path d={`M ${cx - 8} ${cy + 1} Q ${cx - 4} ${cy - 2} ${cx} ${cy + 1} Q ${cx + 4} ${cy - 2} ${cx + 8} ${cy + 1}`}
            stroke="#3A8BC7" stroke-width="0.8" fill="none" />
          <path d={`M ${cx - 6} ${cy - 0.5} Q ${cx - 3} ${cy - 2.5} ${cx} ${cy - 0.5} Q ${cx + 3} ${cy - 2.5} ${cx + 6} ${cy - 0.5}`}
            stroke="#5AA5DE" stroke-width="0.6" fill="none" />
        </g>
      );
    case 'peaks':
      return (
        <g style={style}>
          <polygon points={`${cx - 6},${cy + 3} ${cx - 2},${cy - 3} ${cx + 2},${cy + 3}`} fill="#8FA5B5" />
          <polygon points={`${cx - 1},${cy + 3} ${cx + 3},${cy - 4} ${cx + 7},${cy + 3}`} fill="#7389A0" />
          {/* snow caps */}
          <polygon points={`${cx - 2},${cy - 3} ${cx - 3.2},${cy - 1} ${cx - 0.8},${cy - 1}`} fill="#F2F6FA" />
          <polygon points={`${cx + 3},${cy - 4} ${cx + 1.6},${cy - 2} ${cx + 4.4},${cy - 2}`} fill="#F2F6FA" />
        </g>
      );
    case 'cavern':
      return (
        <g style={style}>
          <path d={`M ${cx - 6} ${cy + 3} Q ${cx - 6} ${cy - 3} ${cx} ${cy - 4} Q ${cx + 6} ${cy - 3} ${cx + 6} ${cy + 3} Z`}
            fill="#6E7A86" />
          <path d={`M ${cx - 3} ${cy + 3} Q ${cx - 3} ${cy} ${cx} ${cy - 1} Q ${cx + 3} ${cy} ${cx + 3} ${cy + 3} Z`}
            fill="#2F3744" />
          {/* icicles */}
          <polygon points={`${cx - 1.5},${cy + 3} ${cx - 0.8},${cy + 5} ${cx - 0.2},${cy + 3}`} fill="#C7E5F2" />
          <polygon points={`${cx + 1},${cy + 3} ${cx + 1.6},${cy + 4.5} ${cx + 2.2},${cy + 3}`} fill="#C7E5F2" />
        </g>
      );
    case 'forge':
      return (
        <g style={style}>
          <ellipse cx={cx} cy={cy + 2} rx="7" ry="2.5" fill="#3A2620" />
          {/* lava pool */}
          <ellipse cx={cx} cy={cy + 1} rx="4" ry="1.5" fill="#E8542B" />
          <ellipse cx={cx - 0.5} cy={cy + 0.8} rx="2" ry="0.7" fill="#F5A042" />
          {/* ember */}
          <circle cx={cx + 1} cy={cy - 1} r="0.6" fill="#F5C842" />
          <circle cx={cx - 2} cy={cy - 2} r="0.5" fill="#E8A817" />
        </g>
      );
    case 'summit':
      return (
        <g style={style}>
          <polygon points={`${cx - 5},${cy + 3} ${cx},${cy - 5} ${cx + 5},${cy + 3}`} fill="#4A5A7A" />
          <polygon points={`${cx - 1.5},${cy - 2.2} ${cx},${cy - 5} ${cx + 1.5},${cy - 2.2}`} fill="#F2F6FA" />
          {/* star */}
          <path
            d={`M ${cx} ${cy - 6} l 0.5 1.3 l 1.4 0.1 l -1.1 0.9 l 0.4 1.3 l -1.2 -0.8 l -1.2 0.8 l 0.4 -1.3 l -1.1 -0.9 l 1.4 -0.1 Z`}
            fill="#F5C842"
          />
        </g>
      );
  }
}

/* ------------------------------------------------------------------ */
/* Zone node                                                          */
/* ------------------------------------------------------------------ */

function ZoneNode({
  zone,
  placement,
  status,
  completion,
  onSelect,
}: {
  zone: ZoneConfig;
  placement: ZonePlacement;
  status: ZoneStatus;
  completion: number;
  onSelect: (id: string) => void;
}) {
  const { cx, cy, r, kind } = placement;
  const locked = status === 'locked';
  const interactive = !locked;

  const handleActivate = () => {
    if (interactive) onSelect(zone.id);
  };

  const handleKey = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleActivate();
    }
  };

  // Progress ring for in-progress zones: arc length = completion fraction.
  const ringR = r + 1.4;
  const circ = 2 * Math.PI * ringR;
  const dash = Math.max(0.001, completion) * circ;

  const statusLabel =
    status === 'locked'     ? 'locked' :
    status === 'available'  ? 'available' :
    status === 'in-progress'? 'in progress' :
                              'completed';

  return (
    <g
      class={`world-zone world-zone--${status} world-zone--${kind}`}
      role="button"
      tabIndex={interactive ? 0 : -1}
      aria-label={`Zone: ${zone.name}, status: ${statusLabel}. ${zone.description}`}
      aria-disabled={locked ? 'true' : 'false'}
      onClick={handleActivate}
      onKeyDown={handleKey}
    >
      {/* outer halo (available + in-progress) */}
      {(status === 'available' || status === 'in-progress') && (
        <circle
          cx={cx}
          cy={cy}
          r={r + 2.4}
          class="world-zone__halo"
          fill="none"
          stroke="var(--color-reward-glow, #F5C842)"
          stroke-width="0.6"
          opacity="0.45"
        />
      )}

      {/* land disc */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        class="world-zone__disc"
        fill={locked ? '#BFC3C8' : '#EFE4C8'}
        stroke={locked ? '#8C9096' : '#8A6E3F'}
        stroke-width="0.7"
      />

      {/* biome glyph */}
      <BiomeGlyph kind={kind} cx={cx} cy={cy} locked={locked} />

      {/* progress ring (in-progress only) */}
      {status === 'in-progress' && (
        <circle
          cx={cx}
          cy={cy}
          r={ringR}
          fill="none"
          stroke="var(--color-primary, #D95A2B)"
          stroke-width="1"
          stroke-linecap="round"
          stroke-dasharray={`${dash} ${circ}`}
          transform={`rotate(-90 ${cx} ${cy})`}
        />
      )}

      {/* completed star */}
      {status === 'completed' && (
        <path
          transform={`translate(${cx + r - 1.5} ${cy - r + 1.5}) scale(0.14)`}
          d="M20 2 l 5 12 l 13 1 l -10 8 l 4 13 l -12 -7 l -12 7 l 4 -13 l -10 -8 l 13 -1 Z"
          fill="var(--color-reward, #E8A817)"
          stroke="var(--color-reward-glow, #F5C842)"
          stroke-width="1"
        />
      )}

      {/* padlock for locked */}
      {locked && (
        <g transform={`translate(${cx - 2} ${cy - 2.5})`} opacity="0.8">
          <rect x="0" y="2" width="4" height="3.2" rx="0.5" fill="#4A4A4A" />
          <path d="M 0.7 2 v -0.8 a 1.3 1.3 0 0 1 2.6 0 v 0.8" fill="none" stroke="#4A4A4A" stroke-width="0.5" />
        </g>
      )}

      {/* zone name label below the disc */}
      <text
        x={cx}
        y={cy + r + 3.2}
        text-anchor="middle"
        class="world-zone__label"
        font-size="2.6"
        fill="var(--color-text, #1A1A1A)"
      >
        {zone.name}
      </text>
    </g>
  );
}

/* ------------------------------------------------------------------ */
/* Main map                                                           */
/* ------------------------------------------------------------------ */

export function WorldMap({ zones, masteryPoints, onZoneSelect }: WorldMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  // Build a lookup for rendering in PLACEMENTS order (stable visual order).
  const byId = new Map(zones.map((z) => [z.zone.id, z]));

  // Avatar "current location": last in-progress zone, else furthest available.
  const avatarPlacement = (() => {
    const ordered = PLACEMENTS.map((p) => byId.get(p.id)).filter(Boolean) as WorldMapZoneData[];
    const inProgress = ordered.filter((z) => z.status === 'in-progress');
    if (inProgress.length > 0) {
      const last = inProgress[inProgress.length - 1];
      return PLACEMENTS.find((p) => p.id === last.zone.id);
    }
    const available = ordered.filter((z) => z.status === 'available');
    if (available.length > 0) {
      return PLACEMENTS.find((p) => p.id === available[0].zone.id);
    }
    const completed = ordered.filter((z) => z.status === 'completed');
    if (completed.length > 0) {
      const last = completed[completed.length - 1];
      return PLACEMENTS.find((p) => p.id === last.zone.id);
    }
    return PLACEMENTS[0];
  })();

  return (
    <div class="world-map-wrap">
      <svg
        ref={svgRef}
        class="world-map"
        viewBox="0 0 100 60"
        role="navigation"
        aria-label="World map. Use Tab to move between zones, Enter to enter a zone."
        preserveAspectRatio="xMidYMid meet"
      >
        {/* backdrop — soft parchment tone */}
        <defs>
          <radialGradient id="wm-bg" cx="50%" cy="45%" r="75%">
            <stop offset="0%" stop-color="#FAF3E0" />
            <stop offset="100%" stop-color="#E8DCC0" />
          </radialGradient>
          <pattern id="wm-grain" width="6" height="6" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="0.3" fill="#C9B98B" opacity="0.25" />
            <circle cx="4" cy="3" r="0.25" fill="#C9B98B" opacity="0.2" />
          </pattern>
        </defs>
        <rect x="0" y="0" width="100" height="60" fill="url(#wm-bg)" />
        <rect x="0" y="0" width="100" height="60" fill="url(#wm-grain)" />

        {/* decorative coastline wash */}
        <path
          d="M 0 52 Q 20 58 44 54 Q 64 50 100 56 L 100 60 L 0 60 Z"
          fill="#CDE3F0"
          opacity="0.5"
        />

        {/* route path between zones */}
        <path
          d={PATH_D}
          fill="none"
          stroke="#8A6E3F"
          stroke-width="0.6"
          stroke-dasharray="1.2 1.2"
          stroke-linecap="round"
          opacity="0.7"
        />

        {/* zones */}
        {PLACEMENTS.map((p) => {
          const data = byId.get(p.id);
          if (!data) return null;
          return (
            <ZoneNode
              key={p.id}
              zone={data.zone}
              placement={p}
              status={data.status}
              completion={data.completion}
              onSelect={onZoneSelect}
            />
          );
        })}

      </svg>
      {/* Avatar overlay — HTML layered on top of the SVG so the component
          keeps a single root <svg>. Positioned via % matching the viewBox. */}
      {avatarPlacement && (
        <div
          class="world-map__avatar"
          aria-hidden="true"
          style={{
            left: `${avatarPlacement.cx}%`,
            top: `${((avatarPlacement.cy - avatarPlacement.r - 6) / 60) * 100}%`,
          }}
        >
          <Avatar masteryPoints={masteryPoints} size="sm" animate={true} />
        </div>
      )}
    </div>
  );
}

export const WorldMapStyles = `
.world-map-wrap {
  position: relative;
  width: 100%;
  max-width: 1100px;
  margin: 0 auto;
  padding: var(--space-5);
}
.world-map__avatar {
  position: absolute;
  transform: translate(-50%, -50%);
  pointer-events: none;
  filter: drop-shadow(0 2px 3px rgba(0,0,0,0.2));
}
.world-map {
  width: 100%;
  height: auto;
  display: block;
  border-radius: var(--radius-xl);
  background: var(--color-surface);
  box-shadow: var(--shadow-md);
}
.world-zone {
  cursor: pointer;
  outline: none;
  transition: transform var(--duration-normal) var(--ease-out);
}
.world-zone--locked {
  cursor: not-allowed;
}
.world-zone__label {
  font-family: var(--font-active);
  font-weight: var(--weight-semibold);
  letter-spacing: var(--tracking-normal);
  pointer-events: none;
  user-select: none;
}
.world-zone:focus-visible {
  outline: none;
}
.world-zone:focus-visible .world-zone__disc {
  stroke: var(--color-focus);
  stroke-width: 1.8;
  filter: drop-shadow(0 0 2px var(--color-focus));
}
.world-zone--available:hover,
.world-zone--in-progress:hover,
.world-zone--completed:hover {
  transform: translateY(-1px);
}
.world-zone--available .world-zone__halo {
  animation: world-zone-pulse 2.4s ease-in-out infinite;
}
@keyframes world-zone-pulse {
  0%, 100% { opacity: 0.25; transform: scale(1); transform-origin: center; }
  50%      { opacity: 0.6;  transform: scale(1.02); }
}
/* larger invisible hit target for touch — 44px minimum */
.world-zone::before {
  content: '';
}
@media (prefers-reduced-motion: reduce) {
  .world-zone,
  .world-zone--available .world-zone__halo {
    animation: none;
    transition: none;
  }
}
`;
