import type { PhonicsItem } from '../core/types';

export interface ZoneConfig {
  id: string;
  name: string;
  description: string;
  phonemeSets: number[];
  unlockRequirement: UnlockRequirement;
  bossConfig: BossConfig;
}

export interface UnlockRequirement {
  type: 'mastery';
  phonemeIds: string[];
  minimumMastery: number;
}

export interface BossConfig {
  tempo: 'slow' | 'medium' | 'fast';
  length: number;
  requiredScore: number;
}

export interface AvatarTier {
  threshold: number;
  assets: Record<string, string>;
}

export interface AvatarConfig {
  tiers: AvatarTier[];
}

export interface ContentManifest {
  version: string;
  phonemes: PhonicsItem[];
  zones: ZoneConfig[];
  avatar: AvatarConfig;
}
