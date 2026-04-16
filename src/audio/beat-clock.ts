/**
 * BeatClock — Web Audio API-based rhythm clock for Beat Mode.
 *
 * Uses the classic "lookahead scheduler" pattern (Chris Wilson, 2013):
 * a setInterval worker wakes every 25ms and schedules any beats that fall
 * within a 100ms lookahead window using AudioContext's sample-accurate
 * time. This keeps beat timing within ±8ms even when the main thread is
 * modestly busy, because the browser audio thread actually fires the
 * scheduled oscillators on time regardless of JS event-loop jitter.
 *
 * This module is DOM/framework agnostic. It does NOT render anything —
 * consumers subscribe via onBeat() and slave their visuals to the audio
 * time using requestAnimationFrame.
 *
 * iOS Safari note: AudioContext starts in 'suspended' state until a user
 * gesture. The first start() after a gesture must call resume(). We do
 * that unconditionally in start() — it's a no-op when already running.
 */

export type Tempo = 'slow' | 'medium' | 'fast';

export const TEMPO_BPM: Record<Tempo, number> = {
  slow: 80,
  medium: 110,
  fast: 140,
};

export interface BeatClock {
  start(tempo: Tempo): void;
  stop(): void;
  pause(): void;
  resume(): void;
  getCurrentBeat(): number;
  getAudioTime(): number;
  onBeat(callback: (beatIndex: number, audioTime: number) => void): () => void;
  isRunning(): boolean;
}

// Lookahead scheduler constants
const SCHEDULE_INTERVAL_MS = 25;        // how often the worker wakes
const SCHEDULE_LOOKAHEAD_SEC = 0.1;     // how far ahead we schedule (100ms)
const TICK_FREQUENCY_HZ = 1000;         // click frequency (not flashy; just a tick)
const TICK_DURATION_SEC = 0.02;         // very short click
const TICK_GAIN = 0.001;                // effectively silent by default

type AudioContextCtor = typeof AudioContext;

function getAudioContextCtor(): AudioContextCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    AudioContext?: AudioContextCtor;
    webkitAudioContext?: AudioContextCtor;
  };
  return w.AudioContext ?? w.webkitAudioContext ?? null;
}

export function createBeatClock(): BeatClock {
  let ctx: AudioContext | null = null;
  let currentTempo: Tempo = 'medium';
  let secondsPerBeat = 60 / TEMPO_BPM[currentTempo];

  // Beat counter — total beats fired since start(). Preserved across pause/resume.
  let beatsFired = 0;

  // Next beat's scheduled audio time (absolute, in AudioContext.currentTime seconds).
  let nextBeatTime = 0;

  // Scheduler worker handle.
  let schedulerHandle: ReturnType<typeof setInterval> | null = null;

  // Pending scheduled beats waiting for their audio time to elapse so we can
  // fire the onBeat callback at (approximately) the right moment in wall time.
  // Each entry: { beatIndex, audioTime }.
  interface Pending {
    beatIndex: number;
    audioTime: number;
  }
  const pending: Pending[] = [];

  type Listener = (beatIndex: number, audioTime: number) => void;
  const listeners = new Set<Listener>();

  let running = false;
  let paused = false;

  function ensureContext(): AudioContext | null {
    if (ctx) return ctx;
    const Ctor = getAudioContextCtor();
    if (!Ctor) return null;
    try {
      ctx = new Ctor();
    } catch {
      return null;
    }
    return ctx;
  }

  function scheduleTick(audioTime: number): void {
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = TICK_FREQUENCY_HZ;
      gain.gain.value = TICK_GAIN;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(audioTime);
      osc.stop(audioTime + TICK_DURATION_SEC);
    } catch {
      // If scheduling a tick fails, the beat subscribers still fire via the
      // wall-clock dispatcher below — we just lose sub-ms accuracy.
    }
  }

  function schedulerTick(): void {
    if (!ctx || !running || paused) return;
    const now = ctx.currentTime;

    // Schedule any beats that fall in our lookahead window.
    while (nextBeatTime < now + SCHEDULE_LOOKAHEAD_SEC) {
      scheduleTick(nextBeatTime);
      pending.push({ beatIndex: beatsFired, audioTime: nextBeatTime });
      beatsFired += 1;
      nextBeatTime += secondsPerBeat;
    }

    // Fire listeners for any pending beats whose audioTime has now elapsed.
    // We fire slightly early (as soon as the audio clock is within 5ms of
    // the scheduled time) because the audio thread will play the tick
    // precisely and visuals want to render in the same animation frame.
    while (pending.length > 0 && pending[0].audioTime <= now + 0.005) {
      const p = pending.shift()!;
      for (const l of listeners) {
        try {
          l(p.beatIndex, p.audioTime);
        } catch {
          // A listener throwing shouldn't kill the scheduler.
        }
      }
    }
  }

  function startScheduler(): void {
    if (schedulerHandle !== null) return;
    schedulerHandle = setInterval(schedulerTick, SCHEDULE_INTERVAL_MS);
  }

  function stopScheduler(): void {
    if (schedulerHandle !== null) {
      clearInterval(schedulerHandle);
      schedulerHandle = null;
    }
  }

  return {
    start(tempo: Tempo): void {
      const c = ensureContext();
      if (!c) {
        // No AudioContext available — silently no-op. Consumers can check
        // isRunning() and handle fallback.
        return;
      }

      currentTempo = tempo;
      secondsPerBeat = 60 / TEMPO_BPM[currentTempo];

      // iOS Safari: resume after user gesture.
      if (c.state === 'suspended') {
        // resume() returns a promise but we don't await — the scheduler
        // will simply spin harmlessly until currentTime advances.
        void c.resume();
      }

      beatsFired = 0;
      pending.length = 0;
      // Give ourselves a small cushion before the first beat so the first
      // tick can be scheduled rather than missed.
      nextBeatTime = c.currentTime + 0.05;
      running = true;
      paused = false;
      startScheduler();
    },

    stop(): void {
      running = false;
      paused = false;
      stopScheduler();
      pending.length = 0;
      beatsFired = 0;
    },

    pause(): void {
      if (!running || paused) return;
      paused = true;
      stopScheduler();
      // Drop any pending beats scheduled into the future — on resume we
      // restart from current audio time. Beats already played will still
      // have fired their listeners.
      pending.length = 0;
    },

    resume(): void {
      if (!running || !paused) return;
      const c = ctx;
      if (!c) return;
      if (c.state === 'suspended') {
        void c.resume();
      }
      paused = false;
      nextBeatTime = c.currentTime + 0.05;
      startScheduler();
    },

    getCurrentBeat(): number {
      return beatsFired;
    },

    getAudioTime(): number {
      return ctx ? ctx.currentTime : 0;
    },

    onBeat(callback: Listener): () => void {
      listeners.add(callback);
      return () => {
        listeners.delete(callback);
      };
    },

    isRunning(): boolean {
      return running && !paused;
    },
  };
}
