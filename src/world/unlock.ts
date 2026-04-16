import type { ZoneConfig } from '../content/types';
import type { PhonemeProgress } from '../engine/persistence';

export type ZoneStatus = 'locked' | 'available' | 'in-progress' | 'completed';

export interface UnlockEngine {
  canUnlock(
    zone: ZoneConfig,
    progress: Map<string, PhonemeProgress>,
  ): boolean;
  getZoneStatus(
    zone: ZoneConfig,
    progress: Map<string, PhonemeProgress>,
  ): ZoneStatus;
}

/** Mastery level at which a phoneme is considered fully mastered. */
export const MASTERY_COMPLETE = 4;

/**
 * Collect every phoneme ID that belongs to this zone's own phonemeSets.
 *
 * We resolve this lazily against the CONTENT_MANIFEST to avoid a circular
 * import at module load. The lookup is done once per call.
 */
function zonePhonemeIds(
  zone: ZoneConfig,
  allPhonemes: readonly { id: string; set: number }[],
): string[] {
  const sets = new Set(zone.phonemeSets);
  return allPhonemes.filter((p) => sets.has(p.set)).map((p) => p.id);
}

export interface CreateUnlockEngineOpts {
  /** All phonemes in the manifest — used to map zone.phonemeSets -> ids. */
  allPhonemes: readonly { id: string; set: number }[];
}

export function createUnlockEngine(
  opts: CreateUnlockEngineOpts,
): UnlockEngine {
  const { allPhonemes } = opts;

  function canUnlock(
    zone: ZoneConfig,
    progress: Map<string, PhonemeProgress>,
  ): boolean {
    const req = zone.unlockRequirement;
    if (req.phonemeIds.length === 0) return true;
    for (const pid of req.phonemeIds) {
      const p = progress.get(pid);
      const level = p?.masteryLevel ?? 0;
      if (level < req.minimumMastery) return false;
    }
    return true;
  }

  function getZoneStatus(
    zone: ZoneConfig,
    progress: Map<string, PhonemeProgress>,
  ): ZoneStatus {
    if (!canUnlock(zone, progress)) return 'locked';

    const ownIds = zonePhonemeIds(zone, allPhonemes);
    if (ownIds.length === 0) return 'available';

    let allMastered = true;
    let anyAttempted = false;
    for (const id of ownIds) {
      const p = progress.get(id);
      if (!p || p.masteryLevel < MASTERY_COMPLETE) allMastered = false;
      if (p && p.attempts > 0) anyAttempted = true;
    }

    if (allMastered) return 'completed';
    if (anyAttempted) return 'in-progress';
    return 'available';
  }

  return { canUnlock, getZoneStatus };
}

/**
 * Convenience: compute the fraction of zone phonemes at mastery >= MASTERY_COMPLETE.
 * Used by the map's progress ring. Returns a number in [0, 1].
 */
export function zoneCompletion(
  zone: ZoneConfig,
  progress: Map<string, PhonemeProgress>,
  allPhonemes: readonly { id: string; set: number }[],
): number {
  const sets = new Set(zone.phonemeSets);
  const ids = allPhonemes.filter((p) => sets.has(p.set)).map((p) => p.id);
  if (ids.length === 0) return 0;
  let mastered = 0;
  for (const id of ids) {
    const p = progress.get(id);
    if (p && p.masteryLevel >= MASTERY_COMPLETE) mastered += 1;
  }
  return mastered / ids.length;
}

/**
 * Sum of masteryLevel across all phonemes. Used to pick the avatar tier.
 */
export function totalMasteryPoints(
  progress: Map<string, PhonemeProgress>,
): number {
  let total = 0;
  for (const p of progress.values()) total += p.masteryLevel;
  return total;
}
