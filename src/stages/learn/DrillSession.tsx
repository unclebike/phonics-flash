/**
 * Flash-and-Mask Drill — the core pedagogical interaction.
 *
 * Neutral mask screen by default. Tap / click / Space / Enter triggers a
 * brief flash of one word. Mask returns. No per-card judgment during the
 * drill — the teacher paces it and makes calls verbally.
 *
 * Under ADR-008: this replaces the presentation-and-reveal model.
 * Under ADR-009: accepts an optional zoneId prop that loads that zone's
 * phonemes as a per-session list override (without mutating the
 * teacher's saved localStorage config).
 */

import { useSignal } from '@preact/signals';
import { useEffect, useRef } from 'preact/hooks';
import { computeORP, durationFor } from '../../core/rsvp-engine';
import { loadConfig, parseList, type TeacherConfig } from '../teacher/config';
import { CONTENT_MANIFEST } from '../../content/manifest';
import { PHONICS_DATA } from '../../content/phonics';

export interface DrillSessionProps {
  /** When set, loads that zone's phonemes from the manifest instead of
   *  the teacher's saved list. Does not persist. */
  zoneId?: string;
  /** Optional override of the persisted teacher config (for tests / deep links). */
  configOverride?: TeacherConfig;
  onExit?: () => void;
}

/** Build a rawList string from a zone's phonemes, or null if not found. */
function zoneListFor(zoneId: string | undefined): { name: string; list: string } | null {
  if (!zoneId) return null;
  const zone = CONTENT_MANIFEST.zones.find((z) => z.id === zoneId);
  if (!zone) return null;
  const list = PHONICS_DATA
    .filter((p) => zone.phonemeSets.includes(p.set))
    .map((p) => p.grapheme)
    .join(', ');
  return { name: zone.name, list };
}

type Phase = 'ready' | 'flashing';

function shuffleCopy<T>(arr: T[]): T[] {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function DrillSession({ zoneId, configOverride, onExit }: DrillSessionProps) {
  // Resolve initial config + list with priority: configOverride > zone > localStorage.
  const initialConfig = configOverride ?? loadConfig();
  const zoneContext = zoneListFor(zoneId);
  const initialRawList = zoneContext ? zoneContext.list : initialConfig.rawList;

  const config = useSignal<TeacherConfig>({ ...initialConfig, rawList: initialRawList });
  const zoneName = useSignal<string | null>(zoneContext?.name ?? null);
  const words = useSignal<string[]>(
    initialConfig.randomize
      ? shuffleCopy(parseList(initialRawList))
      : parseList(initialRawList),
  );
  const index = useSignal(0);
  const phase = useSignal<Phase>('ready');
  const flashedCount = useSignal(0);

  const maskTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset if zoneId / override changes mid-session.
  useEffect(() => {
    const fresh = configOverride ?? loadConfig();
    const ctx = zoneListFor(zoneId);
    const rawList = ctx ? ctx.list : fresh.rawList;
    config.value = { ...fresh, rawList };
    zoneName.value = ctx?.name ?? null;
    const parsed = parseList(rawList);
    words.value = fresh.randomize ? shuffleCopy(parsed) : parsed;
    index.value = 0;
    phase.value = 'ready';
    flashedCount.value = 0;
    return () => {
      if (maskTimerRef.current) clearTimeout(maskTimerRef.current);
    };
  }, [zoneId, configOverride]);

  const flashDurationFor = (word: string): number => {
    const base = config.value.flashDurationMs;
    if (!config.value.variableTiming) return base;
    // Treat base as WPM-equivalent when variable timing is on.
    // Reuse the core engine's duration rules by faking a PhonicsItem.
    const fakeItem = {
      id: word, grapheme: word, phoneme: word, exampleWords: [word], set: 0,
    };
    const computedMs = durationFor(fakeItem, 60000 / base);
    return computedMs;
  };

  const flashNext = () => {
    if (phase.value === 'flashing') return; // debounce rapid taps
    if (words.value.length === 0) return;

    const idx = index.value % words.value.length;
    const word = words.value[idx];
    const duration = flashDurationFor(word);

    phase.value = 'flashing';
    if (maskTimerRef.current) clearTimeout(maskTimerRef.current);
    maskTimerRef.current = setTimeout(() => {
      phase.value = 'ready';
      // Advance pointer only AFTER the flash completes so UI shows current word.
      index.value = (idx + 1) % words.value.length;
      flashedCount.value = flashedCount.value + 1;
    }, duration);
  };

  // Keyboard: Space or Enter anywhere triggers a flash.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        flashNext();
      } else if (e.key === 'Escape') {
        onExit?.();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      if (maskTimerRef.current) clearTimeout(maskTimerRef.current);
    };
  }, []);

  const handleShuffle = () => {
    const parsed = parseList(config.value.rawList);
    words.value = shuffleCopy(parsed);
    index.value = 0;
    flashedCount.value = 0;
    phase.value = 'ready';
  };

  const handleTeacher = () => {
    window.location.hash = '#/teacher';
  };

  const handleDone = () => {
    if (onExit) onExit();
    else if (zoneId) window.location.hash = '#/world';
    else window.location.hash = '#/teacher';
  };

  const handleBossChallenge = () => {
    if (!zoneId) return;
    window.location.hash = `#/beat/${zoneId}`;
  };

  const idx = index.value % Math.max(1, words.value.length);
  const currentWord = words.value[idx] ?? '';
  const orp = config.value.showOrp ? computeORP(currentWord) : -1;

  if (words.value.length === 0) {
    return (
      <main class="drill" role="main" aria-label="Drill — empty list">
        <div class="drill__empty">
          <h1>No words in the list</h1>
          <p>Head back to the teacher panel and add some.</p>
          <button class="drill__link-btn" onClick={handleTeacher}>Teacher Panel</button>
        </div>
      </main>
    );
  }

  const isFlashing = phase.value === 'flashing';

  return (
    <main
      class={`drill ${isFlashing ? 'drill--flashing' : 'drill--masked'}`}
      role="main"
      aria-label="Flash-and-mask drill"
      tabIndex={0}
      onClick={flashNext}
      onKeyDown={(e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          flashNext();
        }
      }}
    >
      {/* Zone context label (only when launched from the world map) */}
      {zoneName.value && (
        <div class="drill__zone-label" aria-live="polite">
          <span class="drill__zone-label-prefix">Zone:</span>
          <span class="drill__zone-label-name">{zoneName.value}</span>
        </div>
      )}

      {/* Corner controls (teacher-facing, low visual weight) */}
      <nav class="drill__corner" aria-label="Session controls">
        <button
          type="button"
          class="drill__corner-btn"
          onClick={(e) => { e.stopPropagation(); handleShuffle(); }}
          aria-label="Shuffle list"
          title="Shuffle"
        >
          Shuffle
        </button>
        {zoneId ? (
          <button
            type="button"
            class="drill__corner-btn drill__corner-btn--boss"
            onClick={(e) => { e.stopPropagation(); handleBossChallenge(); }}
            aria-label="Try the boss challenge"
            title="Try the boss"
          >
            Boss
          </button>
        ) : (
          <button
            type="button"
            class="drill__corner-btn"
            onClick={(e) => { e.stopPropagation(); handleTeacher(); }}
            aria-label="Open teacher panel"
            title="Teacher"
          >
            Teacher
          </button>
        )}
        <button
          type="button"
          class="drill__corner-btn"
          onClick={(e) => { e.stopPropagation(); handleDone(); }}
          aria-label="Exit drill"
          title="Done"
        >
          Done
        </button>
      </nav>

      {/* Central area: either the mask (ready) or the flash */}
      <div class="drill__stage" aria-live="polite">
        {isFlashing ? (
          <span class="drill__word">
            {orp >= 0 && orp < currentWord.length ? (
              <>
                <span>{currentWord.slice(0, orp)}</span>
                <span class="drill__word-orp">{currentWord.charAt(orp)}</span>
                <span>{currentWord.slice(orp + 1)}</span>
              </>
            ) : (
              currentWord
            )}
          </span>
        ) : (
          <div class="drill__ready">
            <span class="drill__ready-title">Ready</span>
            <span class="drill__ready-prompt">
              Tap or press Space to flash
            </span>
          </div>
        )}
      </div>

      {/* Small counter strip (also low visual weight) */}
      <div class="drill__footer" aria-live="polite">
        <span class="drill__footer-label">
          Flashed: {flashedCount.value} · List: {words.value.length}
        </span>
      </div>
    </main>
  );
}
