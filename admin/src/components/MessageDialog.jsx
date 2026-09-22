import { useRef } from 'react';
import {
  FaCheckCircle,
  FaExclamationCircle,
  FaExclamationTriangle,
  FaInfoCircle,
} from 'react-icons/fa';
import { Button } from './ui';
import {
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
 * Reusable message box for success / error / info feedback.
 * Drop-in replacement for window.alert().
 *
 * Shares its frame with ConfirmDialog and ui.jsx's Modal — see dialog.jsx.
 *
 * <MessageDialog
 *   open={Boolean(message)}
 *   type="success"
 *   title="Project uploaded"
 *   message="Your project is now live."
 *   onClose={() => setMessage(null)}
 * />
 */
/* `button` names a `Button` variant rather than spelling out its colours: the
   OK button in a dialog is the same control as any other button in the panel,
   in the colour the news arrives in. */
const VARIANTS = {
  success: {
    Icon: FaCheckCircle,
    iconClass: 'text-green-600',
    circleClass: 'bg-green-100 ring-green-50',
    button: 'success',
    defaultTitle: 'Success',
  },
  error: {
    Icon: FaExclamationCircle,
    iconClass: 'text-red-600',
    circleClass: 'bg-red-100 ring-red-50',
    button: 'danger',
    defaultTitle: 'Something went wrong',
  },
  warning: {
    Icon: FaExclamationTriangle,
    iconClass: 'text-amber-600',
    circleClass: 'bg-amber-100 ring-amber-50',
    button: 'warning',
    defaultTitle: 'Heads up',
  },
  info: {
    Icon: FaInfoCircle,
    iconClass: 'text-blue-600',
    circleClass: 'bg-blue-100 ring-blue-50',
    button: 'primary',
    defaultTitle: 'Notice',
  },
};

const MessageDialog = ({
  open,
  type = 'info',
  title,
  message,
  details,
  closeText = 'OK',
  onClose,
}) => {
  const closeRef = useRef(null);

  useDialogBehavior({ open, onClose, initialFocusRef: closeRef });

  if (!open) return null;

  const variant = VARIANTS[type] || VARIANTS.info;
  const { Icon } = variant;

  return (
    <div
      className={DIALOG_ROOT}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="message-dialog-title"
      onMouseDown={(e) => {
        // Only close when the backdrop itself is clicked, not the panel.
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className={DIALOG_BACKDROP} />

      <div className={`${DIALOG_PANEL} max-w-md`}>
        <DialogCloseButton onClick={onClose} />

        <div className="p-6 sm:p-7">
          <div className="flex items-start gap-4">
            <div className={`${DIALOG_ICON_CIRCLE} ${variant.circleClass}`}>
              <Icon className={`text-xl ${variant.iconClass}`} />
            </div>

            <div className="min-w-0 flex-grow pt-0.5">
              <h2
                id="message-dialog-title"
                className="pr-8 text-lg font-bold tracking-tight text-gray-900"
              >
                {title || variant.defaultTitle}
              </h2>
              {message && (
                <p className="mt-1.5 text-sm leading-relaxed text-gray-600">{message}</p>
              )}
              {details && (
                <p className={`${DIALOG_NOTE} break-words`}>{details}</p>
              )}
            </div>
          </div>

          <div className="mt-7 flex justify-end">
            <Button
              type="button"
              ref={closeRef}
              variant={variant.button}
              onClick={onClose}
              className={`w-full sm:w-auto ${DIALOG_BUTTON_WIDTH}`}
            >
              {closeText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageDialog;
