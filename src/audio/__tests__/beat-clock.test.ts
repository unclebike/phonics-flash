import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createBeatClock, TEMPO_BPM } from '../beat-clock';

// ---- Mock AudioContext ----

interface FakeOsc {
  frequency: { value: number };
  connect: (n: unknown) => void;
  start: (t: number) => void;
  stop: (t: number) => void;
}

interface FakeGain {
  gain: { value: number };
  connect: (n: unknown) => void;
}

class FakeAudioContext {
  currentTime = 0;
  state: 'suspended' | 'running' = 'running';
  destination = {};
  resume = vi.fn().mockResolvedValue(undefined);

  createOscillator(): FakeOsc {
    return {
      frequency: { value: 0 },
      connect: () => {},
      start: () => {},
      stop: () => {},
    };
  }

  createGain(): FakeGain {
    return {
      gain: { value: 0 },
      connect: () => {},
    };
  }
}

describe('BeatClock', () => {
  let fakeCtx: FakeAudioContext;

  beforeEach(() => {
    vi.useFakeTimers();
    fakeCtx = new FakeAudioContext();
    // Install AudioContext on a globalThis.window shim.
    (globalThis as unknown as { window: unknown }).window = {
      AudioContext: vi.fn(() => fakeCtx),
    };
  });

  afterEach(() => {
    vi.useRealTimers();
    delete (globalThis as unknown as { window?: unknown }).window;
  });

  function advanceAudio(seconds: number): void {
    fakeCtx.currentTime += seconds;
    // Advance JS timers to trigger the scheduler worker.
    vi.advanceTimersByTime(seconds * 1000);
  }

  it('TEMPO_BPM has correct values', () => {
    expect(TEMPO_BPM).toEqual({ slow: 80, medium: 110, fast: 140 });
  });

  it('isRunning() is false before start()', () => {
    const clock = createBeatClock();
    expect(clock.isRunning()).toBe(false);
  });

  it('start() marks clock as running and resets beat count', () => {
    const clock = createBeatClock();
    clock.start('medium');
    expect(clock.isRunning()).toBe(true);
    expect(clock.getCurrentBeat()).toBe(0);
  });

  it('stop() halts running state and resets beat counter', () => {
    const clock = createBeatClock();
    clock.start('medium');
    advanceAudio(0.2);
    clock.stop();
    expect(clock.isRunning()).toBe(false);
    expect(clock.getCurrentBeat()).toBe(0);
  });

  it('calls resume() on suspended AudioContext (iOS Safari unlock)', () => {
    fakeCtx.state = 'suspended';
    const clock = createBeatClock();
    clock.start('medium');
    expect(fakeCtx.resume).toHaveBeenCalled();
  });

  it('onBeat subscribers receive beat events with index and audioTime', () => {
    const clock = createBeatClock();
    const beats: Array<[number, number]> = [];
    clock.onBeat((i, t) => beats.push([i, t]));

    clock.start('fast'); // 140 BPM → ~0.4286s/beat
    // Advance well past the lookahead (0.1s) + first-beat cushion (0.05s).
    advanceAudio(1.0);

    expect(beats.length).toBeGreaterThan(0);
    // Beat indices start at 0 and increment.
    expect(beats[0][0]).toBe(0);
    for (let i = 1; i < beats.length; i++) {
      expect(beats[i][0]).toBe(beats[i - 1][0] + 1);
    }
    // audioTime increases monotonically.
    for (let i = 1; i < beats.length; i++) {
      expect(beats[i][1]).toBeGreaterThan(beats[i - 1][1]);
    }
  });

  it('onBeat returns unsubscribe function', () => {
    const clock = createBeatClock();
    const fn = vi.fn();
    const unsub = clock.onBeat(fn);
    clock.start('medium');
    advanceAudio(0.5);
    const countBeforeUnsub = fn.mock.calls.length;
    expect(countBeforeUnsub).toBeGreaterThan(0);

    unsub();
    advanceAudio(1.0);
    // No further calls after unsubscribe.
    expect(fn.mock.calls.length).toBe(countBeforeUnsub);
  });

  it('getCurrentBeat() increments as beats fire', () => {
    const clock = createBeatClock();
    clock.start('fast');
    advanceAudio(1.0);
    expect(clock.getCurrentBeat()).toBeGreaterThan(0);
  });

  it('beats fire at the correct tempo (slow = 80 BPM = 0.75s/beat)', () => {
    const clock = createBeatClock();
    const times: number[] = [];
    clock.onBeat((_i, t) => times.push(t));

    clock.start('slow');
    advanceAudio(3.0);

    expect(times.length).toBeGreaterThanOrEqual(3);
    // Inter-beat interval should be ~0.75s for slow.
    for (let i = 1; i < times.length; i++) {
      const dt = times[i] - times[i - 1];
      expect(dt).toBeGreaterThan(0.74);
      expect(dt).toBeLessThan(0.76);
    }
  });

  it('different tempos produce different beat intervals', () => {
    const slowTimes: number[] = [];
    const fastTimes: number[] = [];

    const slowClock = createBeatClock();
    slowClock.onBeat((_i, t) => slowTimes.push(t));
    slowClock.start('slow');
    advanceAudio(2.0);
    slowClock.stop();

    // Reset audio time for a fair comparison.
    fakeCtx.currentTime = 0;

    const fastClock = createBeatClock();
    fastClock.onBeat((_i, t) => fastTimes.push(t));
    fastClock.start('fast');
    advanceAudio(2.0);
    fastClock.stop();

    expect(fastTimes.length).toBeGreaterThan(slowTimes.length);
  });

  it('pause() stops firing beats but preserves count; resume() continues', () => {
    const clock = createBeatClock();
    const beats: number[] = [];
    clock.onBeat((i) => beats.push(i));

    clock.start('fast');
    advanceAudio(1.0);
    const countAfterRun = clock.getCurrentBeat();
    expect(countAfterRun).toBeGreaterThan(0);

    clock.pause();
    expect(clock.isRunning()).toBe(false);
    const beatsAtPause = beats.length;

    advanceAudio(1.0);
    // No new beats while paused.
    expect(beats.length).toBe(beatsAtPause);
    // Count preserved.
    expect(clock.getCurrentBeat()).toBe(countAfterRun);

    clock.resume();
    expect(clock.isRunning()).toBe(true);
    advanceAudio(1.0);
    expect(beats.length).toBeGreaterThan(beatsAtPause);
  });

  it('getAudioTime() returns 0 when no context exists', () => {
    // Remove the AudioContext shim.
    delete (globalThis as unknown as { window?: unknown }).window;
    const clock = createBeatClock();
    expect(clock.getAudioTime()).toBe(0);
  });

  it('getAudioTime() reflects AudioContext.currentTime once started', () => {
    const clock = createBeatClock();
    clock.start('medium');
    fakeCtx.currentTime = 2.5;
    expect(clock.getAudioTime()).toBe(2.5);
  });

  it('restart after stop resets beat count to zero', () => {
    const clock = createBeatClock();
    clock.start('fast');
    advanceAudio(0.5);
    expect(clock.getCurrentBeat()).toBeGreaterThan(0);

    clock.stop();
    clock.start('fast');
    expect(clock.getCurrentBeat()).toBe(0);
  });

  it('listener errors do not kill the scheduler', () => {
    const clock = createBeatClock();
    const good = vi.fn();
    clock.onBeat(() => {
      throw new Error('boom');
    });
    clock.onBeat(good);

    clock.start('fast');
    advanceAudio(1.0);

    expect(good).toHaveBeenCalled();
  });
});
