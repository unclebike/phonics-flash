/**
 * Boss Session — a timed flash-and-mask gauntlet through a zone's list.
 *
 * Under ADR-010, Boss Mode retires the BPM/pattern-break rhythm game
 * and adopts the drill's flash-and-mask interaction vocabulary. The
 * Boss is simply a drill that:
 *   - has a fixed shuffled list (the zone's phonemes)
 *   - doesn't cycle — after the last flash it hands off to teacher judgment
 *   - uses a harder default flash duration than the Teacher Panel baseline
 *
 * Reuses drill.css for the visual layer.
 */

import { useSignal } from '@preact/signals';
import { useEffect, useRef } from 'preact/hooks';
import type { Tempo } from '../../audio/beat-clock';
import { Button } from '../../ui/components/Button';
import { rollOffset } from '../teacher/config';

type Phase = 'ready' | 'flashing' | 'judging' | 'complete';

export interface BossSessionProps {
  /** Zone display name shown in the header. */
  zoneName: string;
  /** Words / phonemes to flash. Shuffled once on mount. */
  items: string[];
  /** Controls flash duration. slow=500ms, medium=300ms, fast=180ms. */
  tempo: Tempo;
  /** Override the default tempo-derived position variance (ADR-011).
   *  0 = centered letters. 100 = max safe random offset per flash. */
  positionVariance?: number;
  /** Fires when the teacher marks the run correct. */
  onPass?: (result: { attempts: number }) => void;
  /** Fires when the teacher or child exits. */
  onBack?: () => void;
}

const TEMPO_MS: Record<Tempo, number> = {
  slow: 500,
  medium: 300,
  fast: 180,
};

/** Default position variance by tempo (ADR-011). Harder tempos get more spread. */
const TEMPO_VARIANCE: Record<Tempo, number> = {
  slow: 0,
  medium: 40,
  fast: 80,
};

function shuffleCopy<T>(arr: T[]): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function BossSession({ zoneName, items, tempo, positionVariance, onPass, onBack }: BossSessionProps) {
  const phase = useSignal<Phase>('ready');
  const sequence = useSignal<string[]>(shuffleCopy(items));
  const index = useSignal(0);
  const attempts = useSignal(0);
  const offset = useSignal<{ ox: number; oy: number }>({ ox: 0, oy: 0 });

  const maskTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const passCalledRef = useRef(false);

  const flashMs = TEMPO_MS[tempo];
  const variance = positionVariance ?? TEMPO_VARIANCE[tempo];

  // Reset when inputs change.
  useEffect(() => {
    sequence.value = shuffleCopy(items);
    index.value = 0;
    phase.value = 'ready';
    attempts.value = 0;
    passCalledRef.current = false;
    return () => {
      if (maskTimerRef.current) clearTimeout(maskTimerRef.current);
    };
  }, [items, tempo]);

  // Keyboard: Space or Enter advances; Escape exits.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        advance();
      } else if (e.key === 'Escape') {
        onBack?.();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const startGauntlet = () => {
    attempts.value = attempts.value + 1;
    index.value = 0;
    sequence.value = shuffleCopy(items);
    phase.value = 'flashing';
    flashCurrent();
  };

  const flashCurrent = () => {
    // Roll offset for this flash (ADR-011).
    offset.value = rollOffset(variance);
    if (maskTimerRef.current) clearTimeout(maskTimerRef.current);
    maskTimerRef.current = setTimeout(() => {
      // Mask returns. If we were on the last item, hand to judging.
      const next = index.value + 1;
      if (next >= sequence.value.length) {
        phase.value = 'judging';
      } else {
        index.value = next;
        // Stay in 'ready' state — teacher or child has to tap for the next flash.
        phase.value = 'ready';
      }
    }, flashMs);
  };

  /** Handle a tap/space anywhere: advances flash or starts if ready. */
  const advance = () => {
    const p = phase.value;
    if (p === 'ready') {
      if (index.value === 0 && attempts.value === 0) {
        startGauntlet();
      } else {
        // Mid-gauntlet: already past first, so continue to next flash.
        phase.value = 'flashing';
        flashCurrent();
      }
    }
    // During 'flashing', ignore taps (the timer advances for us).
    // During 'judging' or 'complete', taps do nothing here — user must click the explicit buttons.
  };

  const handleTryAgain = () => {
    index.value = 0;
    phase.value = 'ready';
    passCalledRef.current = false;
    // attempts increments on next startGauntlet
  };

  const handleCorrect = () => {
    if (passCalledRef.current) return;
    passCalledRef.current = true;
    phase.value = 'complete';
    onPass?.({ attempts: attempts.value });
  };

  const handleExit = () => {
    onBack?.();
  };

  const p = phase.value;
  const total = sequence.value.length;
  const shown = p === 'flashing' ? index.value + 1 : Math.min(index.value, total);
  const currentWord = sequence.value[Math.min(index.value, total - 1)] ?? '';

  // Ready overlay — only shown before first tap of the first attempt.
  if (p === 'ready' && index.value === 0 && attempts.value === 0) {
    return (
      <main class="drill drill--masked" role="main" aria-label="Boss level ready">
        <div class="drill__zone-label" aria-live="polite">
          <span class="drill__zone-label-prefix">Boss:</span>
          <span class="drill__zone-label-name">{zoneName}</span>
        </div>

        <div class="drill__stage">
          <div class="drill__ready">
            <span class="drill__ready-title">Boss Level</span>
            <span class="drill__ready-prompt">
              {total} sounds. Tap or press Space to begin.
            </span>
          </div>
        </div>

        <nav class="drill__corner" aria-label="Session controls">
          <button
            type="button"
            class="drill__corner-btn drill__corner-btn--boss"
            onClick={() => startGauntlet()}
          >
            Start
          </button>
          <button
            type="button"
            class="drill__corner-btn"
            onClick={handleExit}
          >
            Back
          </button>
        </nav>
      </main>
    );
  }

  // Judging overlay — teacher decides pass/fail.
  if (p === 'judging') {
    return (
      <main class="drill drill--masked" role="main" aria-label="Boss judgment">
        <div class="drill__zone-label">
          <span class="drill__zone-label-prefix">Boss:</span>
          <span class="drill__zone-label-name">{zoneName}</span>
        </div>
        <div class="boss-judge">
          <h1 class="boss-judge__title">All done!</h1>
          <p class="boss-judge__body">Did they make it through all the sounds?</p>
          <div class="boss-judge__actions">
            <Button variant="primary" onClick={handleCorrect}>
              Yes — correct
            </Button>
            <Button variant="ghost" onClick={handleTryAgain}>
              Try again
            </Button>
          </div>
        </div>
      </main>
    );
  }

  // Complete overlay — after teacher confirms pass.
  if (p === 'complete') {
    return (
      <main class="drill drill--masked" role="main" aria-label="Boss complete">
        <div class="boss-judge">
          <h1 class="boss-judge__title">You beat the boss!</h1>
          <p class="boss-judge__body boss-judge__body--pass">
            Zone unlocked.
          </p>
          {attempts.value > 1 && (
            <p class="boss-judge__body">
              <em>Took {attempts.value} tries — way to stick with it.</em>
            </p>
          )}
          <div class="boss-judge__actions">
            <Button variant="primary" onClick={handleExit}>
              Back to the map
            </Button>
          </div>
        </div>
      </main>
    );
  }

  // Mid-gauntlet (flashing or between flashes).
  const isFlashing = p === 'flashing';

  return (
    <main
      class={`drill ${isFlashing ? 'drill--flashing' : 'drill--masked'}`}
      role="main"
      aria-label="Boss gauntlet"
      tabIndex={0}
      onClick={() => advance()}
    >
      <div class="drill__zone-label">
        <span class="drill__zone-label-prefix">Boss:</span>
        <span class="drill__zone-label-name">{zoneName}</span>
      </div>

      <nav class="drill__corner" aria-label="Session controls">
        <button
          type="button"
          class="drill__corner-btn"
          onClick={(e) => { e.stopPropagation(); handleTryAgain(); }}
          title="Restart from the first sound"
        >
          Restart
        </button>
        <button
          type="button"
          class="drill__corner-btn"
          onClick={(e) => { e.stopPropagation(); handleExit(); }}
        >
          Quit
        </button>
      </nav>

      <div class="drill__stage">
        {isFlashing ? (
          <span
            class="drill__word"
            style={{
              ['--drill-ox' as any]: String(offset.value.ox),
              ['--drill-oy' as any]: String(offset.value.oy),
            }}
          >
            {currentWord}
          </span>
        ) : (
          <div class="drill__ready">
            <span class="drill__ready-title">Next</span>
            <span class="drill__ready-prompt">Tap or press Space</span>
          </div>
        )}
      </div>

      <div class="drill__footer" aria-live="polite">
        <span class="drill__footer-label">
          {shown} of {total}
        </span>
      </div>
    </main>
  );
}
