import type { PhonicsItem } from '../core/types';

export const PHONICS_DATA: PhonicsItem[] = [
  // ── Set 1 ──
  { id: 's',  grapheme: 's',  phoneme: '/s/',  exampleWords: ['sun', 'sit', 'sand', 'sip'],  set: 1 },
  { id: 'a',  grapheme: 'a',  phoneme: '/æ/',  exampleWords: ['ant', 'apple', 'cat', 'bat'],  set: 1 },
  { id: 't',  grapheme: 't',  phoneme: '/t/',  exampleWords: ['tap', 'ten', 'top', 'tin'],  set: 1 },
  { id: 'i',  grapheme: 'i',  phoneme: '/ɪ/',  exampleWords: ['ink', 'sit', 'pig', 'dig'],  set: 1 },
  { id: 'p',  grapheme: 'p',  phoneme: '/p/',  exampleWords: ['pen', 'pan', 'pot', 'pin'],  set: 1 },
  { id: 'n',  grapheme: 'n',  phoneme: '/n/',  exampleWords: ['net', 'nap', 'nut', 'nod'],  set: 1 },

  // ── Set 2 ──
  { id: 'ck', grapheme: 'c/k', phoneme: '/k/',  exampleWords: ['cat', 'kid', 'cup', 'kite'],  set: 2 },
  { id: 'e',  grapheme: 'e',  phoneme: '/ɛ/',  exampleWords: ['egg', 'pen', 'red', 'bed'],  set: 2 },
  { id: 'h',  grapheme: 'h',  phoneme: '/h/',  exampleWords: ['hat', 'hen', 'hot', 'hug'],  set: 2 },
  { id: 'r',  grapheme: 'r',  phoneme: '/r/',  exampleWords: ['run', 'red', 'rat', 'rip'],  set: 2 },
  { id: 'm',  grapheme: 'm',  phoneme: '/m/',  exampleWords: ['man', 'map', 'mud', 'mop'],  set: 2 },
  { id: 'd',  grapheme: 'd',  phoneme: '/d/',  exampleWords: ['dog', 'dig', 'den', 'dip'],  set: 2 },

  // ── Set 3 ──
  { id: 'g',  grapheme: 'g',  phoneme: '/ɡ/',  exampleWords: ['got', 'gap', 'gum', 'gift'],  set: 3 },
  { id: 'o',  grapheme: 'o',  phoneme: '/ɒ/',  exampleWords: ['on', 'pot', 'hot', 'top'],  set: 3 },
  { id: 'u',  grapheme: 'u',  phoneme: '/ʌ/',  exampleWords: ['up', 'cup', 'bus', 'hug'],  set: 3 },
  { id: 'l',  grapheme: 'l',  phoneme: '/l/',  exampleWords: ['log', 'lip', 'let', 'lot'],  set: 3 },
  { id: 'f',  grapheme: 'f',  phoneme: '/f/',  exampleWords: ['fun', 'fan', 'fog', 'fit'],  set: 3 },
  { id: 'b',  grapheme: 'b',  phoneme: '/b/',  exampleWords: ['bat', 'bed', 'big', 'box'],  set: 3 },

  // ── Set 4 ──
  { id: 'ai', grapheme: 'ai', phoneme: '/eɪ/', exampleWords: ['rain', 'tail', 'wait', 'pain'],  set: 4 },
  { id: 'j',  grapheme: 'j',  phoneme: '/dʒ/', exampleWords: ['jam', 'jug', 'jet', 'jump'],  set: 4 },
  { id: 'oa', grapheme: 'oa', phoneme: '/əʊ/', exampleWords: ['boat', 'coat', 'road', 'goat'],  set: 4 },
  { id: 'ie', grapheme: 'ie', phoneme: '/aɪ/', exampleWords: ['tie', 'pie', 'lie', 'die'],  set: 4 },
  { id: 'ee', grapheme: 'ee', phoneme: '/iː/', exampleWords: ['tree', 'bee', 'see', 'feet'],  set: 4 },
  { id: 'or', grapheme: 'or', phoneme: '/ɔː/', exampleWords: ['for', 'fork', 'corn', 'sort'],  set: 4 },

  // ── Set 5 ──
  { id: 'z',       grapheme: 'z',  phoneme: '/z/',  exampleWords: ['zip', 'zoo', 'buzz', 'fizz'],  set: 5 },
  { id: 'w',       grapheme: 'w',  phoneme: '/w/',  exampleWords: ['wet', 'win', 'web', 'wag'],  set: 5 },
  { id: 'ng',      grapheme: 'ng', phoneme: '/ŋ/',  exampleWords: ['ring', 'sing', 'long', 'king'],  set: 5 },
  { id: 'v',       grapheme: 'v',  phoneme: '/v/',  exampleWords: ['van', 'vet', 'vest', 'vine'],  set: 5 },
  { id: 'oo-short', grapheme: 'oo', phoneme: '/ʊ/',  exampleWords: ['book', 'look', 'cook', 'foot'],  set: 5 },
  { id: 'oo-long',  grapheme: 'oo', phoneme: '/uː/', exampleWords: ['moon', 'food', 'pool', 'cool'],  set: 5 },

  // ── Set 6 ──
  { id: 'y',            grapheme: 'y',  phoneme: '/j/',  exampleWords: ['yes', 'yam', 'yet', 'yell'],  set: 6 },
  { id: 'x',            grapheme: 'x',  phoneme: '/ks/', exampleWords: ['box', 'fox', 'six', 'mix'],  set: 6 },
  { id: 'ch',           grapheme: 'ch', phoneme: '/tʃ/', exampleWords: ['chip', 'chat', 'chin', 'chop'],  set: 6 },
  { id: 'sh',           grapheme: 'sh', phoneme: '/ʃ/',  exampleWords: ['ship', 'shop', 'shed', 'fish'],  set: 6 },
  { id: 'th-voiced',    grapheme: 'th', phoneme: '/ð/',  exampleWords: ['this', 'that', 'them', 'then'],  set: 6 },
  { id: 'th-voiceless', grapheme: 'th', phoneme: '/θ/',  exampleWords: ['thin', 'thick', 'path', 'bath'],  set: 6 },

  // ── Set 7 ──
  { id: 'qu', grapheme: 'qu', phoneme: '/kw/', exampleWords: ['queen', 'quiz', 'quit', 'quilt'],  set: 7 },
  { id: 'ou', grapheme: 'ou', phoneme: '/aʊ/', exampleWords: ['out', 'loud', 'cloud', 'shout'],  set: 7 },
  { id: 'oi', grapheme: 'oi', phoneme: '/ɔɪ/', exampleWords: ['oil', 'coin', 'boil', 'foil'],  set: 7 },
  { id: 'ue', grapheme: 'ue', phoneme: '/uː/', exampleWords: ['blue', 'clue', 'glue', 'true'],  set: 7 },
  { id: 'er', grapheme: 'er', phoneme: '/ɜː/', exampleWords: ['her', 'fern', 'term', 'herd'],  set: 7 },
  { id: 'ar', grapheme: 'ar', phoneme: '/ɑː/', exampleWords: ['car', 'star', 'farm', 'park'],  set: 7 },
];
