import { describe, it, expect } from 'vitest';
import { parseList, getPresets, DEFAULT_CONFIG, SIGHT_WORDS_PRESET, rollOffset } from '../config';

describe('parseList', () => {
  it('splits on commas', () => {
    expect(parseList('a, b, c')).toEqual(['a', 'b', 'c']);
  });

  it('splits on newlines', () => {
    expect(parseList('a\nb\nc')).toEqual(['a', 'b', 'c']);
  });

  it('splits on mixed commas and newlines', () => {
    expect(parseList('a, b\nc,d\ne')).toEqual(['a', 'b', 'c', 'd', 'e']);
  });

  it('trims whitespace', () => {
    expect(parseList('  a  ,  b  ')).toEqual(['a', 'b']);
  });

  it('drops empty tokens', () => {
    expect(parseList('a,,b,  ,c')).toEqual(['a', 'b', 'c']);
  });

  it('strips trailing * and ! annotations', () => {
    expect(parseList('a*, b!, c, d**')).toEqual(['a', 'b', 'c', 'd']);
  });

  it('returns empty array for empty input', () => {
    expect(parseList('')).toEqual([]);
    expect(parseList('   ')).toEqual([]);
    expect(parseList('\n\n,,\n')).toEqual([]);
  });

  it('handles digraphs and trigraphs intact', () => {
    expect(parseList('sh, ch, th, ight, igh')).toEqual(['sh', 'ch', 'th', 'ight', 'igh']);
  });

  it('preserves multi-letter words (sight words)', () => {
    expect(parseList('the, and, because')).toEqual(['the', 'and', 'because']);
  });
});

describe('default config', () => {
  it('has a non-empty starting list', () => {
    expect(DEFAULT_CONFIG.rawList.length).toBeGreaterThan(0);
    expect(parseList(DEFAULT_CONFIG.rawList).length).toBeGreaterThan(0);
  });

  it('has sensible defaults', () => {
    expect(DEFAULT_CONFIG.flashDurationMs).toBeGreaterThan(0);
    expect(DEFAULT_CONFIG.flashDurationMs).toBeLessThan(2000);
    expect(DEFAULT_CONFIG.randomize).toBe(false);
  });

  it('positionVariance defaults to 0 (centered letters)', () => {
    expect(DEFAULT_CONFIG.positionVariance).toBe(0);
  });
});

describe('rollOffset (ADR-011)', () => {
  it('returns (0, 0) when variance is 0', () => {
    expect(rollOffset(0)).toEqual({ ox: 0, oy: 0 });
    // Even with a non-default RNG, 0 variance means no movement.
    expect(rollOffset(0, () => 0.99)).toEqual({ ox: 0, oy: 0 });
  });

  it('returns values in [-1, +1] for any variance', () => {
    for (let v = 10; v <= 100; v += 10) {
      for (let trial = 0; trial < 50; trial++) {
        const { ox, oy } = rollOffset(v);
        expect(ox).toBeGreaterThanOrEqual(-1);
        expect(ox).toBeLessThanOrEqual(1);
        expect(oy).toBeGreaterThanOrEqual(-1);
        expect(oy).toBeLessThanOrEqual(1);
      }
    }
  });

  it('scales offset range with variance', () => {
    // Deterministic RNG that always returns 1 → offset magnitude = variance/100
    const rng = () => 1;
    expect(rollOffset(50, rng)).toEqual({ ox: 0.5, oy: 0.5 });
    expect(rollOffset(100, rng)).toEqual({ ox: 1, oy: 1 });
    // RNG returns 0 → (0*2-1) * v = -v
    const rngZero = () => 0;
    expect(rollOffset(50, rngZero)).toEqual({ ox: -0.5, oy: -0.5 });
  });

  it('clamps variance outside [0, 100]', () => {
    const rng = () => 1;
    expect(rollOffset(-50, rng)).toEqual({ ox: 0, oy: 0 });  // treated as 0
    expect(rollOffset(200, rng)).toEqual({ ox: 1, oy: 1 });  // clamped to 100
  });
});

describe('presets', () => {
  it('returns one preset per manifest zone', () => {
    const presets = getPresets();
    expect(presets.length).toBe(7);
    expect(presets[0].id).toBe('whispering-meadows');
  });

  it('each preset has a parseable list with at least one token', () => {
    for (const preset of getPresets()) {
      const tokens = parseList(preset.list);
      expect(tokens.length).toBeGreaterThan(0);
    }
  });

  it('sight-words preset parses to 30+ tokens', () => {
    const tokens = parseList(SIGHT_WORDS_PRESET.list);
    expect(tokens.length).toBeGreaterThanOrEqual(30);
  });
});
