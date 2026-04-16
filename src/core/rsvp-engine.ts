import type {
  PhonicsItem,
  ScheduleOpts,
  Scheduled,
  RsvpEngine,
} from './types';
import { DIGRAPHS, TRIGRAPHS } from './types';

/**
 * Compute Optimal Recognition Point (ORP) for a word.
 *
 * ORP formula:
 *   n <= 4: position = floor(n / 3), minimum 0
 *   n >= 5: position = floor(n / 2) - 1
 */
export function computeORP(word: string): number {
  const n = word.length;
  if (n === 0) return 0;
  if (n <= 4) {
    return Math.max(0, Math.floor(n / 3));
  }
  return Math.floor(n / 2) - 1;
}

/**
 * Check if a grapheme is a digraph or trigraph.
 */
function isDigraphOrTrigraph(grapheme: string): boolean {
  const lower = grapheme.toLowerCase();
  return TRIGRAPHS.has(lower) || DIGRAPHS.has(lower);
}

/**
 * Compute display duration for a PhonicsItem.
 *
 * Duration rules (non-negotiable):
 *   1. Base duration = 60000 / WPM ms
 *   2. Words 5+ letters: multiply by 1.35x
 *   3. Digraphs/trigraphs: multiply by 1.5x
 *   4. Previously incorrect in-session: multiply by 1.2x (handled by caller via incorrectIds)
 *   5. After punctuation/boundary: insert full beat pause (handled at schedule level)
 *   6. NEVER flat WPM — variable timing always
 */
export function durationFor(
  item: PhonicsItem,
  baseWpm: number,
  incorrectIds?: Set<string>,
): number {
  // Rule 1: base duration
  let duration = 60000 / baseWpm;

  // Rule 2: long graphemes get more time
  if (item.grapheme.length >= 5) {
    duration *= 1.35;
  }

  // Rule 3: digraphs/trigraphs need extra processing time
  if (isDigraphOrTrigraph(item.grapheme)) {
    duration *= 1.5;
  }

  // Rule 4: previously incorrect items linger
  if (incorrectIds && incorrectIds.has(item.id)) {
    duration *= 1.2;
  }

  return Math.round(duration);
}

/**
 * Schedule items for an RSVP session.
 *
 * Implements spaced-repetition-lite: recently incorrect items
 * reappear 3-5 items later. Items are never shown at flat WPM.
 */
export function schedule(
  items: PhonicsItem[],
  opts: ScheduleOpts,
  incorrectIds?: Set<string>,
): Scheduled[] {
  const { baseWpm, sessionLength, includeReview } = opts;

  if (items.length === 0) return [];

  const result: Scheduled[] = [];
  const incorrects = incorrectIds ?? new Set<string>();

  // Split items into new and review pools
  const newItems = [...items];
  const reviewItems: PhonicsItem[] = [];

  // Build the schedule
  let newIndex = 0;
  const reinsertQueue: Array<{ item: PhonicsItem; insertAfter: number }> = [];

  for (let i = 0; i < sessionLength; i++) {
    let selectedItem: PhonicsItem | undefined;
    let isReview = false;

    // Check if any reinsert items are due
    const dueReinsert = reinsertQueue.findIndex((r) => r.insertAfter <= i);
    if (dueReinsert >= 0) {
      selectedItem = reinsertQueue[dueReinsert].item;
      reinsertQueue.splice(dueReinsert, 1);
      isReview = true;
    }
    // Mix in review items periodically (every 3rd item if available)
    else if (
      includeReview &&
      reviewItems.length > 0 &&
      i % 3 === 2
    ) {
      selectedItem = reviewItems.shift();
      isReview = true;
    }
    // Otherwise take next new item
    else if (newIndex < newItems.length) {
      selectedItem = newItems[newIndex++];
      isReview = false;
    }
    // Fallback: cycle through items if we run out
    else {
      selectedItem = items[i % items.length];
      isReview = true;
    }

    if (!selectedItem) continue;

    const duration = durationFor(selectedItem, baseWpm, incorrects);
    const orpIndex = computeORP(selectedItem.grapheme);

    result.push({
      item: selectedItem,
      durationMs: duration,
      orpIndex,
      isReview,
    });

    // If this item was previously incorrect, schedule a reappearance 3-5 items later
    if (incorrects.has(selectedItem.id)) {
      const reinsertAt = i + 3 + Math.floor(Math.random() * 3); // 3-5 items later
      if (reinsertAt < sessionLength) {
        reinsertQueue.push({ item: selectedItem, insertAfter: reinsertAt });
      }
    }

    // Move used items to review pool for potential reuse
    if (!isReview && includeReview) {
      reviewItems.push(selectedItem);
    }
  }

  return result;
}

/**
 * Create an RsvpEngine instance.
 */
export function createRsvpEngine(): RsvpEngine {
  return {
    schedule: (items, opts) => schedule(items, opts),
    computeORP,
    durationFor: (item, baseWpm) => durationFor(item, baseWpm),
  };
}
