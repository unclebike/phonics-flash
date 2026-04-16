import { useMemo } from 'preact/hooks';
import { CONTENT_MANIFEST } from '../../content/manifest';
import { createPersistenceAdapter } from '../../engine/persistence';
import { BeatSession } from './BeatSession';

export interface BossLevelProps {
  zoneId: string;
  onBack?: () => void;
}

const persistence = createPersistenceAdapter();

/**
 * BossLevel — thin wrapper around BeatSession for a specific zone.
 *
 * Looks up the zone in the manifest, selects its phonemes, and feeds
 * the bossConfig into BeatSession. On pass, unlocks the next zone in
 * manifest order.
 */
export function BossLevel({ zoneId, onBack }: BossLevelProps) {
  const { zone, items, nextZoneId } = useMemo(() => {
    const idx = CONTENT_MANIFEST.zones.findIndex((z) => z.id === zoneId);
    const zone = idx >= 0 ? CONTENT_MANIFEST.zones[idx] : null;
    const items = zone
      ? CONTENT_MANIFEST.phonemes.filter((p) => zone.phonemeSets.includes(p.set))
      : [];
    const nextZone =
      idx >= 0 && idx + 1 < CONTENT_MANIFEST.zones.length
        ? CONTENT_MANIFEST.zones[idx + 1]
        : null;
    return { zone, items, nextZoneId: nextZone?.id ?? null };
  }, [zoneId]);

  if (!zone) {
    return (
      <div class="beat-session" role="main">
        <div class="beat-overlay">
          <h1 class="beat-overlay__title">Zone not found</h1>
          <p class="beat-overlay__body">We couldn't find that zone.</p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div class="beat-session" role="main">
        <div class="beat-overlay">
          <h1 class="beat-overlay__title">No sounds yet</h1>
          <p class="beat-overlay__body">This zone has no phonemes configured.</p>
        </div>
      </div>
    );
  }

  return (
    <BeatSession
      items={items}
      tempo={zone.bossConfig.tempo}
      length={zone.bossConfig.length}
      requiredScore={zone.bossConfig.requiredScore}
      onBack={onBack}
      onComplete={async ({ passed }) => {
        if (passed && nextZoneId) {
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
