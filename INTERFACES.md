# INTERFACES.md — Cross-Agent Contracts

Every public function, exported type, and event bus message that crosses an agent boundary appears here before it appears in code. Agents propose additions. Coordinator ratifies.

---

## Content / World <-> Drill Session (ADR-009)

```ts
// /src/stages/learn/DrillSession.tsx
interface DrillSessionProps {
  /** When set, loads that zone's phonemes as a per-session list
   *  override. Does NOT mutate the teacher's saved config. */
  zoneId?: string;
  /** Optional override of the persisted teacher config (tests/deep-links). */
  configOverride?: TeacherConfig;
  onExit?: () => void;
}
```

The drill resolves its word list in this priority order:

1. `configOverride.rawList` (tests only)
2. CONTENT_MANIFEST zone phonemes if `zoneId` matches a manifest zone
3. `loadConfig().rawList` (teacher panel / localStorage default)

The teacher's saved list in localStorage is never overwritten by zone entry.

## Core <-> Learn Mode

```ts
// /src/core/rsvp-engine.ts
interface PhonicsItem {
  id: string;               // e.g. "s", "ai", "th-voiced"
  grapheme: string;          // the written form: "s", "ai", "th"
  phoneme: string;           // IPA or simplified: /s/, /eɪ/, /ð/
  exampleWords: string[];    // ["sun", "sit", "bus"]
  set: number;               // 1-7
  audioFile?: string;        // path to human recording, if available
}

interface ScheduleOpts {
  baseWpm: number;           // 80-150
  sessionLength: number;     // number of items
  includeReview: boolean;    // mix in previously-seen items
}

interface Scheduled {
  item: PhonicsItem;
  durationMs: number;
  orpIndex: number;          // 0-indexed character position for ORP highlight
  isReview: boolean;
}

interface RsvpEngine {
  schedule(items: PhonicsItem[], opts: ScheduleOpts): Scheduled[];
  computeORP(word: string): number;
  durationFor(item: PhonicsItem, baseWpm: number): number;
}
```

---

## Core <-> Beat Mode

```ts
// /src/core/beat-scheduler.ts
interface BeatEvent {
  item: PhonicsItem;
  beatIndex: number;
  scheduledTime: number;     // AudioContext time in seconds
  isBreak: boolean;          // true = pattern-break / oddball
  durationMs: number;
}

interface BeatScheduler {
  generate(items: PhonicsItem[], tempo: Tempo, length: number): BeatEvent[];
}

type Tempo = 'slow' | 'medium' | 'fast';
// slow = 80 BPM, medium = 110 BPM, fast = 140 BPM
```

---

## Engine <-> All Stages

```ts
// /src/engine/persistence.ts
interface PersistenceAdapter {
  getProgress(phonemeId: string): Promise<PhonemeProgress | null>;
  updateProgress(phonemeId: string, update: ProgressUpdate): Promise<void>;
  getAvatarState(): Promise<AvatarState>;
  updateAvatarState(update: Partial<AvatarState>): Promise<void>;
  getUnlockedZones(): Promise<string[]>;
  unlockZone(zoneId: string): Promise<void>;
  getSettings(): Promise<UserSettings>;
  updateSettings(update: Partial<UserSettings>): Promise<void>;
}

interface PhonemeProgress {
  phonemeId: string;
  masteryLevel: number;      // 0-5
  lastSeenAt: number;        // timestamp
  attempts: number;
  correct: number;
}

interface ProgressUpdate {
  correct: boolean;
  timestamp: number;
}
```

---

## Content <-> Learn Mode / Beat Mode / World

```ts
// /src/content/manifest.ts
interface ContentManifest {
  version: string;
  phonemes: PhonicsItem[];
  zones: ZoneConfig[];
  avatar: AvatarConfig;
}

interface ZoneConfig {
  id: string;
  name: string;
  description: string;
  phonemeSets: number[];     // which sets (1-7) this zone covers
  unlockRequirement: UnlockRequirement;
  bossConfig: BossConfig;
}

interface UnlockRequirement {
  type: 'mastery';
  phonemeIds: string[];
  minimumMastery: number;    // 0-5
}

interface BossConfig {
  tempo: Tempo;
  length: number;            // number of beats
  requiredScore: number;     // minimum to pass
}

interface AvatarConfig {
  tiers: AvatarTier[];       // visual state at each mastery threshold
}

interface AvatarTier {
  threshold: number;         // total mastery points to reach this tier
  assets: Record<string, string>;  // asset key -> path
}
```

---

## UI <-> All

```ts
// /src/ui/design-tokens.ts
// Design tokens are CSS custom properties, not TS values.
// This file exports token names as constants for type safety.

// /src/ui/components/ — shared components
// Button, Card, Modal, Meter, Streak, Sparkle
// Each component accepts standard a11y props (aria-label, role, etc.)
```

---

## Audio <-> Beat Mode / Learn Mode

```ts
// /src/audio/speech.ts
interface SpeechService {
  speakPhoneme(phoneme: PhonicsItem): Promise<void>;
  speakWord(word: string): Promise<void>;
  isSupported(): boolean;
}

// /src/audio/beat-clock.ts
interface BeatClock {
  start(tempo: Tempo): void;
  stop(): void;
  getCurrentBeat(): number;
  getAudioTime(): number;    // AudioContext.currentTime
  onBeat(callback: (beatIndex: number, audioTime: number) => void): () => void;
}
```

---

## World <-> Engine

```ts
// /src/world/unlock.ts
interface UnlockEngine {
  canUnlock(zone: ZoneConfig, progress: Map<string, PhonemeProgress>): boolean;
  getZoneStatus(zone: ZoneConfig, progress: Map<string, PhonemeProgress>): ZoneStatus;
}

type ZoneStatus = 'locked' | 'available' | 'in-progress' | 'completed';
```

---

## Worker API (V1 surface — minimal)

```
GET  /api/manifest/version    -> { version: string, hash: string }
POST /api/telemetry            -> 202 Accepted (fire-and-forget)
     Body: { events: TelemetryEvent[] }

# V2-dormant (feature-flagged off):
POST /api/sync/progress        -> 200 { merged: PhonemeProgress[] }
POST /api/auth/anon            -> 200 { token: string }
```
