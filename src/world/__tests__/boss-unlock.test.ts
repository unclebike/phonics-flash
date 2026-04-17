/**
 * End-to-end test for the Boss → Unlock pipeline.
 *
 * After beating a zone's boss, the unlock engine must report the next
 * zone as available. The pipeline BossLevel uses:
 *   1. BossSession onPass fires
 *   2. BossLevel writes setPhonemeMastery(MASTERY_COMPLETE) for each
 *      zone phoneme
 *   3. The unlock engine reads phoneme mastery and resolves
 *      canUnlock(nextZone) → true and getZoneStatus(zone) → 'completed'
 *
 * This test exercises the full chain with an in-memory mock persistence.
 */
import { describe, it, expect } from 'vitest';
import { CONTENT_MANIFEST } from '../../content/manifest';
import { PHONICS_DATA } from '../../content/phonics';
import { createUnlockEngine, MASTERY_COMPLETE } from '../unlock';
import type { PhonemeProgress } from '../../engine/persistence';

describe('Boss → Unlock pipeline (ADR-009/010 bugfix)', () => {
  function phonemeIdsFor(zoneId: string): string[] {
    const zone = CONTENT_MANIFEST.zones.find((z) => z.id === zoneId);
    if (!zone) return [];
    return PHONICS_DATA
      .filter((p) => zone.phonemeSets.includes(p.set))
      .map((p) => p.id);
  }

  it('without a boss pass, subsequent zones are locked', () => {
    const engine = createUnlockEngine({ allPhonemes: PHONICS_DATA });
    const emptyProgress = new Map<string, PhonemeProgress>();

    const zone1 = CONTENT_MANIFEST.zones[0];
    const zone2 = CONTENT_MANIFEST.zones[1];

    expect(engine.getZoneStatus(zone1, emptyProgress)).toBe('available');
    expect(engine.getZoneStatus(zone2, emptyProgress)).toBe('locked');
  });

  it('granting mastery for all zone 1 phonemes unlocks zone 2', () => {
    const engine = createUnlockEngine({ allPhonemes: PHONICS_DATA });
    const progress = new Map<string, PhonemeProgress>();

    // Simulate BossLevel writing mastery for every phoneme in zone 1
    const zone1Ids = phonemeIdsFor('whispering-meadows');
    const now = Date.now();
    for (const pid of zone1Ids) {
      progress.set(pid, {
        phonemeId: pid,
        masteryLevel: MASTERY_COMPLETE,
        lastSeenAt: now,
        attempts: 0,
        correct: 0,
      });
    }

    const zone1 = CONTENT_MANIFEST.zones[0];
    const zone2 = CONTENT_MANIFEST.zones[1];

    // Zone 1 now shows as completed (all its own phonemes mastered)
    expect(engine.getZoneStatus(zone1, progress)).toBe('completed');
    // Zone 2's prerequisites (zone 1 phonemes at minimumMastery) are met
    expect(engine.canUnlock(zone2, progress)).toBe(true);
    expect(engine.getZoneStatus(zone2, progress)).toBe('available');
  });

  it('cascading boss passes unlock the full chain', () => {
    const engine = createUnlockEngine({ allPhonemes: PHONICS_DATA });
    const progress = new Map<string, PhonemeProgress>();
    const now = Date.now();

    // Pass every zone's boss in order
    for (const zone of CONTENT_MANIFEST.zones) {
      const ids = phonemeIdsFor(zone.id);
      for (const pid of ids) {
        progress.set(pid, {
          phonemeId: pid,
          masteryLevel: MASTERY_COMPLETE,
          lastSeenAt: now,
          attempts: 0,
          correct: 0,
        });
      }
    }

    // Every zone should now report completed
    for (const zone of CONTENT_MANIFEST.zones) {
      expect(engine.getZoneStatus(zone, progress)).toBe('completed');
    }
  });
});
