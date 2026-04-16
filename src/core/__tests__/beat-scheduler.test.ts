import { describe, it, expect } from 'vitest';
import { generate, createBeatScheduler } from '../beat-scheduler';
import { TEMPO_BPM } from '../../audio/beat-clock';
import type { PhonicsItem } from '../types';

function makeItems(n: number): PhonicsItem[] {
  const items: PhonicsItem[] = [];
  for (let i = 0; i < n; i++) {
    items.push({
      id: `p${i}`,
      grapheme: `g${i}`,
      phoneme: `/p${i}/`,
      exampleWords: [`w${i}`],
      set: 1,
    });
  }
  return items;
}

describe('beat-scheduler.generate', () => {
  it('returns empty array for empty items', () => {
    expect(generate([], 'medium', 10)).toEqual([]);
  });

  it('returns empty array for zero length', () => {
    expect(generate(makeItems(3), 'medium', 0)).toEqual([]);
  });

  it('produces the requested number of events', () => {
    const events = generate(makeItems(5), 'medium', 40);
    expect(events).toHaveLength(40);
  });

  it('scheduledTime matches tempo (medium = 110 BPM)', () => {
    const events = generate(makeItems(5), 'medium', 10);
    const period = 60 / TEMPO_BPM.medium;
    events.forEach((e, i) => {
      expect(e.scheduledTime).toBeCloseTo(i * period, 6);
    });
  });

  it('scheduledTime differs correctly across tempos', () => {
    const slow = generate(makeItems(3), 'slow', 5);
    const fast = generate(makeItems(3), 'fast', 5);
    const slowPeriod = 60 / TEMPO_BPM.slow;
    const fastPeriod = 60 / TEMPO_BPM.fast;
    expect(slow[1].scheduledTime).toBeCloseTo(slowPeriod, 6);
    expect(fast[1].scheduledTime).toBeCloseTo(fastPeriod, 6);
    expect(slow[1].scheduledTime).toBeGreaterThan(fast[1].scheduledTime);
  });

  it('durationMs is 80% of the beat period', () => {
    const events = generate(makeItems(3), 'medium', 5);
    const expected = Math.round((60 / TEMPO_BPM.medium) * 1000 * 0.8);
    events.forEach((e) => {
      expect(e.durationMs).toBe(expected);
    });
  });

  it('beatIndex is 0-based and sequential', () => {
    const events = generate(makeItems(4), 'fast', 25);
    events.forEach((e, i) => {
      expect(e.beatIndex).toBe(i);
    });
  });

  it('first beat is never a break', () => {
    // Run many times to catch any randomness edge.
    for (let trial = 0; trial < 50; trial++) {
      const events = generate(makeItems(4), 'medium', 20);
      expect(events[0].isBreak).toBe(false);
    }
  });

  it('break rate is approximately 20% (+/- 8% tolerance over a large sample)', () => {
    // Aggregate across multiple runs for statistical stability.
    let total = 0;
    let breaks = 0;
    for (let trial = 0; trial < 40; trial++) {
      const events = generate(makeItems(5), 'medium', 100);
      total += events.length;
      breaks += events.filter((e) => e.isBreak).length;
    }
    const rate = breaks / total;
    expect(rate).toBeGreaterThan(0.12);
    expect(rate).toBeLessThan(0.28);
  });

  it('no two breaks occur within any 4-beat window', () => {
    for (let trial = 0; trial < 20; trial++) {
      const events = generate(makeItems(5), 'medium', 200);
      for (let i = 0; i < events.length; i++) {
        if (!events[i].isBreak) continue;
        // Check the next 3 beats — none may be a break.
        for (let j = i + 1; j < Math.min(events.length, i + 4); j++) {
          expect(events[j].isBreak).toBe(false);
        }
      }
    }
  });

  it('break beats use a different item than the preceding beat', () => {
    for (let trial = 0; trial < 20; trial++) {
      const events = generate(makeItems(5), 'medium', 100);
      for (let i = 1; i < events.length; i++) {
        if (events[i].isBreak) {
          expect(events[i].item.id).not.toBe(events[i - 1].item.id);
        }
      }
    }
  });

  it('with a single item, length>1 produces no breaks (cannot pick different)', () => {
    const events = generate(makeItems(1), 'medium', 30);
    expect(events.every((e) => !e.isBreak)).toBe(true);
  });

  it('createBeatScheduler() returns a working scheduler', () => {
    const sched = createBeatScheduler();
    const events = sched.generate(makeItems(3), 'slow', 8);
    expect(events).toHaveLength(8);
    expect(events[0].beatIndex).toBe(0);
  });

  it('all events reference items from the input pool', () => {
    const items = makeItems(4);
    const ids = new Set(items.map((i) => i.id));
    const events = generate(items, 'fast', 50);
    events.forEach((e) => {
      expect(ids.has(e.item.id)).toBe(true);
    });
  });
});
