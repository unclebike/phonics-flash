import type { ComponentChildren, JSX } from 'preact';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'lg' | 'md';

export interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  onClick?: (e: JSX.TargetedMouseEvent<HTMLButtonElement>) => void;
  children: ComponentChildren;
  'aria-label'?: string;
  type?: 'button' | 'submit' | 'reset';
  class?: string;
}

/**
 * Button — primary interactive element.
 *
 * Design goals:
 * - Large touch targets (minimum 44px, default 56px for kids)
 * - Clear visual press feedback via CSS active state
 * - High-contrast focus ring
 * - Works with keyboard, touch, and assistive tech
 */
export function Button({
  variant = 'primary',
  size = 'lg',
  disabled = false,
  onClick,
  children,
  type = 'button',
  class: className,
  ...rest
}: ButtonProps) {
  const classes = [
    'btn',
    `btn--${variant}`,
    `btn--${size}`,
    className,
  ].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      class={classes}
      disabled={disabled}
      onClick={onClick}
      {...rest}
    >
      {children}
    </button>
  );
}

/*
 * Styles are colocated below. Import this CSS in your app entry or
 * use a bundler that handles CSS-in-JS. For now, these go into
 * a <style> block or a separate Button.css file.
 *
 * We export a CSS string so it can be injected however the app chooses.
 */
export const ButtonStyles = /* css */ `
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);

    font-family: var(--font-active);
    font-weight: var(--weight-bold);
    letter-spacing: var(--tracking-wide);
    line-height: 1;
    text-decoration: none;

    border: 2px solid transparent;
    border-radius: var(--radius-lg);
    cursor: pointer;
    user-select: none;
    -webkit-tap-highlight-color: transparent;

    transition-property: background-color, border-color, transform, box-shadow;
    transition-duration: var(--duration-fast);
    transition-timing-function: var(--ease-out);
  }

  /* --- Sizes --- */
  .btn--lg {
    font-size: var(--text-lg);
    min-height: var(--touch-target);
    min-width: var(--touch-target);
    padding: var(--space-3) var(--space-6);
  }

  .btn--md {
    font-size: var(--text-base);
    min-height: var(--touch-min);
    min-width: var(--touch-min);
    padding: var(--space-2) var(--space-5);
  }

  /* --- Primary variant --- */
  .btn--primary {
    background-color: var(--color-primary);
    color: var(--color-primary-text);
  }

  .btn--primary:hover:not(:disabled) {
    background-color: var(--color-primary-hover);
  }

  .btn--primary:active:not(:disabled) {
    background-color: var(--color-primary-active);
    transform: scale(0.96);
  }

  /* --- Secondary variant --- */
  .btn--secondary {
    background-color: var(--color-surface);
    color: var(--color-primary);
    border-color: var(--color-primary);
  }

  .btn--secondary:hover:not(:disabled) {
    background-color: var(--color-orp-bg);
  }

  .btn--secondary:active:not(:disabled) {
    transform: scale(0.96);
  }

  /* --- Ghost variant --- */
  .btn--ghost {
    background-color: transparent;
    color: var(--color-text);
  }

  .btn--ghost:hover:not(:disabled) {
    background-color: var(--color-orp-bg);
  }

  .btn--ghost:active:not(:disabled) {
    transform: scale(0.96);
  }

  /* --- Disabled --- */
  .btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  /* --- Focus --- */
  .btn:focus-visible {
    outline: 3px solid var(--color-focus);
    outline-offset: var(--color-focus-offset);
  }
`;
