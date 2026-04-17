import { useMemo } from 'preact/hooks';
import { CONTENT_MANIFEST } from '../../content/manifest';
import { PHONICS_DATA } from '../../content/phonics';
import { createPersistenceAdapter } from '../../engine/persistence';
import { BossSession } from './BossSession';

export interface BossLevelProps {
  zoneId: string;
  onBack?: () => void;
}

const persistence = createPersistenceAdapter();

/**
 * BossLevel — zone-specific wrapper around the flash-and-mask Boss
 * gauntlet. Under ADR-010, this replaces the old BPM/rhythm-based
 * BeatSession. On pass, unlocks the next zone in manifest order.
 */
export function BossLevel({ zoneId, onBack }: BossLevelProps) {
  const { zone, items, nextZoneId } = useMemo(() => {
    const idx = CONTENT_MANIFEST.zones.findIndex((z) => z.id === zoneId);
    const zone = idx >= 0 ? CONTENT_MANIFEST.zones[idx] : null;
    const items = zone
      ? PHONICS_DATA
          .filter((p) => zone.phonemeSets.includes(p.set))
          .map((p) => p.grapheme)
      : [];
    const nextZone =
      idx >= 0 && idx + 1 < CONTENT_MANIFEST.zones.length
        ? CONTENT_MANIFEST.zones[idx + 1]
        : null;
    return { zone, items, nextZoneId: nextZone?.id ?? null };
  }, [zoneId]);

  const exit = () => {
    if (onBack) onBack(); else window.location.hash = '#/world';
  };

  if (!zone) {
    return (
      <main class="drill drill--masked" role="main">
        <div class="boss-judge">
          <h1 class="boss-judge__title">Zone not found</h1>
          <p class="boss-judge__body">We couldn't find that zone.</p>
        </div>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main class="drill drill--masked" role="main">
        <div class="boss-judge">
          <h1 class="boss-judge__title">No sounds yet</h1>
          <p class="boss-judge__body">This zone has no phonemes configured.</p>
        </div>
      </main>
    );
  }

  return (
    <BossSession
      zoneName={zone.name}
      items={items}
      tempo={zone.bossConfig.tempo}
      onBack={exit}
      onPass={async () => {
        if (nextZoneId) {
          try {
            await persistence.unlockZone(nextZoneId);
          } catch {
            // Non-fatal — persistence is best-effort in V1.
          }
        }
      }}
    />
  );
}
