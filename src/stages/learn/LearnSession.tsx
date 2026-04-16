import { useSignal } from '@preact/signals';
import { useEffect, useRef } from 'preact/hooks';
import type { PhonicsItem, Scheduled } from '../../core/types';
import { schedule } from '../../core/rsvp-engine';
import { createPersistenceAdapter } from '../../engine/persistence';
import { Card } from '../../ui/components/Card';
import { Button } from '../../ui/components/Button';
import { Sparkle } from '../../ui/components/Sparkle';

// ---- Types ----

type Phase = 'showing' | 'judging' | 'feedback' | 'restarting' | 'complete';

// ---- Props ----

export interface LearnSessionProps {
  items: PhonicsItem[];
  onBack?: () => void;
  onReplay?: () => void;
  /** Optional: teacher bypass for testing — auto-pass a card */
  onPassComplete?: () => void;
}

const persistence = createPersistenceAdapter();

function buildSession(items: PhonicsItem[]): Scheduled[] {
  return schedule(items, {
    baseWpm: 100,
    sessionLength: Math.min(10, items.length * 2),
    includeReview: false,
  });
}

// ---- Component ----

export function LearnSession({ items, onBack, onReplay, onPassComplete }: LearnSessionProps) {
  // Component-scoped signals — reset per instance.
  const sessionItems = useSignal<Scheduled[]>([]);
  const currentIndex = useSignal(0);
  const phase = useSignal<Phase>('showing');
  const feedbackCorrect = useSignal(false);
  const restartCount = useSignal(0);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
  };

  // Initialize session
  useEffect(() => {
    if (items.length === 0) return;
    sessionItems.value = buildSession(items);
    currentIndex.value = 0;
    phase.value = 'showing';
    feedbackCorrect.value = false;
    restartCount.value = 0;
  }, [items]);

  // Timer for 'showing' phase auto-transition to 'judging'
  useEffect(() => {
    if (phase.value !== 'showing') return;
    const idx = currentIndex.value;
    const item = idx < sessionItems.value.length ? sessionItems.value[idx] : null;
    if (!item) return;

    const displayMs = Math.max(item.durationMs, 1200);
    timerRef.current = setTimeout(() => { phase.value = 'judging'; }, displayMs);
    return clearTimer;
  }, [phase.value, currentIndex.value]);

  // Cleanup
  useEffect(() => clearTimer, []);

  const getCurrentItem = () => {
    const idx = currentIndex.value;
    return idx < sessionItems.value.length ? sessionItems.value[idx] : null;
  };

  const advanceToNext = () => {
    const nextIndex = currentIndex.value + 1;
    if (nextIndex >= sessionItems.value.length) {
      phase.value = 'complete';
      currentIndex.value = nextIndex;

      // Mastery persists only if session completed cleanly (no restart).
      if (restartCount.value === 0) {
        sessionItems.value.forEach((s) => {
          persistence.updateProgress(s.item.id, { correct: true, timestamp: Date.now() });
        });
      }

      if (onPassComplete) onPassComplete();
    } else {
      currentIndex.value = nextIndex;
      phase.value = 'showing';
      feedbackCorrect.value = false;
    }
  };

  const handleCorrect = () => {
    const item = getCurrentItem();
    if (!item) return;

    feedbackCorrect.value = true;
    phase.value = 'feedback';

    clearTimer();
    timerRef.current = setTimeout(advanceToNext, 800);
  };

  const handleTryAgain = () => {
    // Per ADR-007: restart the whole session.
    const item = getCurrentItem();
    if (item) {
      persistence.updateProgress(item.item.id, { correct: false, timestamp: Date.now() });
    }

    restartCount.value += 1;
    feedbackCorrect.value = false;
    phase.value = 'restarting';

    clearTimer();
    timerRef.current = setTimeout(() => {
      sessionItems.value = buildSession(items);
      currentIndex.value = 0;
      phase.value = 'showing';
      feedbackCorrect.value = false;
    }, 1800);
  };

  const handlePlayAgain = () => {
    if (onReplay) { onReplay(); return; }
    sessionItems.value = buildSession(items);
    currentIndex.value = 0;
    phase.value = 'showing';
    feedbackCorrect.value = false;
    restartCount.value = 0;
  };

  const handleBackToMap = () => {
    if (onBack) onBack(); else window.location.hash = '#/world';
  };

  // ---- Render ----

  const p = phase.value;
  const idx = currentIndex.value;
  const total = sessionItems.value.length;
  const item = idx < total ? sessionItems.value[idx] : null;

  // Restarting overlay
  if (p === 'restarting') {
    return (
      <div class="learn-session" role="main" aria-label="Restarting session">
        <div class="learn-summary">
          <h1 class="learn-summary__title">Great try!</h1>
          <p class="learn-summary__score">Let's start from the beginning.</p>
        </div>
      </div>
    );
  }

  // Complete screen — no stars, no numeric scoring (ADR-007)
  if (p === 'complete') {
    return (
      <div class="learn-session" role="main" aria-label="Session complete">
        <div class="learn-summary">
          <h1 class="learn-summary__title">You did it!</h1>
          <p class="learn-summary__score">
            All {total} sounds, all the way through.
          </p>
          <div class="learn-summary__actions">
            <Button variant="primary" onClick={handlePlayAgain}>
              Play again
            </Button>
            <Button variant="ghost" onClick={handleBackToMap}>
              Back to the map
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!item) return null;

  const progressPct = total > 0 ? (idx / total) * 100 : 0;

  return (
    <div class="learn-session" role="main" aria-label="Learn mode session">
      {/* Progress bar */}
      <div
        class="learn-progress"
        role="progressbar"
        aria-valuenow={Math.round(progressPct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Progress: ${idx + 1} of ${total}`}
      >
        <div class="learn-progress__fill" style={{ width: `${progressPct}%` }} />
      </div>

      <div class="learn-counter">
        {idx + 1} / {total}
      </div>

      {/* Card area */}
      <div class="learn-card-area">
        <div class="learn-card-wrapper" style={{ position: 'relative' }}>
          <Card
            grapheme={item.item.grapheme}
            orpIndex={item.orpIndex}
            isActive={p === 'showing' || p === 'judging'}
          >
            {p === 'showing' && (
              <p class="learn-prompt">Say the sound out loud</p>
            )}
            {p === 'judging' && (
              <p class="learn-prompt">
                Sound: <strong>{item.item.phoneme}</strong>
              </p>
            )}
            {p === 'feedback' && feedbackCorrect.value && (
              <p class="learn-prompt learn-prompt--success">That's right!</p>
            )}
          </Card>

          <Sparkle active={p === 'feedback' && feedbackCorrect.value} />
        </div>
      </div>

      {/* Teacher-facing response buttons, only during 'judging' */}
      {p === 'judging' && (
        <div class="learn-actions" aria-label="Teacher response">
          <Button variant="primary" onClick={handleCorrect}>
            Correct
          </Button>
          <Button variant="ghost" onClick={handleTryAgain}>
            Try again
          </Button>
        </div>
      )}
    </div>
  );
}
