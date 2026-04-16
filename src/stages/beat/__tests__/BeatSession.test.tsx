// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, cleanup, act } from '@testing-library/preact';
import { BeatSession } from '../BeatSession';
import type { BeatClock } from '../../../audio/beat-clock';
import { PHONICS_DATA } from '../../../content/phonics';

/** Minimal in-memory clock stub. */
function makeStubClock(): BeatClock & { fire: (i: number) => void; setTime: (t: number) => void } {
  let listeners: ((i: number, t: number) => void)[] = [];
  let time = 0;
  let running = false;
  return {
    start: () => { running = true; },
    stop: () => { running = false; listeners = []; },
    pause: () => { running = false; },
    resume: () => { running = true; },
    getCurrentBeat: () => 0,
    getAudioTime: () => time,
    onBeat: (cb) => {
      listeners.push(cb);
      return () => { listeners = listeners.filter((l) => l !== cb); };
    },
    isRunning: () => running,
    fire: (i: number) => { listeners.forEach((l) => l(i, time)); },
    setTime: (t: number) => { time = t; },
  };
}

describe('BeatSession (ADR-007 teacher-judged)', () => {
  beforeEach(() => {
    cleanup();
  });

  const items = PHONICS_DATA.filter((p) => p.set === 1);

  it('renders the ready overlay with a Start button', () => {
    render(<BeatSession items={items} tempo="slow" length={10} />);
    expect(screen.getByText(/Boss Level/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /start/i })).toBeTruthy();
  });

  it('advances to the playing phase when Start is tapped', async () => {
    const clock = makeStubClock();
    render(
      <BeatSession
        items={items}
        tempo="slow"
        length={8}
        clockFactory={() => clock}
      />,
    );
    await act(async () => {
      screen.getByRole('button', { name: /start/i }).click();
    });

    const arena = await screen.findByLabelText(/Beat sequence in progress/i);
    expect(arena).toBeTruthy();
  });

  it('transitions to judging phase when sequence ends (shows teacher buttons)', async () => {
    const clock = makeStubClock();
    render(
      <BeatSession
        items={items}
        tempo="slow"
        length={3}
        clockFactory={() => clock}
      />,
    );
    await act(async () => {
      screen.getByRole('button', { name: /start/i }).click();
    });
    await act(async () => {
      clock.fire(0);
      clock.fire(1);
      clock.fire(2);
      clock.fire(3); // past end -> finishSequence()
    });

    expect(screen.getByRole('button', { name: /yes.*correct/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /try again/i })).toBeTruthy();
  });

  it('calls onComplete with passed:true when teacher marks correct', async () => {
    const clock = makeStubClock();
    const onComplete = vi.fn();
    render(
      <BeatSession
        items={items}
        tempo="slow"
        length={3}
        clockFactory={() => clock}
        onComplete={onComplete}
      />,
    );
    await act(async () => {
      screen.getByRole('button', { name: /start/i }).click();
    });
    await act(async () => {
      clock.fire(0); clock.fire(1); clock.fire(2); clock.fire(3);
    });
    await act(async () => {
      screen.getByRole('button', { name: /yes.*correct/i }).click();
    });

    expect(onComplete).toHaveBeenCalledTimes(1);
    const result = onComplete.mock.calls[0][0];
    expect(result).toHaveProperty('passed', true);
    expect(result).toHaveProperty('attempts');
  });

  it('Try again returns to ready, increments attempt counter, does not call onComplete', async () => {
    const clock = makeStubClock();
    const onComplete = vi.fn();
    render(
      <BeatSession
        items={items}
        tempo="slow"
        length={3}
        clockFactory={() => clock}
        onComplete={onComplete}
      />,
    );
    await act(async () => {
      screen.getByRole('button', { name: /start/i }).click();
    });
    await act(async () => {
      clock.fire(0); clock.fire(1); clock.fire(2); clock.fire(3);
    });
    await act(async () => {
      screen.getByRole('button', { name: /try again/i }).click();
    });

    expect(screen.getByRole('button', { name: /start again/i })).toBeTruthy();
    expect(screen.getByText(/Try 2/i)).toBeTruthy();
    expect(onComplete).not.toHaveBeenCalled();
  });
});
