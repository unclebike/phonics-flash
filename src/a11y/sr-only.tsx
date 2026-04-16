import type { ComponentChildren } from 'preact';

export interface SrOnlyProps {
  children: ComponentChildren;
  /** When true, the element becomes visible on focus (skip-nav links). */
  focusable?: boolean;
  /** HTML tag to render. Defaults to 'span'. */
  as?: 'span' | 'div' | 'p' | 'h2' | 'h3' | 'label';
}

/**
 * SrOnly — visually hidden text accessible to screen readers.
 *
 * Uses the standard sr-only technique (clip + 1px) rather than
 * display:none or visibility:hidden, which would hide from AT.
 *
 * @example
 * <button>
 *   <StarIcon />
 *   <SrOnly>Add to favorites</SrOnly>
 * </button>
 */
export function SrOnly({ children, focusable = false, as: Tag = 'span' }: SrOnlyProps) {
  const className = focusable ? 'sr-only sr-only--focusable' : 'sr-only';
  return <Tag class={className}>{children}</Tag>;
}

export const SrOnlyStyles = /* css */ `
  .sr-only--focusable:focus,
  .sr-only--focusable:focus-within {
    position: static;
    width: auto;
    height: auto;
    padding: var(--space-2) var(--space-4);
    margin: 0;
    overflow: visible;
    clip: auto;
    clip-path: none;
    white-space: normal;
    background-color: var(--color-primary);
    color: var(--color-primary-text);
    font-size: var(--text-base);
    font-weight: var(--weight-bold);
    border-radius: var(--radius-md);
    z-index: var(--z-toast);
  }
`;
