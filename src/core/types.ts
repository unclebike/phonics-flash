export interface PhonicsItem {
  id: string;
  grapheme: string;
  phoneme: string;
  exampleWords: string[];
  set: number;
  audioFile?: string;
}

export interface ScheduleOpts {
  baseWpm: number;           // 80-150
  sessionLength: number;     // number of items
  includeReview: boolean;    // mix in previously-seen items
}

export interface Scheduled {
  item: PhonicsItem;
  durationMs: number;
  orpIndex: number;          // 0-indexed character position for ORP highlight
  isReview: boolean;
}

export interface RsvpEngine {
  schedule(items: PhonicsItem[], opts: ScheduleOpts): Scheduled[];
  computeORP(word: string): number;
  durationFor(item: PhonicsItem, baseWpm: number): number;
}

// Known digraphs and trigraphs for duration calculation
export const DIGRAPHS = new Set([
  'sh', 'ch', 'th', 'ph', 'wh', 'ck', 'ng', 'qu',
  'ai', 'ay', 'ea', 'ee', 'ie', 'oa', 'oo', 'ou',
  'ow', 'ue', 'er', 'ar', 'or', 'ur', 'oi', 'oy',
  'au', 'aw', 'ew',
]);

export const TRIGRAPHS = new Set([
  'igh', 'ear', 'air', 'ure', 'tch', 'dge',
]);
