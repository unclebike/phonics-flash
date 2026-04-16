import { useSignal, useComputed } from '@preact/signals';
import { useEffect } from 'preact/hooks';
import { Button } from '../../ui/components/Button';
import {
  loadConfig, saveConfig, parseList, getPresets, SIGHT_WORDS_PRESET,
  type TeacherConfig,
} from './config';

export interface TeacherPanelProps {
  onBack?: () => void;
}

export function TeacherPanel({ onBack }: TeacherPanelProps) {
  const config = useSignal<TeacherConfig>(loadConfig());
  const parsed = useComputed(() => parseList(config.value.rawList));

  // Persist every change.
  useEffect(() => {
    saveConfig(config.value);
  }, [config.value]);

  const update = (patch: Partial<TeacherConfig>) => {
    config.value = { ...config.value, ...patch };
  };

  const applyPreset = (listText: string) => {
    update({ rawList: listText });
  };

  const startSession = () => {
    // Config is already persisted — drill reads the same localStorage key.
    window.location.hash = '#/drill';
  };

  const presets = getPresets();

  return (
    <main class="teacher-panel" role="main" aria-label="Teacher panel">
      <header class="teacher-panel__header">
        <h1 class="teacher-panel__title">Teacher Panel</h1>
        <p class="teacher-panel__subtitle">
          Set today's word list and flash duration, then start the drill.
        </p>
      </header>

      <section class="teacher-panel__section" aria-labelledby="list-label">
        <label id="list-label" class="teacher-panel__label" for="word-list">
          Word / sound list
        </label>
        <p class="teacher-panel__hint">
          Separate with commas or new lines. Digraphs, sight words, anything.
        </p>
        <textarea
          id="word-list"
          class="teacher-panel__textarea"
          value={config.value.rawList}
          rows={6}
          placeholder="sh, ch, th, said, could, the, and..."
          onInput={(e) => update({ rawList: (e.target as HTMLTextAreaElement).value })}
          spellcheck={false}
          autocomplete="off"
          autocapitalize="off"
        />
        <p class="teacher-panel__meta" aria-live="polite">
          {parsed.value.length} {parsed.value.length === 1 ? 'item' : 'items'} in list
        </p>
      </section>

      <section class="teacher-panel__section" aria-labelledby="presets-label">
        <h2 id="presets-label" class="teacher-panel__label">Presets</h2>
        <p class="teacher-panel__hint">
          Replace the list with one of these starters.
        </p>
        <div class="teacher-panel__presets" role="group" aria-label="Preset lists">
          {presets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              class="teacher-panel__preset-btn"
              onClick={() => applyPreset(preset.list)}
            >
              {preset.name}
            </button>
          ))}
          <button
            type="button"
            class="teacher-panel__preset-btn"
            onClick={() => applyPreset(SIGHT_WORDS_PRESET.list)}
          >
            {SIGHT_WORDS_PRESET.name}
          </button>
        </div>
      </section>

      <section class="teacher-panel__section" aria-labelledby="duration-label">
        <label id="duration-label" class="teacher-panel__label" for="duration">
          Flash duration: <strong>{config.value.flashDurationMs} ms</strong>
        </label>
        <input
          id="duration"
          type="range"
          min={50}
          max={1500}
          step={25}
          class="teacher-panel__slider"
          value={config.value.flashDurationMs}
          onInput={(e) => update({ flashDurationMs: parseInt((e.target as HTMLInputElement).value, 10) })}
        />
        <div class="teacher-panel__slider-legend">
          <span>50 ms — harder</span>
          <span>1500 ms — easier</span>
        </div>
        <p class="teacher-panel__hint">
          Lower durations build faster recognition. Start at 500 ms for new readers; drop toward 200 ms as fluency grows.
        </p>
      </section>

      <section class="teacher-panel__section" aria-labelledby="options-label">
        <h2 id="options-label" class="teacher-panel__label">Options</h2>

        <label class="teacher-panel__toggle">
          <input
            type="checkbox"
            checked={config.value.randomize}
            onChange={(e) => update({ randomize: (e.target as HTMLInputElement).checked })}
          />
          <span>Shuffle the list on each session</span>
        </label>

        <label class="teacher-panel__toggle">
          <input
            type="checkbox"
            checked={config.value.showOrp}
            onChange={(e) => update({ showOrp: (e.target as HTMLInputElement).checked })}
          />
          <span>Highlight the optimal recognition point (ORP)</span>
        </label>

        <label class="teacher-panel__toggle">
          <input
            type="checkbox"
            checked={config.value.variableTiming}
            onChange={(e) => update({ variableTiming: (e.target as HTMLInputElement).checked })}
          />
          <span>
            Vary duration by word length and digraphs
            <span class="teacher-panel__toggle-detail">
              (longer words and digraphs get more time)
            </span>
          </span>
        </label>
      </section>

      <div class="teacher-panel__actions">
        <Button
          variant="primary"
          onClick={startSession}
          disabled={parsed.value.length === 0}
        >
          Start drill
        </Button>
        {onBack && (
          <Button variant="ghost" onClick={onBack}>
            Back
          </Button>
        )}
      </div>
    </main>
  );
}
