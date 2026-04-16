import { PHONICS_DATA } from './phonics';
import type { ContentManifest } from './types';

/** Helper: collect all phoneme IDs that belong to the given sets. */
function idsForSets(...sets: number[]): string[] {
  return PHONICS_DATA
    .filter((p) => sets.includes(p.set))
    .map((p) => p.id);
}

export const CONTENT_MANIFEST: ContentManifest = {
  version: '1.0.0',
  phonemes: PHONICS_DATA,

  zones: [
    {
      id: 'whispering-meadows',
      name: 'Whispering Meadows',
      description: 'Begin your phonics adventure with the first sounds.',
      phonemeSets: [1, 2],
      unlockRequirement: {
        type: 'mastery',
        phonemeIds: [],          // unlocked by default — no prereqs
        minimumMastery: 0,
      },
      bossConfig: { tempo: 'slow', length: 10, requiredScore: 7 },
    },
    {
      id: 'rumble-woods',
      name: 'Rumble Woods',
      description: 'Explore deeper sounds among the towering trees.',
      phonemeSets: [3],
      unlockRequirement: {
        type: 'mastery',
        phonemeIds: idsForSets(1, 2),
        minimumMastery: 2,
      },
      bossConfig: { tempo: 'slow', length: 12, requiredScore: 8 },
    },
    {
      id: 'echo-shores',
      name: 'Echo Shores',
      description: 'Discover vowel pairs on the echoing beach.',
      phonemeSets: [4],
      unlockRequirement: {
        type: 'mastery',
        phonemeIds: idsForSets(3),
        minimumMastery: 2,
      },
      bossConfig: { tempo: 'medium', length: 12, requiredScore: 8 },
    },
    {
      id: 'cloud-peaks',
      name: 'Cloud Peaks',
      description: 'Climb high to master tricky consonant blends.',
      phonemeSets: [5],
      unlockRequirement: {
        type: 'mastery',
        phonemeIds: idsForSets(4),
        minimumMastery: 2,
      },
      bossConfig: { tempo: 'medium', length: 14, requiredScore: 10 },
    },
    {
      id: 'frost-cavern',
      name: 'Frost Cavern',
      description: 'Brave the caverns to learn advanced digraphs.',
      phonemeSets: [6],
      unlockRequirement: {
        type: 'mastery',
        phonemeIds: idsForSets(5),
        minimumMastery: 2,
      },
      bossConfig: { tempo: 'medium', length: 14, requiredScore: 10 },
    },
    {
      id: 'lava-forge',
      name: 'Lava Forge',
      description: 'Forge your skills with the final sound set.',
      phonemeSets: [7],
      unlockRequirement: {
        type: 'mastery',
        phonemeIds: idsForSets(6),
        minimumMastery: 2,
      },
      bossConfig: { tempo: 'fast', length: 16, requiredScore: 12 },
    },
    {
      id: 'star-summit',
      name: 'Star Summit',
      description: 'The ultimate challenge — master all 42 sounds!',
      phonemeSets: [1, 2, 3, 4, 5, 6, 7],
      unlockRequirement: {
        type: 'mastery',
        phonemeIds: idsForSets(7),
        minimumMastery: 2,
      },
      bossConfig: { tempo: 'fast', length: 20, requiredScore: 16 },
    },
  ],

  avatar: {
    tiers: [
      {
        threshold: 0,
        assets: {
          body: '/assets/avatar/tier1-body.svg',
          eyes: '/assets/avatar/tier1-eyes.svg',
          mouth: '/assets/avatar/tier1-mouth.svg',
        },
      },
      {
        threshold: 30,
        assets: {
          body: '/assets/avatar/tier2-body.svg',
          eyes: '/assets/avatar/tier2-eyes.svg',
          mouth: '/assets/avatar/tier2-mouth.svg',
          hat: '/assets/avatar/tier2-hat.svg',
        },
      },
      {
        threshold: 80,
        assets: {
          body: '/assets/avatar/tier3-body.svg',
          eyes: '/assets/avatar/tier3-eyes.svg',
          mouth: '/assets/avatar/tier3-mouth.svg',
          hat: '/assets/avatar/tier3-hat.svg',
          cape: '/assets/avatar/tier3-cape.svg',
        },
      },
    ],
  },
};
