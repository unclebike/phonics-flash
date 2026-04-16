import { describe, it, expect } from 'vitest';
import { PHONICS_DATA } from '../phonics';
import { CONTENT_MANIFEST } from '../manifest';

describe('PHONICS_DATA', () => {
  it('contains exactly 42 graphemes', () => {
    expect(PHONICS_DATA).toHaveLength(42);
  });

  it('has no duplicate IDs', () => {
    const ids = PHONICS_DATA.map((p) => p.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('each item has at least 3 example words', () => {
    for (const item of PHONICS_DATA) {
      expect(
        item.exampleWords.length,
        `"${item.id}" has fewer than 3 example words`,
      ).toBeGreaterThanOrEqual(3);
    }
  });

  it('each item has a valid set number (1-7)', () => {
    for (const item of PHONICS_DATA) {
      expect(item.set).toBeGreaterThanOrEqual(1);
      expect(item.set).toBeLessThanOrEqual(7);
    }
  });

  it('the word "jolly" does not appear anywhere (case-insensitive)', () => {
    for (const item of PHONICS_DATA) {
      const blob = JSON.stringify(item).toLowerCase();
      expect(blob).not.toContain('jolly');
    }
  });

  const expectedCounts: Record<number, number> = {
    1: 6,
    2: 6,
    3: 6,
    4: 6,
    5: 6,
    6: 6,
    7: 6,
  };

  it('each set has the expected count of phonemes', () => {
    const counts: Record<number, number> = {};
    for (const item of PHONICS_DATA) {
      counts[item.set] = (counts[item.set] ?? 0) + 1;
    }
    for (const [set, count] of Object.entries(expectedCounts)) {
      expect(
        counts[Number(set)],
        `Set ${set} should have ${count} phonemes`,
      ).toBe(count);
    }
  });

  it('every item has a non-empty grapheme', () => {
    for (const item of PHONICS_DATA) {
      expect(item.grapheme.length).toBeGreaterThan(0);
    }
  });

  it('every item has a non-empty phoneme', () => {
    for (const item of PHONICS_DATA) {
      expect(item.phoneme.length).toBeGreaterThan(0);
    }
  });

  it('audioFile is undefined for all V1 items', () => {
    for (const item of PHONICS_DATA) {
      expect(item.audioFile).toBeUndefined();
    }
  });
});

describe('CONTENT_MANIFEST', () => {
  it('has a version string', () => {
    expect(CONTENT_MANIFEST.version).toBeDefined();
    expect(typeof CONTENT_MANIFEST.version).toBe('string');
  });

  it('phonemes array matches PHONICS_DATA', () => {
    expect(CONTENT_MANIFEST.phonemes).toBe(PHONICS_DATA);
  });

  it('zone configs reference valid phoneme IDs', () => {
    const validIds = new Set(PHONICS_DATA.map((p) => p.id));
    for (const zone of CONTENT_MANIFEST.zones) {
      for (const pid of zone.unlockRequirement.phonemeIds) {
        expect(
          validIds.has(pid),
          `Zone "${zone.id}" references unknown phoneme ID "${pid}"`,
        ).toBe(true);
      }
    }
  });

  it('has 7 zones', () => {
    expect(CONTENT_MANIFEST.zones).toHaveLength(7);
  });

  it('has 3 avatar tiers', () => {
    expect(CONTENT_MANIFEST.avatar.tiers).toHaveLength(3);
  });

  it('avatar tiers have increasing thresholds', () => {
    const thresholds = CONTENT_MANIFEST.avatar.tiers.map((t) => t.threshold);
    for (let i = 1; i < thresholds.length; i++) {
      expect(thresholds[i]).toBeGreaterThan(thresholds[i - 1]);
    }
  });
});
