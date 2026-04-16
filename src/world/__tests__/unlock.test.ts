import { describe, it, expect } from 'vitest';
import {
  createUnlockEngine,
  zoneCompletion,
  totalMasteryPoints,
  MASTERY_COMPLETE,
} from '../unlock';
import type { ZoneConfig } from '../../content/types';
import type { PhonemeProgress } from '../../engine/persistence';

// Minimal fixture: three "phonemes" split across two sets.
const PHONEMES = [
  { id: 'a', set: 1 },
  { id: 'b', set: 1 },
  { id: 'c', set: 2 },
] as const;

function mkProgress(
  overrides: Record<string, Partial<PhonemeProgress>> = {},
): Map<string, PhonemeProgress> {
  const map = new Map<string, PhonemeProgress>();
  for (const [id, patch] of Object.entries(overrides)) {
    map.set(id, {
      phonemeId: id,
      masteryLevel: 0,
      lastSeenAt: 0,
      attempts: 0,
      correct: 0,
      ...patch,
    });
  }
  return map;
}

const zoneA: ZoneConfig = {
  id: 'zone-a',
  name: 'Zone A',
  description: '',
  phonemeSets: [1],
  unlockRequirement: { type: 'mastery', phonemeIds: [], minimumMastery: 0 },
  bossConfig: { tempo: 'slow', length: 10, requiredScore: 7 },
};

const zoneB: ZoneConfig = {
  id: 'zone-b',
  name: 'Zone B',
  description: '',
  phonemeSets: [2],
  unlockRequirement: { type: 'mastery', phonemeIds: ['a', 'b'], minimumMastery: 2 },
  bossConfig: { tempo: 'slow', length: 10, requiredScore: 7 },
};

describe('createUnlockEngine', () => {
  const engine = createUnlockEngine({ allPhonemes: PHONEMES });

  describe('canUnlock', () => {
    it('returns true when requirements are empty', () => {
      expect(engine.canUnlock(zoneA, mkProgress())).toBe(true);
    });

    it('returns false when prereqs are unmet', () => {
      expect(engine.canUnlock(zoneB, mkProgress())).toBe(false);
    });

    it('returns false if only some prereqs are met', () => {
      const progress = mkProgress({ a: { masteryLevel: 3 } });
      expect(engine.canUnlock(zoneB, progress)).toBe(false);
    });

    it('returns true when all prereqs meet the minimum mastery', () => {
      const progress = mkProgress({
        a: { masteryLevel: 2 },
        b: { masteryLevel: 4 },
      });
      expect(engine.canUnlock(zoneB, progress)).toBe(true);
    });
  });

  describe('getZoneStatus', () => {
    it('locked when prereqs unmet', () => {
      expect(engine.getZoneStatus(zoneB, mkProgress())).toBe('locked');
    });

    it('available when unlockable but no zone progress yet', () => {
      expect(engine.getZoneStatus(zoneA, mkProgress())).toBe('available');
    });

    it('available when unlocked but attempts on zone phonemes are zero', () => {
      const progress = mkProgress({
        a: { masteryLevel: 2, attempts: 0 },
        b: { masteryLevel: 4, attempts: 0 },
      });
      expect(engine.getZoneStatus(zoneB, progress)).toBe('available');
    });

    it('in-progress when attempts exist but not all mastered', () => {
      const progress = mkProgress({
        a: { masteryLevel: 1, attempts: 2, correct: 1 },
        b: { masteryLevel: 0, attempts: 0 },
      });
      expect(engine.getZoneStatus(zoneA, progress)).toBe('in-progress');
    });

    it('completed when every zone phoneme is at mastery >= MASTERY_COMPLETE', () => {
      const progress = mkProgress({
        a: { masteryLevel: MASTERY_COMPLETE, attempts: 5, correct: 5 },
        b: { masteryLevel: 5, attempts: 6, correct: 6 },
      });
      expect(engine.getZoneStatus(zoneA, progress)).toBe('completed');
    });

    it('not completed if one phoneme is just below threshold', () => {
      const progress = mkProgress({
        a: { masteryLevel: MASTERY_COMPLETE, attempts: 5, correct: 5 },
        b: { masteryLevel: MASTERY_COMPLETE - 1, attempts: 5, correct: 4 },
      });
      expect(engine.getZoneStatus(zoneA, progress)).toBe('in-progress');
    });
  });
});

describe('zoneCompletion', () => {
  it('returns 0 when nothing is mastered', () => {
    expect(zoneCompletion(zoneA, mkProgress(), PHONEMES)).toBe(0);
  });

  it('returns 0.5 when half the zone is mastered', () => {
    const progress = mkProgress({
      a: { masteryLevel: MASTERY_COMPLETE },
      b: { masteryLevel: 1 },
    });
    expect(zoneCompletion(zoneA, progress, PHONEMES)).toBe(0.5);
  });

  it('returns 1 when fully mastered', () => {
    const progress = mkProgress({
      a: { masteryLevel: 5 },
      b: { masteryLevel: 4 },
    });
    expect(zoneCompletion(zoneA, progress, PHONEMES)).toBe(1);
  });
});

describe('totalMasteryPoints', () => {
  it('sums masteryLevel across all progress entries', () => {
    const progress = mkProgress({
      a: { masteryLevel: 2 },
      b: { masteryLevel: 3 },
      c: { masteryLevel: 1 },
    });
    expect(totalMasteryPoints(progress)).toBe(6);
  });

  it('returns 0 for empty progress', () => {
    expect(totalMasteryPoints(mkProgress())).toBe(0);
  });
});
