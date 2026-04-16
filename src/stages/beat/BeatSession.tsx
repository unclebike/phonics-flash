import { useSignal } from '@preact/signals';
import { useEffect, useMemo, useRef } from 'preact/hooks';
import type { PhonicsItem } from '../../core/types';
import { createBeatClock, type BeatClock, type Tempo } from '../../audio/beat-clock';
import { createBeatScheduler, type BeatEvent } from '../../core/beat-scheduler';
import { computeORP } from '../../core/rsvp-engine';
import { Button } from '../../ui/components/Button';
import { Card } from '../../ui/components/Card';

// ---- Types ----

type Phase = 'ready' | 'playing' | 'paused' | 'judging' | 'complete';

export interface BeatSessionProps {
  items: PhonicsItem[];
  tempo: Tempo;
  length: number;
  /** Kept for interface compatibility; unused under ADR-007 teacher model. */
  requiredScore?: number;
  onBack?: () => void;
  onComplete?: (result: { passed: boolean; attempts: number }) => void;
  /** Testing seam: inject a custom clock. */
  clockFactory?: () => BeatClock;
}

// Flash duration — single pulse, NO chaining. PEAT-safe.
const FLASH_MS = 220;

// ---- Component ----

export function BeatSession({
  items,
  tempo,
  length,
  onBack,
  onComplete,
  clockFactory,
}: BeatSessionProps) {
  // Compute initial sequence synchronously so it's available on first render
  // (useEffect runs after render, which is too late for tests that fire beats
  // immediately after clicking Start).
  const initialSequence = useMemo(
    () => createBeatScheduler().generate(items, tempo, length),
    [items, tempo, length],
  );

  // Component-scoped signals — reset per instance.
  const phase = useSignal<Phase>('ready');
  const currentBeatIndex = useSignal(0);
  const sequence = useSignal<BeatEvent[]>(initialSequence);
  const attempts = useSignal(0);
  const passedFinal = useSignal(false);

  const clockRef = useRef<BeatClock | null>(null);
  const unsubRef = useRef<(() => void) | null>(null);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const arenaRef = useRef<HTMLDivElement | null>(null);
  const completeCalledRef = useRef(false);

  // --- Reset session state when props change (after first mount). ---
  useEffect(() => {
    sequence.value = initialSequence;
    phase.value = 'ready';
    currentBeatIndex.value = 0;
    attempts.value = 0;
    passedFinal.value = false;
    completeCalledRef.current = false;
  }, [initialSequence]);

  // --- Teardown on unmount. ---
  useEffect(() => {
    return () => {
      if (unsubRef.current) { unsubRef.current(); unsubRef.current = null; }
      if (clockRef.current) { clockRef.current.stop(); clockRef.current = null; }
      if (flashTimerRef.current) { clearTimeout(flashTimerRef.current); flashTimerRef.current = null; }
    };
  }, []);

  // --- Tab-blur pause. ---
  useEffect(() => {
    const onVis = () => {
      if (document.hidden && phase.value === 'playing') {
        clockRef.current?.pause();
        phase.value = 'paused';
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  // --- Start (first user gesture, unlocks AudioContext on iOS). ---
  const handleStart = () => {
    if (!clockRef.current) {
      clockRef.current = (clockFactory ?? createBeatClock)();
    }
    const clock = clockRef.current;

    if (unsubRef.current) unsubRef.current();
    unsubRef.current = clock.onBeat((beatIndex) => {
      onBeatFired(beatIndex);
    });

    attempts.value += 1;
    phase.value = 'playing';
    currentBeatIndex.value = 0;
    clock.start(tempo);
  };

  const onBeatFired = (beatIndex: number) => {
    const seq = sequence.value;
    if (beatIndex >= seq.length) {
      finishSequence();
      return;
    }
    currentBeatIndex.value = beatIndex;

    const event = seq[beatIndex];
    if (event.isBreak) triggerBreakFlash();
  };

  const triggerBreakFlash = () => {
    const el = arenaRef.current;
    if (!el) return;
    el.classList.add('beat-arena--break-flash');
    if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
    flashTimerRef.current = setTimeout(() => {
      el.classList.remove('beat-arena--break-flash');
    }, FLASH_MS);
  };

  // --- Sequence finished — hand over to teacher. ---
  const finishSequence = () => {
    if (unsubRef.current) { unsubRef.current(); unsubRef.current = null; }
    clockRef.current?.stop();
    phase.value = 'judging';
  };

  // --- Teacher: Correct → pass, unlock zone, go home. ---
  const handleCorrect = () => {
    if (completeCalledRef.current) return;
    completeCalledRef.current = true;
    passedFinal.value = true;
    phase.value = 'complete';
    onComplete?.({ passed: true, attempts: attempts.value });
  };

  // --- Teacher: Try again → restart from beat 0. ---
  const handleTryAgain = () => {
    phase.value = 'ready';
    currentBeatIndex.value = 0;
    completeCalledRef.current = false;
    // attempts.value is NOT reset — it increments next Start.
  };

  const handleResume = () => {
    clockRef.current?.resume();
    phase.value = 'playing';
  };

  const handleQuit = () => {
    clockRef.current?.stop();
    if (unsubRef.current) { unsubRef.current(); unsubRef.current = null; }
    phase.value = 'ready';
    if (onBack) onBack();
  };

  // ---- Render ----

  const p = phase.value;
  const seq = sequence.value;
  const total = seq.length;
  const idx = Math.min(currentBeatIndex.value, total - 1);
  const activeEvent: BeatEvent | null = total > 0 && p === 'playing' ? seq[idx] : null;
  const beatsRemaining = Math.max(0, total - idx - 1);

  // Ready overlay
  if (p === 'ready') {
    return (
      <div class="beat-session" role="main" aria-label="Beat mode ready">
        <div class="beat-overlay">
          <h1 class="beat-overlay__title">Boss Level</h1>
          <p class="beat-overlay__body">
            Watch the beat together. Say each sound out loud as it appears.
          </p>
          {attempts.value > 0 && (
            <p class="beat-overlay__body">
              <em>Try {attempts.value + 1}</em>
            </p>
          )}
          <div class="beat-overlay__actions">
            <Button variant="primary" onClick={handleStart}>
              {attempts.value === 0 ? 'Start' : 'Start again'}
            </Button>
            {onBack && (
              <Button variant="ghost" onClick={onBack}>
                Back
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Judging overlay — teacher decides pass/fail
  if (p === 'judging') {
    return (
      <div class="beat-session" role="main" aria-label="Teacher judgment">
        <div class="beat-overlay">
          <h1 class="beat-overlay__title">All done!</h1>
          <p class="beat-overlay__body">
            Did they make it through all the sounds?
          </p>
          <div class="beat-overlay__actions" aria-label="Teacher response">
            <Button variant="primary" onClick={handleCorrect}>
              Yes — correct
            </Button>
            <Button variant="ghost" onClick={handleTryAgain}>
              Try again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Complete overlay — after teacher confirms pass
  if (p === 'complete') {
    return (
      <div class="beat-session" role="main" aria-label="Beat mode complete">
        <div class="beat-overlay">
          <h1 class="beat-overlay__title">You beat the boss!</h1>
          <p class="beat-summary__result beat-summary__result--pass">
            Zone unlocked.
          </p>
          {attempts.value > 1 && (
            <p class="beat-overlay__body">
              <em>Took {attempts.value} tries — way to stick with it.</em>
            </p>
          )}
          <div class="beat-overlay__actions">
            <Button
              variant="primary"
              onClick={onBack ?? (() => { window.location.hash = '#/world'; })}
            >
              Back to the map
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Playing / paused
  const currentItem = activeEvent?.item ?? (total > 0 ? seq[idx].item : null);
  const orp = currentItem ? computeORP(currentItem.grapheme) : 0;

  return (
    <div class="beat-session" role="main" aria-label="Beat mode playing">
      <div
        ref={arenaRef}
        class="beat-arena"
        aria-label="Beat sequence in progress"
      >
        <div class="beat-arena__inner">
          {currentItem && (
            <Card
              grapheme={currentItem.grapheme}
              orpIndex={orp}
              isActive={p === 'playing'}
            />
          )}
          <p class="beat-arena__hint">
            {activeEvent?.isBreak ? 'New sound!' : 'Say it out loud'}
          </p>
        </div>
      </div>

      <div class="beat-footer">
        Beats remaining: {beatsRemaining}
      </div>

      {p === 'paused' && (
        <div class="beat-overlay" role="dialog" aria-label="Paused">
          <h2 class="beat-overlay__title">Paused</h2>
          <p class="beat-overlay__body">Take a breath. Ready when you are.</p>
          <div class="beat-overlay__actions">
            <Button variant="primary" onClick={handleResume}>
              Resume
            </Button>
            <Button variant="ghost" onClick={handleQuit}>
              Quit
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
