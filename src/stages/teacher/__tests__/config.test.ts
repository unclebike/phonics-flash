import { describe, it, expect } from 'vitest';
import { parseList, getPresets, DEFAULT_CONFIG, SIGHT_WORDS_PRESET } from '../config';

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
