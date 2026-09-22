import { forwardRef } from 'react';
import { FaChevronDown, FaSpinner } from 'react-icons/fa';
import Sidebar from '../Sidebar';
import {
  controlClass,
  ERROR_TEXT,
  FOCUS_RING,
  FOCUS_RING_TIGHT,
  HINT,
  iconCircle,
  LABEL,
  META_LABEL,
  MOBILE_CARD,
  SELECT_CHEVRON,
  SURFACE,
  TABLE,
  TABLE_SHELL,
  TBODY,
  TD_CELL,
  THEAD,
  THEAD_CELL,
  TRANSITION,
} from './tokens';
import {
  DIALOG_ACTIONS,
  DIALOG_BACKDROP,
  DIALOG_PANEL,
  DIALOG_ROOT,
  DialogCloseButton,
  useDialogBehavior,
} from './dialog';

/**
 * The admin panel's shared UI kit.
 *
 * Every screen is built from these primitives so type sizes, spacing, radii,
 * focus rings and colours stay identical across the panel. The raw class
 * strings live in tokens.js — this file is the components that render them.
 *
 *   surface   white card, rounded-xl, hairline ring, elevation e1
 *   heading   page h1 text-2xl sm:text-3xl bold, card h2 text-lg bold
 *   body      text-sm, gray-600 for copy, gray-500 for hints
 *   control   44px tall, rounded-lg, outline darkens on hover and thickens to
 *             blue-600 on focus
 *   accent    blue-600 on blue-50, red for destructive, green for confirm
 */

/* ------------------------------------------------------------------ layout */

/** Sidebar + centred content column: the frame every screen sits in. */
export const PageShell = ({ maxWidth = 'max-w-6xl', children }) => (
  <div className="flex min-h-screen bg-gray-50">
    <Sidebar />
    {/* pt-20 clears the fixed mobile header; md:pt-8 restores even padding
        once the sidebar takes over. */}
    <div className="w-full flex-grow p-4 pt-20 md:ml-64 md:p-8 md:pt-8">
      <div className={`mx-auto ${maxWidth}`}>{children}</div>
    </div>
  </div>
);

/** Page title, one line of context, and any page-level actions. */
export const PageHeader = ({ title, description, meta, actions }) => (
  <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
    <div className="min-w-0">
      <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
        {title}
      </h1>
      {(description || meta) && (
        <p className="mt-1.5 text-sm leading-relaxed text-gray-600">
          {description}
          {meta && <span className="block text-gray-500">{meta}</span>}
        </p>
      )}
    </div>
    {actions && (
      <div className="flex flex-shrink-0 flex-col gap-3 sm:flex-row sm:items-center">
        {actions}
      </div>
    )}
  </div>
);

/** White panel with an icon-badged heading. The panel used everywhere. */
export const Card = ({
  icon: Icon,
  tone = 'blue',
  title,
  description,
  actions,
  children,
  className = '',
}) => (
  <section className={`${SURFACE} p-6 sm:p-8 ${className}`}>
    {(title || Icon) && (
      <div className="mb-6 flex flex-col gap-3 border-b border-gray-200 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          {Icon && (
            <span className={`${iconCircle(tone)} mt-0.5 h-9 w-9`}>
              <Icon />
            </span>
          )}
          <div className="min-w-0">
            <h2 className="text-lg font-bold tracking-tight text-gray-900">{title}</h2>
            {description && (
              <p className="mt-1 text-sm leading-relaxed text-gray-500">{description}</p>
            )}
          </div>
        </div>
        {actions && (
          <div className="flex flex-shrink-0 items-center gap-2">{actions}</div>
        )}
      </div>
    )}
    {children}
  </section>
);

/* -------------------------------------------------------------- form fields */

/**
 * Label + control + a single line of hint or error text underneath.
 *
 * The error is announced as it appears, so a screen reader reaches it without
 * the user having to hunt back up the form.
 */
export const Field = ({ label, htmlFor, error, hint, children, className = '' }) => (
  <div className={className}>
    {label && (
      <label htmlFor={htmlFor} className={LABEL}>
        {label}
      </label>
    )}
    {children}
    {error ? (
      <p className={ERROR_TEXT} role="alert">
        {error}
      </p>
    ) : (
      hint && <p className={HINT}>{hint}</p>
    )}
  </div>
);

/*
 * The three controls forward their ref to the DOM node.
 *
 * react-hook-form's register() hands back a ref alongside name/onChange/onBlur,
 * and React drops a ref on the floor unless the component forwards it. Without
 * this, RHF registers the field but never sees the input: at submit it reads the
 * field as unmounted, drops its value, and zod fails every field with its own
 * "expected string, received undefined" however much the admin typed in.
 */
export const Input = forwardRef(({ error, className = '', ...rest }, ref) => (
  <input
    ref={ref}
    aria-invalid={error ? true : undefined}
    className={`${controlClass(error)} ${className}`}
    {...rest}
  />
));
Input.displayName = 'Input';

export const Textarea = forwardRef(({ error, className = '', ...rest }, ref) => (
  <textarea
    ref={ref}
    aria-invalid={error ? true : undefined}
    className={`${controlClass(error)} resize-none ${className}`}
    {...rest}
  />
));
Textarea.displayName = 'Textarea';

/** Native <select> with the browser arrow replaced by our own chevron. */
export const Select = forwardRef(({ error, className = '', children, ...rest }, ref) => (
  <div className="relative">
    <select
      ref={ref}
      aria-invalid={error ? true : undefined}
      className={`${controlClass(error)} cursor-pointer appearance-none pr-10 ${className}`}
      {...rest}
    >
      {children}
    </select>
    <FaChevronDown className={SELECT_CHEVRON} />
  </div>
));
Select.displayName = 'Select';

/* ------------------------------------------------------------------ buttons */

/**
 * Each variant carries its resting colour, its hover and pressed states, its
 * elevation and its focus ring. A filled button lifts on hover and settles flat
 * when pressed, which is what makes the press read as a press.
 *
 * The states are scoped to `enabled:` because a disabled <button> still matches
 * :hover — without it a greyed-out Save still lit up under the cursor.
 */
const BUTTON_VARIANTS = {
  primary:
    'bg-blue-600 text-white shadow-e1 enabled:hover:bg-blue-700 enabled:hover:shadow-e2 enabled:active:bg-blue-800 enabled:active:shadow-none focus-visible:ring-blue-500',
  success:
    'bg-green-600 text-white shadow-e1 enabled:hover:bg-green-700 enabled:hover:shadow-e2 enabled:active:bg-green-800 enabled:active:shadow-none focus-visible:ring-green-500',
  danger:
    'bg-red-600 text-white shadow-e1 enabled:hover:bg-red-700 enabled:hover:shadow-e2 enabled:active:bg-red-800 enabled:active:shadow-none focus-visible:ring-red-500',
  warning:
    'bg-amber-600 text-white shadow-e1 enabled:hover:bg-amber-700 enabled:hover:shadow-e2 enabled:active:bg-amber-800 enabled:active:shadow-none focus-visible:ring-amber-500',
  /* A destructive action that is not the point of the screen — Logout in the
     sidebar, Remove under a branding image. Same soft tint as `IconButton`'s
     red, so the quiet destructive actions all read alike. */
  dangerSoft:
    'bg-red-50 text-red-600 enabled:hover:bg-red-100 enabled:active:bg-red-200 focus-visible:ring-red-500',
  secondary:
    'border border-gray-300 bg-white text-gray-700 shadow-sm enabled:hover:border-gray-400 enabled:hover:bg-gray-50 enabled:active:bg-gray-100 focus-visible:ring-gray-400',
  ghost:
    'text-gray-600 enabled:hover:bg-gray-100 enabled:hover:text-gray-900 enabled:active:bg-gray-200 focus-visible:ring-gray-400',
};

/** Every size keeps a 44px hit area, the smallest a thumb reliably lands on. */
const BUTTON_SIZES = {
  sm: 'min-h-[44px] gap-1.5 px-3.5 py-2 text-sm sm:min-h-[36px]',
  md: 'min-h-[44px] gap-2 px-5 py-2.5',
  lg: 'min-h-[48px] gap-2.5 px-8 py-3',
};

/* Forwards its ref so a dialog can move focus onto a button as it opens — see
   `useDialogBehavior`'s `initialFocusRef`. */
export const Button = forwardRef(
  (
    {
      variant = 'primary',
      size = 'md',
      icon: Icon,
      loading = false,
      disabled = false,
      fullWidth = false,
      className = '',
      children,
      ...rest
    },
    ref
  ) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`inline-flex items-center justify-center rounded-lg font-semibold tracking-tight ${TRANSITION} enabled:active:scale-[0.98] ${FOCUS_RING} disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none ${
        BUTTON_SIZES[size]
      } ${BUTTON_VARIANTS[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {loading ? <FaSpinner className="animate-spin" /> : Icon && <Icon />}
      {children}
    </button>
  )
);
Button.displayName = 'Button';

const ICON_BUTTON_VARIANTS = {
  blue: 'bg-blue-50 text-blue-600 enabled:hover:bg-blue-100 enabled:active:bg-blue-200 focus-visible:ring-blue-500',
  red: 'bg-red-50 text-red-600 enabled:hover:bg-red-100 enabled:active:bg-red-200 focus-visible:ring-red-500',
  green:
    'bg-green-50 text-green-600 enabled:hover:bg-green-100 enabled:active:bg-green-200 focus-visible:ring-green-500',
  gray: 'bg-gray-100 text-gray-600 enabled:hover:bg-gray-200 enabled:active:bg-gray-300 focus-visible:ring-gray-400',
};

/** `md` is a full touch target on a phone; `sm` is for dense image tiles. */
const ICON_BUTTON_SIZES = {
  sm: 'h-9 w-9',
  md: 'h-11 w-11 sm:h-9 sm:w-9',
};

/**
 * Square, soft-tinted action button for table rows and image tiles.
 * `label` is used for both the tooltip and the accessible name.
 *
 * `loading` swaps the icon for a spinner, the same way `Button` does — a row
 * action that takes a moment (building a receipt PDF) has to say so on the
 * table as clearly as it does on the mobile card.
 */
export const IconButton = ({
  icon: Icon,
  label,
  variant = 'blue',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  ...rest
}) => (
  <button
    type="button"
    title={label}
    aria-label={label}
    disabled={disabled || loading}
    aria-busy={loading || undefined}
    className={`inline-flex flex-shrink-0 items-center justify-center rounded-lg ${TRANSITION} enabled:active:scale-95 ${FOCUS_RING_TIGHT} disabled:cursor-not-allowed disabled:opacity-50 ${
      ICON_BUTTON_SIZES[size]
    } ${ICON_BUTTON_VARIANTS[variant]} ${className}`}
    {...rest}
  >
    {loading ? <FaSpinner className="animate-spin" /> : <Icon />}
  </button>
);

/* ------------------------------------------------------------------- tables */

/** The inset ring gives each pill a defined edge without a heavy border. */
const TONES = {
  gray: 'bg-gray-100 text-gray-700 ring-gray-500/20',
  blue: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  green: 'bg-green-50 text-green-700 ring-green-600/20',
  amber: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  red: 'bg-red-50 text-red-700 ring-red-600/20',
};

export const Badge = ({ tone = 'gray', className = '', children }) => (
  <span
    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize ring-1 ring-inset ${TONES[tone]} ${className}`}
  >
    {children}
  </span>
);

/** Bordered, scrollable table shell with a quiet uppercase header row. */
export const DataTable = ({ columns, children }) => (
  <div className={TABLE_SHELL}>
    <table className={TABLE}>
      <thead className={THEAD}>
        <tr>
          {columns.map((column) => (
            <th
              key={column.key}
              scope="col"
              className={`${THEAD_CELL} ${column.className || ''}`}
            >
              {column.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className={TBODY}>{children}</tbody>
    </table>
  </div>
);

export const Tr = ({ className = '', children, ...rest }) => (
  <tr className={`${TRANSITION} hover:bg-blue-50/40 ${className}`} {...rest}>
    {children}
  </tr>
);

export const Td = ({ className = '', children, ...rest }) => (
  <td className={`${TD_CELL} ${className}`} {...rest}>
    {children}
  </td>
);

/** One record rendered as a card, for the mobile breakpoint. */
export const MobileCard = ({ className = '', children }) => (
  <div className={`${MOBILE_CARD} ${className}`}>{children}</div>
);

/** Label/value line inside a MobileCard. */
export const CardRow = ({ label, children, className = '' }) => (
  <div
    className={`flex items-baseline justify-between gap-3 py-1.5 ${className}`}
  >
    <span className={`flex-shrink-0 ${META_LABEL}`}>{label}</span>
    <span className="min-w-0 break-words text-right text-sm font-medium text-gray-800">
      {children}
    </span>
  </div>
);

/**
 * A read-only label/value pair, stacked rather than side by side — the shape a
 * record takes inside a dialog, where there is room to let the value breathe.
 * Same caption as `CardRow`, so one record reads the same in both places.
 */
export const Detail = ({ label, children, className = '' }) => (
  <div className={className}>
    <p className={META_LABEL}>{label}</p>
    <div className="mt-1 text-sm text-gray-800">{children}</div>
  </div>
);

/* ------------------------------------------------------------------- alert */

const ALERT_TONES = {
  info: 'bg-blue-50 text-blue-700',
  success: 'bg-green-50 text-green-700',
  warning: 'bg-amber-50 text-amber-700',
  error: 'bg-red-50 text-red-600',
};

/**
 * Inline feedback that belongs on the page rather than in a dialog — a failed
 * login, an expired session. The tones match `MessageDialog`'s, so the same
 * news reads the same whether it arrives inline or in a modal.
 */
export const Alert = ({ tone = 'info', className = '', children }) => (
  <p
    role="alert"
    className={`rounded-lg px-4 py-3 text-center text-sm font-medium ${
      ALERT_TONES[tone] || ALERT_TONES.info
    } ${className}`}
  >
    {children}
  </p>
);

/* -------------------------------------------------------------------- modal */

/**
 * Content modal sharing its chrome and behaviour with ConfirmDialog /
 * MessageDialog — see dialog.jsx.
 */
export const Modal = ({
  open,
  icon: Icon,
  tone = 'blue',
  title,
  description,
  onClose,
  footer,
  maxWidth = 'max-w-lg',
  children,
}) => {
  useDialogBehavior({ open, onClose });

  if (!open) return null;

  return (
    <div
      className={DIALOG_ROOT}
      role="dialog"
      aria-modal="true"
      aria-labelledby="ui-modal-title"
      onMouseDown={(e) => {
        // Only close when the backdrop itself is clicked, not the panel.
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className={DIALOG_BACKDROP} />

      <div
        className={`${DIALOG_PANEL} flex max-h-[90vh] flex-col overflow-hidden ${maxWidth}`}
      >
        <DialogCloseButton onClick={onClose} />

        <div className="flex items-start gap-3 border-b border-gray-200 p-6 pr-16">
          {Icon && (
            <span className={`${iconCircle(tone)} mt-0.5 h-9 w-9`}>
              <Icon />
            </span>
          )}
          <div className="min-w-0">
            <h2
              id="ui-modal-title"
              className="text-lg font-bold tracking-tight text-gray-900"
            >
              {title}
            </h2>
            {description && (
              <p className="mt-1 truncate text-sm text-gray-500">{description}</p>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">{children}</div>

        {footer && (
          <div className={`${DIALOG_ACTIONS} border-t border-gray-200 bg-gray-50 p-4`}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------- empty */

export const EmptyState = ({ icon: Icon, tone = 'blue', title, message, action }) => (
  <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
    {Icon && (
      <span className={`${iconCircle(tone)} h-14 w-14 text-2xl`}>
        <Icon />
      </span>
    )}
    <h3 className="mt-4 text-base font-semibold text-gray-900">{title}</h3>
    {message && (
      <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-gray-500">{message}</p>
    )}
    {action && <div className="mt-5">{action}</div>}
  </div>
);

/* Screens wait behind a skeleton of the rows or form they are about to show —
   see components/ui/skeletons.jsx. The only spinner left is the one inside a
   Button, where there is no layout to stand in for. */
