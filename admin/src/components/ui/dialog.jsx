import { useEffect, useRef } from 'react';
import { FaTimes } from 'react-icons/fa';
import { FOCUS_RING_TIGHT, TRANSITION } from './tokens';

/**
 * The chrome and behaviour every dialog in the panel shares.
 *
 * `ConfirmDialog`, `MessageDialog` and `ui.jsx`'s `Modal` each used to carry
 * their own copy of this: the same Escape handler, the same scroll lock, the
 * same backdrop, and three separate <style> tags injecting three identical sets
 * of keyframes. They now render the same frame from here, so a change to the
 * dialog language lands in all three at once.
 *
 * The entrance animation itself lives in tailwind.config.js as
 * `animate-overlay-in` / `animate-dialog-in`.
 */

/**
 * Escape to close, background scroll locked while open, and focus moved into
 * the dialog so Enter and Space reach a dialog button.
 *
 * `disabled` blocks Escape only — ConfirmDialog uses it to hold the dialog open
 * while a delete is in flight. `initialFocusRef` is optional; pass the ref of
 * the button that should receive focus when the dialog appears.
 */
export const useDialogBehavior = ({
  open,
  onClose,
  initialFocusRef,
  disabled = false,
}) => {
  // Both are read through refs so the effect doesn't re-run — and re-steal
  // focus — every time the parent re-renders with a fresh inline callback.
  const closeHandler = useRef(onClose);
  closeHandler.current = onClose;
  const isDisabled = useRef(disabled);
  isDisabled.current = disabled;

  useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (e) => {
      if (e.key === 'Escape' && !isDisabled.current) closeHandler.current?.();
    };

    document.addEventListener('keydown', onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    initialFocusRef?.current?.focus();

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, initialFocusRef]);
};

/* ------------------------------------------------------------------ chrome */

/** The full-screen centring layer that owns the backdrop click. */
export const DIALOG_ROOT = 'fixed inset-0 z-[100] flex items-center justify-center p-4';

/** Dimmed backdrop — the page reads as pushed behind the panel. */
export const DIALOG_BACKDROP =
  'absolute inset-0 bg-gray-900/60 animate-overlay-in';

/** The raised panel itself, at the top of the elevation scale. */
export const DIALOG_PANEL =
  'relative w-full rounded-2xl bg-white shadow-e5 ring-1 ring-gray-900/5 animate-dialog-in';

/**
 * The tinted circle beside a dialog heading. The soft outer `ring` is what
 * gives it the haloed, raised look; the colours come from the caller.
 */
export const DIALOG_ICON_CIRCLE =
  'flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ring-8';

/**
 * Action row: stacked on a phone with the primary action on top, inline above
 * `sm`. Spacing is left to the caller — a panel footer and an inline action row
 * sit differently.
 */
export const DIALOG_ACTIONS = 'flex flex-col-reverse gap-3 sm:flex-row sm:justify-end';

/** Minimum width for a dialog button, so Cancel and Confirm match. */
export const DIALOG_BUTTON_WIDTH = 'sm:min-w-[112px]';

/**
 * The inset box a dialog quotes something in: the record about to be deleted in
 * ConfirmDialog, the server's own words in MessageDialog. Same recess in both,
 * so "this is the thing itself, not our copy about it" reads the same way.
 */
export const DIALOG_NOTE =
  'mt-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-700';

/** The X in the corner of every dialog. */
export const DialogCloseButton = ({ className = '', ...rest }) => (
  <button
    type="button"
    title="Close"
    aria-label="Close"
    className={`absolute right-3 top-3 inline-flex h-10 w-10 items-center justify-center rounded-full text-gray-400 ${TRANSITION} hover:bg-gray-100 hover:text-gray-700 active:bg-gray-200 ${FOCUS_RING_TIGHT} focus-visible:ring-gray-400 disabled:pointer-events-none disabled:opacity-40 ${className}`}
    {...rest}
  >
    <FaTimes />
  </button>
);
