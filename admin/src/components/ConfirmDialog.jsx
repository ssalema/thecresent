import { useRef } from 'react';
import { FaExclamationTriangle } from 'react-icons/fa';
import { Button } from './ui';
import {
  DIALOG_ACTIONS,
  DIALOG_BACKDROP,
  DIALOG_BUTTON_WIDTH,
  DIALOG_ICON_CIRCLE,
  DIALOG_NOTE,
  DIALOG_PANEL,
  DIALOG_ROOT,
  DialogCloseButton,
  useDialogBehavior,
} from './ui/dialog';

/**
 * Reusable confirmation dialog.
 *
 * The frame — backdrop, Escape handling, scroll lock, entrance animation — is
 * shared with MessageDialog and ui.jsx's Modal; see dialog.jsx.
 *
 * <ConfirmDialog
 *   open={Boolean(target)}
 *   title="Delete project?"
 *   message="This action cannot be undone."
 *   itemName={target?.name}
 *   confirmText="Delete"
 *   loading={deleting}
 *   onConfirm={doDelete}
 *   onCancel={() => setTarget(null)}
 * />
 */
const ConfirmDialog = ({
  open,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  itemName,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  // Shown in place of `confirmText` while the action is in flight.
  loadingText = 'Deleting…',
  loading = false,
  onConfirm,
  onCancel,
}) => {
  const cancelRef = useRef(null);

  // Focus lands on Cancel, so Enter on an opened dialog backs out rather than
  // confirming. `disabled` holds the dialog open while the action runs.
  useDialogBehavior({
    open,
    onClose: onCancel,
    initialFocusRef: cancelRef,
    disabled: loading,
  });

  if (!open) return null;

  return (
    <div
      className={DIALOG_ROOT}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-message"
      onMouseDown={(e) => {
        // Only close when the backdrop itself is clicked, not the panel.
        if (e.target === e.currentTarget && !loading) onCancel();
      }}
    >
      <div className={DIALOG_BACKDROP} />

      <div className={`${DIALOG_PANEL} max-w-md`}>
        <DialogCloseButton onClick={onCancel} disabled={loading} />

        <div className="p-6 sm:p-7">
          <div className="flex items-start gap-4">
            <div className={`${DIALOG_ICON_CIRCLE} bg-red-100 ring-red-50`}>
              <FaExclamationTriangle className="text-xl text-red-600" />
            </div>

            <div className="min-w-0 flex-grow pt-0.5">
              <h2
                id="confirm-dialog-title"
                className="pr-8 text-lg font-bold tracking-tight text-gray-900"
              >
                {title}
              </h2>
              <p
                id="confirm-dialog-message"
                className="mt-1.5 text-sm leading-relaxed text-gray-600"
              >
                {message}
              </p>
              {itemName && (
                <p className={`${DIALOG_NOTE} truncate font-medium text-gray-800`}>
                  {itemName}
                </p>
              )}
            </div>
          </div>

          {/* Both actions are the panel's own buttons, so a dialog's Cancel is
              the same control as a form's Cancel — same height, padding, press
              and focus ring. */}
          <div className={`mt-7 ${DIALOG_ACTIONS}`}>
            <Button
              type="button"
              ref={cancelRef}
              variant="secondary"
              onClick={onCancel}
              disabled={loading}
              className={DIALOG_BUTTON_WIDTH}
            >
              {cancelText}
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={onConfirm}
              loading={loading}
              className={DIALOG_BUTTON_WIDTH}
            >
              {loading ? loadingText : confirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
