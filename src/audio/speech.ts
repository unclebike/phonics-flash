import type { PhonicsItem } from '../core/types';

export interface SpeechService {
  speakPhoneme(phoneme: PhonicsItem): Promise<void>;
  speakWord(word: string): Promise<void>;
  isSupported(): boolean;
}

/**
 * Map from grapheme to a pronounceable approximation of the *sound*
 * (not the letter name). Web Speech API will read these strings aloud
 * so they approximate the isolated phoneme.
 */
const PHONEME_SOUNDS: Record<string, string> = {
  s:   'sss',
  a:   'aah',
  t:   'tuh',
  i:   'ih',
  p:   'puh',
  n:   'nnn',
  ck:  'kuh',
  e:   'eh',
  h:   'huh',
  r:   'rrr',
  m:   'mmm',
  d:   'duh',
  g:   'guh',
  o:   'oh',
  u:   'uh',
  l:   'lll',
  f:   'fff',
  b:   'buh',
  ai:  'ay',
  j:   'juh',
  oa:  'oh',
  ie:  'eye',
  ee:  'eee',
  or:  'or',
  z:   'zzz',
  w:   'wuh',
  ng:  'ng',
  v:   'vvv',
  'oo-short': 'oo',
  'oo-long':  'ooo',
  y:   'yuh',
  x:   'ks',
  ch:  'ch',
  sh:  'sh',
  'th-voiced':    'thh',
  'th-voiceless': 'th',
  qu:  'kwuh',
  ou:  'ow',
  oi:  'oy',
  ue:  'ooo',
  er:  'er',
  ar:  'ar',
};

function speak(text: string, rate: number): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      reject(new Error('Web Speech API not supported'));
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate;
    utterance.lang = 'en-GB';

    utterance.onend = () => resolve();
    utterance.onerror = (ev) => reject(new Error(`Speech error: ${ev.error}`));

    window.speechSynthesis.speak(utterance);
  });
}

export function createSpeechService(): SpeechService {
  return {
    speakPhoneme(item: PhonicsItem): Promise<void> {
      const sound = PHONEME_SOUNDS[item.id] ?? item.grapheme;
      return speak(sound, 0.7);
    },

    speakWord(word: string): Promise<void> {
      return speak(word, 0.85);
    },

    isSupported(): boolean {
      return (
        typeof window !== 'undefined' &&
        typeof window.speechSynthesis !== 'undefined'
      );
    },
  };
}
