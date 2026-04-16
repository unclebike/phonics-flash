import { get, set } from 'idb-keyval';

// ---- Types ----

export interface PhonemeProgress {
  phonemeId: string;
  masteryLevel: number;      // 0-5
  lastSeenAt: number;        // timestamp
  attempts: number;
  correct: number;
}

export interface ProgressUpdate {
  correct: boolean;
  timestamp: number;
}

export interface AvatarState {
  tier: number;
  totalMastery: number;
  customizations: Record<string, string>;
}

export interface UserSettings {
  baseWpm: number;
  sessionLength: number;
  fontChoice: 'system' | 'opendyslexic' | 'atkinson';
  highContrast: boolean;
  audioEnabled: boolean;
}

export interface PersistenceAdapter {
  getProgress(phonemeId: string): Promise<PhonemeProgress | null>;
  updateProgress(phonemeId: string, update: ProgressUpdate): Promise<void>;
  getAvatarState(): Promise<AvatarState>;
  updateAvatarState(update: Partial<AvatarState>): Promise<void>;
  getUnlockedZones(): Promise<string[]>;
  unlockZone(zoneId: string): Promise<void>;
  getSettings(): Promise<UserSettings>;
  updateSettings(update: Partial<UserSettings>): Promise<void>;
}

// ---- Key helpers ----

const KEYS = {
  progress: (id: string) => `progress:${id}`,
  avatar: 'avatar-state',
  zones: 'unlocked-zones',
  settings: 'user-settings',
} as const;

// ---- Defaults ----

const DEFAULT_AVATAR: AvatarState = {
  tier: 0,
  totalMastery: 0,
  customizations: {},
};

const DEFAULT_SETTINGS: UserSettings = {
  baseWpm: 100,
  sessionLength: 10,
  fontChoice: 'system',
  highContrast: false,
  audioEnabled: true,
};

// ---- Implementation ----

export function createPersistenceAdapter(): PersistenceAdapter {
  return {
    async getProgress(phonemeId: string): Promise<PhonemeProgress | null> {
      const stored = await get<PhonemeProgress>(KEYS.progress(phonemeId));
      return stored ?? null;
    },

    async updateProgress(
      phonemeId: string,
      update: ProgressUpdate,
    ): Promise<void> {
      const existing = await get<PhonemeProgress>(KEYS.progress(phonemeId));
      const progress: PhonemeProgress = existing ?? {
        phonemeId,
        masteryLevel: 0,
        lastSeenAt: 0,
        attempts: 0,
        correct: 0,
      };

      progress.attempts += 1;
      progress.lastSeenAt = update.timestamp;

      if (update.correct) {
        progress.correct += 1;
        // Simple mastery: increase level when accuracy is high enough
        const accuracy = progress.correct / progress.attempts;
        if (accuracy >= 0.8 && progress.attempts >= 3) {
          progress.masteryLevel = Math.min(5, progress.masteryLevel + 1);
        }
      }

      await set(KEYS.progress(phonemeId), progress);
    },

    async getAvatarState(): Promise<AvatarState> {
      const stored = await get<AvatarState>(KEYS.avatar);
      return stored ?? { ...DEFAULT_AVATAR };
    },

    async updateAvatarState(update: Partial<AvatarState>): Promise<void> {
      const current = await get<AvatarState>(KEYS.avatar);
      const merged = { ...(current ?? DEFAULT_AVATAR), ...update };
      await set(KEYS.avatar, merged);
    },

    async getUnlockedZones(): Promise<string[]> {
      const stored = await get<string[]>(KEYS.zones);
      return stored ?? [];
    },

    async unlockZone(zoneId: string): Promise<void> {
      const zones = await get<string[]>(KEYS.zones) ?? [];
      if (!zones.includes(zoneId)) {
        zones.push(zoneId);
        await set(KEYS.zones, zones);
      }
    },

    async getSettings(): Promise<UserSettings> {
      const stored = await get<UserSettings>(KEYS.settings);
      return stored ?? { ...DEFAULT_SETTINGS };
    },

    async updateSettings(update: Partial<UserSettings>): Promise<void> {
      const current = await get<UserSettings>(KEYS.settings);
      const merged = { ...(current ?? DEFAULT_SETTINGS), ...update };
      await set(KEYS.settings, merged);
    },
  };
}
