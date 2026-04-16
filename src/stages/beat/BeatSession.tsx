import { signal } from '@preact/signals';
import { useEffect, useRef } from 'preact/hooks';
import type { PhonicsItem } from '../../core/types';
import { createBeatClock, type BeatClock, type Tempo } from '../../audio/beat-clock';
import { createBeatScheduler, type BeatEvent } from '../../core/beat-scheduler';
import { computeORP } from '../../core/rsvp-engine';
import { Button } from '../../ui/components/Button';
import { Card } from '../../ui/components/Card';

// ---- Types ----

type Phase = 'ready' | 'playing' | 'paused' | 'complete';

export interface BeatSessionProps {
  items: PhonicsItem[];
  tempo: Tempo;
  length: number;
  requiredScore: number;
  onBack?: () => void;
  onComplete?: (result: { score: number; passed: boolean; bestCombo: number }) => void;
  /** Testing seam: inject a custom clock (otherwise a real Web Audio clock is created). */
  clockFactory?: () => BeatClock;
}

// ---- Module-level signals (stable across renders, reset on mount) ----

const phase = signal<Phase>('ready');
const currentBeatIndex = signal(0);
const score = signal(0);
const combo = signal(0);
const bestCombo = signal(0);
const misses = signal(0);
const sequence = signal<BeatEvent[]>([]);

// Tolerance window for tap hits around a break beat (seconds).
const TAP_TOLERANCE_SEC = 0.2;
// Flash duration — single pulse, NO chaining. PEAT-safe.
const FLASH_MS = 220;

// ---- Component ----

export function BeatSession({
  items,
  tempo,
  length,
  requiredScore,
  onBack,
  onComplete,
  clockFactory,
}: BeatSessionProps) {
  const clockRef = useRef<BeatClock | null>(null);
  const unsubRef = useRef<(() => void) | null>(null);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const missFlashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const arenaRef = useRef<HTMLDivElement | null>(null);

  // Tracks whether the current break beat has already been tapped.
  // Cleared each time we advance to a new beat.
  const breakTappedRef = useRef(false);
  // Absolute audio time when the current break beat fired; used for the
  // "miss — break passed without tap" detection via rAF sweep.
  const currentBreakFiredAtRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  const completeCalledRef = useRef(false);

  // --- Setup: reset session state on mount / items change. ---
  useEffect(() => {
    const scheduler = createBeatScheduler();
    sequence.value = scheduler.generate(items, tempo, length);
    phase.value = 'ready';
    currentBeatIndex.value = 0;
    score.value = 0;
    combo.value = 0;
    bestCombo.value = 0;
    misses.value = 0;
    breakTappedRef.current = false;
    currentBreakFiredAtRef.current = null;
    completeCalledRef.current = false;
  }, [items, tempo, length]);

  // --- Teardown on unmount. ---
  useEffect(() => {
    return () => {
      if (unsubRef.current) { unsubRef.current(); unsubRef.current = null; }
      if (clockRef.current) { clockRef.current.stop(); clockRef.current = null; }
      if (flashTimerRef.current) { clearTimeout(flashTimerRef.current); flashTimerRef.current = null; }
      if (missFlashTimerRef.current) { clearTimeout(missFlashTimerRef.current); missFlashTimerRef.current = null; }
      if (rafRef.current != null) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
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

  // --- rAF sweep to catch "miss — break beat passed without tap". ---
  useEffect(() => {
    if (phase.value !== 'playing') {
      if (rafRef.current != null) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
      return;
    }
    const clock = clockRef.current;
    if (!clock) return;

    const tick = () => {
      const firedAt = currentBreakFiredAtRef.current;
      if (firedAt != null && !breakTappedRef.current) {
        const now = clock.getAudioTime();
        if (now - firedAt > TAP_TOLERANCE_SEC) {
          // Miss: break beat expired without a tap. No harsh feedback — just reset combo.
          combo.value = 0;
          misses.value += 1;
          currentBreakFiredAtRef.current = null;
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current != null) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    };
  }, [phase.value]);

  // --- Start (first user gesture, unlocks AudioContext on iOS). ---
  const handleStart = () => {
    if (!clockRef.current) {
      clockRef.current = (clockFactory ?? createBeatClock)();
    }
    const clock = clockRef.current;

    // Subscribe fresh (discard any prior subscription).
    if (unsubRef.current) unsubRef.current();
    unsubRef.current = clock.onBeat((beatIndex) => {
      onBeatFired(beatIndex);
    });

    phase.value = 'playing';
    currentBeatIndex.value = 0;
    clock.start(tempo);
  };

  // --- On each beat fired by the clock. ---
  const onBeatFired = (beatIndex: number) => {
    const seq = sequence.value;
    if (beatIndex >= seq.length) {
      // Sequence done.
      finishSession();
      return;
    }

    currentBeatIndex.value = beatIndex;
    breakTappedRef.current = false;

    const event = seq[beatIndex];
    if (event.isBreak) {
      const clock = clockRef.current;
      currentBreakFiredAtRef.current = clock ? clock.getAudioTime() : 0;
      triggerBreakFlash();
    } else {
      currentBreakFiredAtRef.current = null;
    }
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

  const triggerMissFlash = () => {
    const el = arenaRef.current;
    if (!el) return;
    el.classList.add('beat-arena--miss-flash');
    if (missFlashTimerRef.current) clearTimeout(missFlashTimerRef.current);
    missFlashTimerRef.current = setTimeout(() => {
      el.classList.remove('beat-arena--miss-flash');
    }, FLASH_MS);
  };

  // --- Tap handling. ---
  const handleArenaTap = () => {
    if (phase.value !== 'playing') return;
    const clock = clockRef.current;
    if (!clock) return;

    const firedAt = currentBreakFiredAtRef.current;
    const now = clock.getAudioTime();

    if (firedAt != null && !breakTappedRef.current && (now - firedAt) <= TAP_TOLERANCE_SEC) {
      // Hit!
      breakTappedRef.current = true;
      currentBreakFiredAtRef.current = null;
      score.value += 1;
      combo.value += 1;
      if (combo.value > bestCombo.value) bestCombo.value = combo.value;
    } else {
      // False tap or outside window: reset combo, gentle miss flash.
      combo.value = 0;
      misses.value += 1;
      triggerMissFlash();
    }
  };

  const finishSession = () => {
    if (completeCalledRef.current) return;
    completeCalledRef.current = true;
    if (unsubRef.current) { unsubRef.current(); unsubRef.current = null; }
    clockRef.current?.stop();
    phase.value = 'complete';
    const passed = score.value >= requiredScore;
    onComplete?.({ score: score.value, passed, bestCombo: bestCombo.value });
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
            Watch the beat. When the arena flashes, tap anywhere as fast as you can!
          </p>
          <p class="beat-overlay__body">
            Hit <strong>{requiredScore}</strong> to win.
          </p>
          <div class="beat-overlay__actions">
            <Button variant="primary" onClick={handleStart}>
              Start
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

  // Complete overlay
  if (p === 'complete') {
    const passed = score.value >= requiredScore;
    return (
      <div class="beat-session" role="main" aria-label="Beat mode complete">
        <div class="beat-overlay">
          <h1 class="beat-overlay__title">
            {passed ? 'You beat the boss!' : 'So close!'}
          </h1>
          <p
            class={`beat-summary__result ${
              passed ? 'beat-summary__result--pass' : 'beat-summary__result--fail'
            }`}
          >
            {passed ? 'Zone unlocked.' : `You needed ${requiredScore} to pass.`}
          </p>
          <div class="beat-summary__stats">
            <div class="beat-summary__stat">
              <span class="beat-summary__stat-value">{score.value}</span>
              <span class="beat-summary__stat-label">Hits</span>
            </div>
            <div class="beat-summary__stat">
              <span class="beat-summary__stat-value">{bestCombo.value}</span>
              <span class="beat-summary__stat-label">Best combo</span>
            </div>
            <div class="beat-summary__stat">
              <span class="beat-summary__stat-value">{misses.value}</span>
              <span class="beat-summary__stat-label">Misses</span>
            </div>
          </div>
          <div class="beat-overlay__actions">
            <Button variant="primary" onClick={onBack ?? (() => { window.location.hash = '#/world'; })}>
              Back to world
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Playing / paused — shared arena scaffolding.
  const currentItem = activeEvent?.item ?? (total > 0 ? seq[idx].item : null);
  const orp = currentItem ? computeORP(currentItem.grapheme) : 0;

  return (
    <div class="beat-session" role="main" aria-label="Beat mode playing">
      <div class="beat-hud" aria-hidden="false">
        <div class="beat-hud__score" aria-live="polite">
          <span class="beat-hud__label">Score</span>
          {score.value}
        </div>
        <div
          class={`beat-hud__combo ${combo.value >= 3 ? 'beat-hud__combo--hot' : ''}`}
          aria-live="polite"
        >
          <span class="beat-hud__label">Combo</span>
          {combo.value}
        </div>
      </div>

      <div
        ref={arenaRef}
        class="beat-arena"
        role="button"
        tabIndex={0}
        aria-label="Tap on pattern-break beats"
        onClick={handleArenaTap}
        onKeyDown={(e) => {
          if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            handleArenaTap();
          }
        }}
      >
        <div class="beat-arena__inner">
          {currentItem && (
            <Card
              grapheme={currentItem.grapheme}
              orpIndex={orp}
              isActive={p === 'playing'}
            />
          )}
          <p
            class={`beat-arena__hint ${
              activeEvent?.isBreak ? 'beat-arena__hint--break' : ''
            }`}
          >
            {activeEvent?.isBreak ? 'Tap now!' : 'Watch the beat...'}
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
