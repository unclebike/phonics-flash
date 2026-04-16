// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/preact';
import { BeatSession } from '../BeatSession';
import type { BeatClock } from '../../../audio/beat-clock';
import { PHONICS_DATA } from '../../../content/phonics';

/** Minimal in-memory clock stub: lets tests control beat firing and audio time. */
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

describe('BeatSession', () => {
  beforeEach(() => {
    cleanup();
  });

  const items = PHONICS_DATA.filter((p) => p.set === 1);

  it('renders the ready overlay with a Start button', () => {
    render(
      <BeatSession
        items={items}
        tempo="slow"
        length={10}
        requiredScore={7}
      />,
    );
    expect(screen.getByText(/Boss Level/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /start/i })).toBeTruthy();
  });

  it('shows required score in the ready overlay', () => {
    render(
      <BeatSession
        items={items}
        tempo="slow"
        length={10}
        requiredScore={7}
      />,
    );
    // The literal "7" appears inside a <strong>
    const overlay = screen.getByRole('main');
    expect(overlay.textContent).toContain('7');
  });

  it('advances to the playing phase when Start is tapped', async () => {
    const clock = makeStubClock();
    render(
      <BeatSession
        items={items}
        tempo="slow"
        length={8}
        requiredScore={5}
        clockFactory={() => clock}
      />,
    );
    const startBtn = screen.getByRole('button', { name: /start/i });
    startBtn.click();

    // After start, the tappable arena appears. findBy* waits for it.
    const arena = await screen.findByLabelText(/Tap on pattern-break beats/i);
    expect(arena).toBeTruthy();
  });

  it('ignores arena taps before Start', () => {
    const clock = makeStubClock();
    render(
      <BeatSession
        items={items}
        tempo="slow"
        length={8}
        requiredScore={5}
        clockFactory={() => clock}
      />,
    );
    // Arena isn't rendered yet — just the ready overlay.
    expect(screen.queryByLabelText(/Tap on pattern-break beats/i)).toBeNull();
  });

  it('calls onComplete when the sequence ends', () => {
    const clock = makeStubClock();
    const onComplete = vi.fn();
    render(
      <BeatSession
        items={items}
        tempo="slow"
        length={3}
        requiredScore={2}
        clockFactory={() => clock}
        onComplete={onComplete}
      />,
    );
    screen.getByRole('button', { name: /start/i }).click();

    // Fire beats 0, 1, 2 (the sequence length) and then one more to signal end.
    clock.fire(0);
    clock.fire(1);
    clock.fire(2);
    clock.fire(3); // past end -> finishSession()

    expect(onComplete).toHaveBeenCalledTimes(1);
    const result = onComplete.mock.calls[0][0];
    expect(result).toHaveProperty('score');
    expect(result).toHaveProperty('passed');
    expect(result).toHaveProperty('bestCombo');
  });
});
