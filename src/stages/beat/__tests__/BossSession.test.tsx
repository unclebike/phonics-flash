// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, cleanup, act } from '@testing-library/preact';
import { BossSession } from '../BossSession';

describe('BossSession (ADR-010 drill-style gauntlet)', () => {
  beforeEach(() => {
    cleanup();
    vi.useFakeTimers();
  });

  const items = ['s', 'a', 't'];

  it('renders the ready overlay with zone name and Start button', () => {
    render(<BossSession zoneName="Whispering Meadows" items={items} tempo="medium" />);
    expect(screen.getByText(/Boss:/)).toBeTruthy();
    expect(screen.getByText(/Whispering Meadows/)).toBeTruthy();
    expect(screen.getByRole('button', { name: /start/i })).toBeTruthy();
  });

  it('advances through all items then reaches judging phase', async () => {
    render(<BossSession zoneName="Zone 1" items={items} tempo="medium" />);

    await act(async () => {
      screen.getByRole('button', { name: /start/i }).click();
    });

    // Walk through all 3 items — each flashMs (300ms for medium) + one tap to continue.
    for (let i = 0; i < items.length; i++) {
      // Let the flash timer elapse (mask returns).
      await act(async () => {
        vi.advanceTimersByTime(350);
      });
      // If not last, a tap advances to the next flash. If last, we should be judging.
      if (i < items.length - 1) {
        await act(async () => {
          window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
        });
      }
    }

    expect(screen.getByRole('button', { name: /yes.*correct/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /try again/i })).toBeTruthy();
  });

  it('onPass fires with attempts=1 on a clean run', async () => {
    const onPass = vi.fn();
    render(<BossSession zoneName="Zone 1" items={items} tempo="fast" onPass={onPass} />);

    await act(async () => {
      screen.getByRole('button', { name: /start/i }).click();
    });

    for (let i = 0; i < items.length; i++) {
      await act(async () => { vi.advanceTimersByTime(200); });
      if (i < items.length - 1) {
        await act(async () => {
          window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
        });
      }
    }

    await act(async () => {
      screen.getByRole('button', { name: /yes.*correct/i }).click();
    });

    expect(onPass).toHaveBeenCalledTimes(1);
    expect(onPass.mock.calls[0][0]).toEqual({ attempts: 1 });
  });

  it('Try again resets the gauntlet without calling onPass', async () => {
    const onPass = vi.fn();
    render(<BossSession zoneName="Zone 1" items={items} tempo="medium" onPass={onPass} />);

    await act(async () => {
      screen.getByRole('button', { name: /start/i }).click();
    });
    for (let i = 0; i < items.length; i++) {
      await act(async () => { vi.advanceTimersByTime(350); });
      if (i < items.length - 1) {
        await act(async () => {
          window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
        });
      }
    }

    await act(async () => {
      screen.getByRole('button', { name: /try again/i }).click();
    });

    // After Try again, we should see the mid-gauntlet "Next / Tap or press Space" prompt.
    // onPass must not have fired.
    expect(onPass).not.toHaveBeenCalled();
    expect(screen.getByRole('main', { name: /boss gauntlet/i })).toBeTruthy();
  });
});
