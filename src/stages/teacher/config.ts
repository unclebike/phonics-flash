/**
 * Teacher-configurable drill session settings.
 *
 * Stored in localStorage so the teacher's configuration persists across
 * reloads and devices within the same browser profile.
 */

import { CONTENT_MANIFEST } from '../../content/manifest';
import { PHONICS_DATA } from '../../content/phonics';

export interface TeacherConfig {
  /** Raw text the teacher typed — comma or newline-separated. Canonical source. */
  rawList: string;
  /** Flash duration in milliseconds (50-1500). */
  flashDurationMs: number;
  /** If true, words are shown in random order each session. */
  randomize: boolean;
  /** Optional: highlight the ORP character on each flash. Off by default. */
  showOrp: boolean;
  /** Optional: vary duration by word length / digraph rules. Off by default. */
  variableTiming: boolean;
}

const STORAGE_KEY = 'phonics-flash:teacher-config';

export const DEFAULT_CONFIG: TeacherConfig = {
  rawList: PHONICS_DATA.filter((p) => p.set === 1).map((p) => p.grapheme).join(', '),
  flashDurationMs: 250,
  randomize: false,
  showOrp: false,
  variableTiming: false,
};

/**
 * Parse the teacher's raw text list into an array of word tokens.
 * Accepts commas, newlines, and arbitrary whitespace as separators.
 * Trims each token. Strips trailing "*" or "!" annotations (teachers
 * sometimes use them as per-item markers).
 */
export function parseList(raw: string): string[] {
  return raw
    .split(/[,\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .map((s) => s.replace(/[*!]+$/, '').trim())
    .filter((s) => s.length > 0);
}

/** Load saved config from localStorage, merging missing keys from defaults. */
export function loadConfig(): TeacherConfig {
  if (typeof localStorage === 'undefined') return DEFAULT_CONFIG;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_CONFIG;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_CONFIG, ...parsed };
  } catch {
    return DEFAULT_CONFIG;
  }
}

/** Persist config to localStorage. */
export function saveConfig(config: TeacherConfig): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    // Quota errors, private-mode, etc — fail silently.
  }
}

/** Preset lists derived from the content manifest zones. */
export interface Preset {
  id: string;
  name: string;
  list: string;
}

export function getPresets(): Preset[] {
  return CONTENT_MANIFEST.zones.map((zone) => ({
    id: zone.id,
    name: zone.name,
    list: PHONICS_DATA
      .filter((p) => zone.phonemeSets.includes(p.set))
      .map((p) => p.grapheme)
      .join(', '),
  }));
}

/**
 * Sight words + common early-reader words as an extra preset.
 * Kept short; teachers will typically replace with their own list.
 */
export const SIGHT_WORDS_PRESET: Preset = {
  id: 'sight-words',
  name: 'Common Sight Words',
  list: 'the, of, and, a, to, in, is, you, that, it, he, was, for, on, are, as, with, his, they, at, be, this, have, from, or, one, had, by, word, but, not',
};
