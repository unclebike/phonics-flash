/**
 * BeatScheduler — pure logic for generating a Beat Mode sequence with
 * oddball pattern-breaks.
 *
 * A "pattern" is a run of 3–5 beats showing the same phoneme. A "break"
 * introduces a different phoneme (the oddball). The child learns the
 * pattern, then the break tests whether they noticed the switch.
 *
 * Rules:
 * - Target break rate: ~20% of beats.
 * - First beat is never a break (pattern must be established first).
 * - No two breaks within any 4-beat sliding window (breaks must be rare
 *   enough that the pattern re-asserts itself).
 * - scheduledTime is a 0-based offset in seconds from sequence start
 *   (NOT an AudioContext absolute time — that's the BeatClock's job).
 * - durationMs is 80% of the beat period, leaving a small visual gap.
 *
 * This module is pure: no DOM, no AudioContext, no random sources beyond
 * Math.random (callers can seed via a custom rng for determinism).
 */

import type { PhonicsItem } from './types';
import { TEMPO_BPM, type Tempo } from '../audio/beat-clock';

export interface BeatEvent {
  item: PhonicsItem;
  beatIndex: number;
  scheduledTime: number;   // seconds from sequence start
  isBreak: boolean;
  durationMs: number;
}

export interface BeatScheduler {
  generate(items: PhonicsItem[], tempo: Tempo, length: number): BeatEvent[];
}

const TARGET_BREAK_RATE = 0.2;
const NO_CONSECUTIVE_WINDOW = 4;
const MIN_PATTERN_RUN = 3;
const MAX_PATTERN_RUN = 5;

type Rng = () => number;

/**
 * Generate a beat sequence.
 *
 * Strategy: we walk the sequence beat-by-beat. We hold a "current pattern"
 * phoneme and a countdown of remaining beats in the run. When the run
 * expires we probabilistically emit a break (different phoneme) and then
 * commit to a new pattern phoneme. The break-rate target and the
 * no-consecutive-breaks-in-4 rule together determine when a break fires.
 */
export function generate(
  items: PhonicsItem[],
  tempo: Tempo,
  length: number,
  rng: Rng = Math.random,
): BeatEvent[] {
  if (items.length === 0 || length <= 0) return [];

  const bpm = TEMPO_BPM[tempo];
  const beatPeriodSec = 60 / bpm;
  const durationMs = Math.round(beatPeriodSec * 1000 * 0.8);

  const events: BeatEvent[] = [];

  // Pick initial pattern item and its run length.
  let patternIdx = Math.floor(rng() * items.length);
  let runRemaining = MIN_PATTERN_RUN + Math.floor(rng() * (MAX_PATTERN_RUN - MIN_PATTERN_RUN + 1));

  // Track the last break's beat index for the consecutive-window rule.
  let lastBreakAt = -Infinity;
  let breakCount = 0;

  for (let i = 0; i < length; i++) {
    let isBreak = false;
    let itemForBeat: PhonicsItem;

    if (i === 0) {
      // First beat: establish the pattern. Never a break.
      itemForBeat = items[patternIdx];
      runRemaining -= 1;
    } else {
      // Decide whether this beat is a break.
      // A break is eligible when:
      //   - the current run has finished (runRemaining <= 0), AND
      //   - no break has occurred in the last NO_CONSECUTIVE_WINDOW beats.
      const windowClear = i - lastBreakAt >= NO_CONSECUTIVE_WINDOW;
      const runExpired = runRemaining <= 0;

      // Target break rate is global. We bias the decision by how far we
      // are from the target so far.
      const observedRate = breakCount / i;
      const wantsBreak = observedRate < TARGET_BREAK_RATE;

      if (
        runExpired &&
        windowClear &&
        items.length > 1 &&
        (wantsBreak || rng() < TARGET_BREAK_RATE)
      ) {
        // Emit an oddball: pick a different item.
        isBreak = true;
        const oddballIdx = pickDifferent(items.length, patternIdx, rng);
        itemForBeat = items[oddballIdx];
        lastBreakAt = i;
        breakCount += 1;
        // After the break, commit to a NEW pattern phoneme (often the
        // oddball itself — the child's attention has been reset to it).
        patternIdx = oddballIdx;
        runRemaining = MIN_PATTERN_RUN + Math.floor(rng() * (MAX_PATTERN_RUN - MIN_PATTERN_RUN + 1));
        runRemaining -= 1; // count this beat against the new run
      } else {
        // Continue current pattern.
        if (runExpired) {
          // Run ended but we can't break yet — start a fresh run of the
          // same phoneme to stretch the pattern.
          runRemaining = MIN_PATTERN_RUN + Math.floor(rng() * (MAX_PATTERN_RUN - MIN_PATTERN_RUN + 1));
        }
        itemForBeat = items[patternIdx];
        runRemaining -= 1;
      }
    }

    events.push({
      item: itemForBeat,
      beatIndex: i,
      scheduledTime: i * beatPeriodSec,
      isBreak,
      durationMs,
    });
  }

  return events;
}

function pickDifferent(total: number, excludeIdx: number, rng: Rng): number {
  if (total <= 1) return excludeIdx;
  // Pick uniformly from the (total - 1) other indices.
  const offset = 1 + Math.floor(rng() * (total - 1));
  return (excludeIdx + offset) % total;
}

export function createBeatScheduler(): BeatScheduler {
  return {
    generate: (items, tempo, length) => generate(items, tempo, length),
  };
}
