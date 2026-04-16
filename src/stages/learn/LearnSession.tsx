import { signal } from '@preact/signals';
import { useEffect, useRef } from 'preact/hooks';
import type { PhonicsItem, Scheduled } from '../../core/types';
import { schedule } from '../../core/rsvp-engine';
import { createPersistenceAdapter } from '../../engine/persistence';
import { Card } from '../../ui/components/Card';
import { Button } from '../../ui/components/Button';
import { Sparkle } from '../../ui/components/Sparkle';

// ---- Types ----

type Phase = 'showing' | 'responding' | 'feedback' | 'complete';

// ---- Props ----

export interface LearnSessionProps {
  items: PhonicsItem[];
  onBack?: () => void;
  onReplay?: () => void;
}

// Module-level signals — stable across renders
const sessionItems = signal<Scheduled[]>([]);
const currentIndex = signal(0);
const phase = signal<Phase>('showing');
const score = signal(0);
const streak = signal(0);
const bestStreak = signal(0);
const feedbackCorrect = signal(false);
const showHelp = signal(false);

const persistence = createPersistenceAdapter();

// ---- Component ----

export function LearnSession({ items, onBack, onReplay }: LearnSessionProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
  };

  // Initialize session
  useEffect(() => {
    if (items.length === 0) return;

    sessionItems.value = schedule(items, {
      baseWpm: 100,
      sessionLength: Math.min(10, items.length * 2),
      includeReview: false,
    });
    currentIndex.value = 0;
    phase.value = 'showing';
    score.value = 0;
    streak.value = 0;
    bestStreak.value = 0;
    feedbackCorrect.value = false;
    showHelp.value = false;
  }, [items]);

  // Timer for 'showing' phase auto-transition
  useEffect(() => {
    if (phase.value !== 'showing') return;

    const idx = currentIndex.value;
    const item = idx < sessionItems.value.length ? sessionItems.value[idx] : null;
    if (!item) return;

    const displayMs = Math.max(item.durationMs, 1200);

    timerRef.current = setTimeout(() => {
      phase.value = 'responding';
    }, displayMs);

    return clearTimer;
  }, [phase.value, currentIndex.value]);

  // Cleanup on unmount
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
    } else {
      currentIndex.value = nextIndex;
      phase.value = 'showing';
      feedbackCorrect.value = false;
      showHelp.value = false;
    }
  };

  const handleKnowIt = () => {
    const item = getCurrentItem();
    if (!item) return;

    persistence.updateProgress(item.item.id, { correct: true, timestamp: Date.now() });

    score.value += 1;
    streak.value += 1;
    bestStreak.value = Math.max(bestStreak.value, streak.value);
    feedbackCorrect.value = true;
    showHelp.value = false;
    phase.value = 'feedback';

    clearTimer();
    timerRef.current = setTimeout(advanceToNext, 800);
  };

  const handleHelpMe = () => { showHelp.value = true; };

  const handleTryAgain = () => {
    const item = getCurrentItem();
    if (!item) return;

    persistence.updateProgress(item.item.id, { correct: false, timestamp: Date.now() });

    feedbackCorrect.value = false;
    showHelp.value = false;
    streak.value = 0;
    phase.value = 'feedback';

    clearTimer();
    timerRef.current = setTimeout(advanceToNext, 1500);
  };

  const handlePlayAgain = () => {
    if (onReplay) { onReplay(); return; }
    sessionItems.value = schedule(items, {
      baseWpm: 100,
      sessionLength: Math.min(10, items.length * 2),
      includeReview: false,
    });
    currentIndex.value = 0;
    phase.value = 'showing';
    score.value = 0;
    streak.value = 0;
    bestStreak.value = 0;
    feedbackCorrect.value = false;
    showHelp.value = false;
  };

  const handleBackToMap = () => {
    if (onBack) { onBack(); } else { window.location.hash = '#/'; }
  };

  // ---- Render ----

  const p = phase.value;
  const idx = currentIndex.value;
  const total = sessionItems.value.length;
  const item = idx < total ? sessionItems.value[idx] : null;

  // Complete screen
  if (p === 'complete') {
    const stars = Math.min(5, Math.floor(score.value / 2));
    return (
      <div class="learn-session" role="main" aria-label="Session complete">
        <div class="learn-summary">
          <h1 class="learn-summary__title">Great job!</h1>

          <div class="learn-summary__stars" aria-label={`${stars} out of 5 stars`}>
            {Array.from({ length: 5 }, (_, i) => (
              <span
                key={i}
                class={`learn-summary__star ${i < stars ? 'learn-summary__star--earned' : ''}`}
                aria-hidden="true"
              >
                &#9733;
              </span>
            ))}
          </div>

          <p class="learn-summary__score">
            You got {score.value} out of {total} correct!
          </p>

          {bestStreak.value > 1 && (
            <p class="learn-summary__streak">
              Best streak: {bestStreak.value} in a row!
            </p>
          )}

          <div class="learn-summary__actions">
            <Button variant="primary" onClick={handlePlayAgain}>
              Play again
            </Button>
            <Button variant="ghost" onClick={handleBackToMap}>
              Back to home
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
      <div class="learn-progress" role="progressbar"
        aria-valuenow={Math.round(progressPct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Progress: ${idx + 1} of ${total}`}
      >
        <div
          class="learn-progress__fill"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Counter */}
      <div class="learn-counter">
        {idx + 1} / {total}
      </div>

      {/* Card area — fixed position, no layout shift */}
      <div class="learn-card-area">
        <div class="learn-card-wrapper" style={{ position: 'relative' }}>
          <Card
            grapheme={item.item.grapheme}
            orpIndex={item.orpIndex}
            isActive={p === 'showing'}
          >
            {p === 'showing' && (
              <p class="learn-prompt">Say it out loud!</p>
            )}

            {p === 'feedback' && feedbackCorrect.value && (
              <p class="learn-prompt learn-prompt--success">
                That's right!
              </p>
            )}

            {p === 'feedback' && !feedbackCorrect.value && (
              <div class="learn-help-content">
                <p class="learn-prompt learn-prompt--gentle">
                  This says <strong>{item.item.phoneme}</strong>
                </p>
                <p class="learn-examples">
                  Like in: {item.item.exampleWords.slice(0, 3).join(', ')}
                </p>
              </div>
            )}
          </Card>

          {/* Sparkle overlay on correct feedback */}
          <Sparkle
            active={p === 'feedback' && feedbackCorrect.value}
          />
        </div>

        {/* Help content shown during responding phase */}
        {p === 'responding' && showHelp.value && (
          <div class="learn-help-panel" aria-live="polite">
            <p class="learn-help-panel__phoneme">
              This letter says <strong>{item.item.phoneme}</strong>
            </p>
            <p class="learn-help-panel__examples">
              Like in: {item.item.exampleWords.slice(0, 3).join(', ')}
            </p>
            <Button variant="secondary" size="md" onClick={handleTryAgain}>
              Got it, next one
            </Button>
          </div>
        )}
      </div>

      {/* Response buttons — only in responding phase and not showing help */}
      {p === 'responding' && !showHelp.value && (
        <div class="learn-actions" aria-label="Response buttons">
          <Button variant="primary" onClick={handleKnowIt}>
            I know it!
          </Button>
          <Button variant="ghost" onClick={handleHelpMe}>
            Help me
          </Button>
        </div>
      )}

      {/* Streak indicator */}
      {streak.value >= 2 && (
        <div class="learn-streak" aria-live="polite">
          {streak.value} in a row!
        </div>
      )}
    </div>
  );
}
