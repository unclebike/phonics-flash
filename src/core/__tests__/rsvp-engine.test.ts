import { describe, it, expect } from 'vitest';
import {
  computeORP,
  durationFor,
  schedule,
  createRsvpEngine,
} from '../rsvp-engine';
import type { PhonicsItem, ScheduleOpts } from '../types';

// ---- Test helpers ----

function makeItem(overrides: Partial<PhonicsItem> = {}): PhonicsItem {
  return {
    id: 's',
    grapheme: 's',
    phoneme: '/s/',
    exampleWords: ['sun', 'sit', 'bus'],
    set: 1,
    ...overrides,
  };
}

// ---- ORP tests ----

describe('computeORP', () => {
  it('returns 0 for empty string', () => {
    expect(computeORP('')).toBe(0);
  });

  it('returns 0 for single character', () => {
    expect(computeORP('s')).toBe(0);
  });

  it('returns floor(n/3) for n <= 4', () => {
    // n=1: floor(1/3) = 0
    expect(computeORP('a')).toBe(0);
    // n=2: floor(2/3) = 0
    expect(computeORP('sh')).toBe(0);
    // n=3: floor(3/3) = 1
    expect(computeORP('sun')).toBe(1);
    // n=4: floor(4/3) = 1
    expect(computeORP('ship')).toBe(1);
  });

  it('returns floor(n/2) - 1 for n >= 5', () => {
    // n=5: floor(5/2) - 1 = 1
    expect(computeORP('beach')).toBe(1);
    // n=6: floor(6/2) - 1 = 2
    expect(computeORP('school')).toBe(2);
    // n=7: floor(7/2) - 1 = 2
    expect(computeORP('teacher')).toBe(2);
    // n=8: floor(8/2) - 1 = 3
    expect(computeORP('children')).toBe(3);
  });
});

// ---- Duration tests ----

describe('durationFor', () => {
  it('calculates base duration from WPM', () => {
    const item = makeItem({ grapheme: 's' });
    // 60000 / 100 = 600ms
    expect(durationFor(item, 100)).toBe(600);
  });

  it('applies 1.35x multiplier for graphemes with 5+ letters', () => {
    const item = makeItem({ grapheme: 'ough-t' }); // 6 chars
    const base = 60000 / 100; // 600
    expect(durationFor(item, 100)).toBe(Math.round(base * 1.35));
  });

  it('applies 1.5x multiplier for digraphs', () => {
    const item = makeItem({ id: 'sh', grapheme: 'sh' });
    const base = 60000 / 100; // 600
    expect(durationFor(item, 100)).toBe(Math.round(base * 1.5));
  });

  it('applies 1.5x multiplier for trigraphs', () => {
    const item = makeItem({ id: 'igh', grapheme: 'igh' });
    const base = 60000 / 100; // 600
    expect(durationFor(item, 100)).toBe(Math.round(base * 1.5));
  });

  it('applies 1.2x multiplier for previously incorrect items', () => {
    const item = makeItem({ id: 'bad-one', grapheme: 's' });
    const incorrectIds = new Set(['bad-one']);
    const base = 60000 / 100; // 600
    expect(durationFor(item, 100, incorrectIds)).toBe(Math.round(base * 1.2));
  });

  it('stacks multipliers: digraph + incorrect', () => {
    const item = makeItem({ id: 'sh', grapheme: 'sh' });
    const incorrectIds = new Set(['sh']);
    const base = 60000 / 100; // 600
    // 600 * 1.5 * 1.2 = 1080
    expect(durationFor(item, 100, incorrectIds)).toBe(
      Math.round(base * 1.5 * 1.2),
    );
  });

  it('never returns flat WPM — different items get different durations', () => {
    const simple = makeItem({ id: 'a', grapheme: 'a' });
    const digraph = makeItem({ id: 'sh', grapheme: 'sh' });
    const long = makeItem({ id: 'ough-t', grapheme: 'ough-t' });

    const d1 = durationFor(simple, 100);
    const d2 = durationFor(digraph, 100);
    const d3 = durationFor(long, 100);

    // At least some durations must differ (never flat WPM)
    const allSame = d1 === d2 && d2 === d3;
    expect(allSame).toBe(false);
  });

  it('works with different WPM values', () => {
    const item = makeItem({ grapheme: 's' });
    const fast = durationFor(item, 150);
    const slow = durationFor(item, 80);
    expect(fast).toBeLessThan(slow);
  });

  it('respects WPM range boundaries', () => {
    const item = makeItem({ grapheme: 's' });
    // 60000 / 80 = 750ms
    expect(durationFor(item, 80)).toBe(750);
    // 60000 / 150 = 400ms
    expect(durationFor(item, 150)).toBe(400);
  });
});

// ---- Schedule tests ----

describe('schedule', () => {
  const items: PhonicsItem[] = [
    makeItem({ id: 's', grapheme: 's' }),
    makeItem({ id: 'a', grapheme: 'a' }),
    makeItem({ id: 't', grapheme: 't' }),
    makeItem({ id: 'p', grapheme: 'p' }),
    makeItem({ id: 'sh', grapheme: 'sh' }),
  ];

  it('returns empty array for empty input', () => {
    const result = schedule([], { baseWpm: 100, sessionLength: 5, includeReview: false });
    expect(result).toEqual([]);
  });

  it('returns requested session length', () => {
    const result = schedule(items, {
      baseWpm: 100,
      sessionLength: 5,
      includeReview: false,
    });
    expect(result).toHaveLength(5);
  });

  it('each scheduled item has required fields', () => {
    const result = schedule(items, {
      baseWpm: 100,
      sessionLength: 3,
      includeReview: false,
    });

    for (const s of result) {
      expect(s.item).toBeDefined();
      expect(s.durationMs).toBeGreaterThan(0);
      expect(s.orpIndex).toBeGreaterThanOrEqual(0);
      expect(typeof s.isReview).toBe('boolean');
    }
  });

  it('marks new items as not review', () => {
    const result = schedule(items, {
      baseWpm: 100,
      sessionLength: 3,
      includeReview: false,
    });

    // First items should not be review when includeReview is false
    for (const s of result) {
      expect(s.isReview).toBe(false);
    }
  });

  it('produces variable durations (not flat WPM)', () => {
    const mixedItems: PhonicsItem[] = [
      makeItem({ id: 's', grapheme: 's' }),
      makeItem({ id: 'sh', grapheme: 'sh' }),
      makeItem({ id: 'igh', grapheme: 'igh' }),
    ];

    const result = schedule(mixedItems, {
      baseWpm: 100,
      sessionLength: 3,
      includeReview: false,
    });

    const durations = result.map((r) => r.durationMs);
    const allSame = durations.every((d) => d === durations[0]);
    expect(allSame).toBe(false);
  });

  it('reinserts incorrect items 3-5 positions later', () => {
    const incorrectIds = new Set(['s']);
    const result = schedule(
      items,
      { baseWpm: 100, sessionLength: 10, includeReview: false },
      incorrectIds,
    );

    // Find positions of item 's'
    const positions = result
      .map((s, i) => (s.item.id === 's' ? i : -1))
      .filter((i) => i >= 0);

    // 's' should appear at position 0 and again somewhere 3-5 later
    expect(positions.length).toBeGreaterThanOrEqual(2);
    if (positions.length >= 2) {
      const gap = positions[1] - positions[0];
      expect(gap).toBeGreaterThanOrEqual(3);
      expect(gap).toBeLessThanOrEqual(5);
    }
  });

  it('handles sessionLength longer than item count by cycling', () => {
    const twoItems = [
      makeItem({ id: 'a', grapheme: 'a' }),
      makeItem({ id: 'b', grapheme: 'b' }),
    ];

    const result = schedule(twoItems, {
      baseWpm: 100,
      sessionLength: 6,
      includeReview: false,
    });

    expect(result).toHaveLength(6);
  });

  it('computes correct ORP for each scheduled item', () => {
    const result = schedule(items, {
      baseWpm: 100,
      sessionLength: 5,
      includeReview: false,
    });

    for (const s of result) {
      expect(s.orpIndex).toBe(computeORP(s.item.grapheme));
    }
  });
});

// ---- Factory test ----

describe('createRsvpEngine', () => {
  it('returns an object implementing RsvpEngine interface', () => {
    const engine = createRsvpEngine();
    expect(typeof engine.schedule).toBe('function');
    expect(typeof engine.computeORP).toBe('function');
    expect(typeof engine.durationFor).toBe('function');
  });

  it('engine.computeORP works correctly', () => {
    const engine = createRsvpEngine();
    expect(engine.computeORP('sun')).toBe(1);
    expect(engine.computeORP('teacher')).toBe(2);
  });

  it('engine.durationFor returns positive duration', () => {
    const engine = createRsvpEngine();
    const item = makeItem();
    expect(engine.durationFor(item, 100)).toBeGreaterThan(0);
  });

  it('engine.schedule returns valid schedule', () => {
    const engine = createRsvpEngine();
    const result = engine.schedule(
      [makeItem(), makeItem({ id: 'sh', grapheme: 'sh' })],
      { baseWpm: 100, sessionLength: 2, includeReview: false },
    );
    expect(result).toHaveLength(2);
  });
});
