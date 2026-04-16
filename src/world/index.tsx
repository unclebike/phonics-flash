import { useEffect, useState } from 'preact/hooks';
import { CONTENT_MANIFEST } from '../content/manifest';
import { createPersistenceAdapter } from '../engine/persistence';
import type { PhonemeProgress, PersistenceAdapter } from '../engine/persistence';
import {
  createUnlockEngine,
  zoneCompletion,
  totalMasteryPoints,
} from './unlock';
import { WorldMap, WorldMapStyles } from './WorldMap';
import type { WorldMapZoneData } from './WorldMap';
import { Avatar, AvatarStyles } from './Avatar';
import './world.css';

// Inject component styles once.
if (typeof document !== 'undefined') {
  const styleId = 'world-module-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = [AvatarStyles, WorldMapStyles].join('\n');
    document.head.appendChild(style);
  }
}

export interface WorldRouteProps {
  onNavigate?: (hash: string) => void;
  /** Override for tests. */
  persistence?: PersistenceAdapter;
}

/**
 * Load progress for every phoneme in the manifest into a single Map.
 * Missing entries are simply absent from the map.
 */
async function loadAllProgress(
  persistence: PersistenceAdapter,
): Promise<Map<string, PhonemeProgress>> {
  const entries = await Promise.all(
    CONTENT_MANIFEST.phonemes.map(async (p) => {
      const prog = await persistence.getProgress(p.id);
      return [p.id, prog] as const;
    }),
  );
  const map = new Map<string, PhonemeProgress>();
  for (const [id, prog] of entries) {
    if (prog) map.set(id, prog);
  }
  return map;
}

export function WorldRoute({ onNavigate, persistence }: WorldRouteProps) {
  const adapter = persistence ?? createPersistenceAdapter();
  const [progress, setProgress] = useState<Map<string, PhonemeProgress> | null>(null);

  // Initial load + re-read on focus/hash changes.
  useEffect(() => {
    let cancelled = false;

    const reload = () => {
      loadAllProgress(adapter).then((p) => {
        if (!cancelled) setProgress(p);
      });
    };

    reload();

    const onFocus = () => reload();
    const onHash = () => {
      if (window.location.hash === '#/world') reload();
    };
    window.addEventListener('focus', onFocus);
    window.addEventListener('hashchange', onHash);

    return () => {
      cancelled = true;
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('hashchange', onHash);
    };
    // adapter is stable (created once); intentional empty deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleZoneSelect = (zoneId: string) => {
    const target = `#/learn/${zoneId}`;
    if (onNavigate) onNavigate(target);
    else window.location.hash = target;
  };

  if (!progress) {
    return (
      <main class="world-route" role="main">
        <p class="world-route__loading">Loading your map...</p>
      </main>
    );
  }

  const engine = createUnlockEngine({ allPhonemes: CONTENT_MANIFEST.phonemes });
  const zoneData: WorldMapZoneData[] = CONTENT_MANIFEST.zones.map((zone) => ({
    zone,
    status: engine.getZoneStatus(zone, progress),
    completion: zoneCompletion(zone, progress, CONTENT_MANIFEST.phonemes),
  }));

  const masteryPoints = totalMasteryPoints(progress);

  return (
    <main class="world-route" role="main">
      <header class="world-route__header">
        <h1 class="world-route__title">The Map</h1>
        <div class="world-route__avatar-badge">
          <Avatar masteryPoints={masteryPoints} size="sm" animate={true} />
          <span class="world-route__mastery">
            {masteryPoints} mastery point{masteryPoints === 1 ? '' : 's'}
          </span>
        </div>
      </header>
      <p class="world-route__hint">
        Tap a glowing place to begin. Keep going to grow your companion.
      </p>
      <WorldMap
        zones={zoneData}
        masteryPoints={masteryPoints}
        onZoneSelect={handleZoneSelect}
      />
    </main>
  );
}
