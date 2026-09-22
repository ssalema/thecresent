import React, { useEffect, useState } from 'react';
import { FaChevronDown, FaUndo } from 'react-icons/fa';
import { controlClass, FOCUS_RING_TIGHT, LABEL, TRANSITION } from './ui/tokens';

/**
 * The filter strip that sits directly above a list or table.
 *
 * One labelled control per filter, laid out in a row on desktop and stacked on
 * a phone, with a reset button pinned to the end. The controls are slightly
 * more compact than the form fields in ui.jsx — this is a toolbar, not a form —
 * but they share the same border, radius and focus ring.
 *
 *   <FilterBar onReset={reset} canReset={dirty}>
 *     <FilterField label="Search Donor">
 *       <FilterInput placeholder="Name / Mobile" ... />
 *     </FilterField>
 *     <FilterField label="Type">
 *       <FilterSelect ...>...</FilterSelect>
 *     </FilterField>
 *   </FilterBar>
 *
 * Pair it with `PeriodOptions` / `DateRangeFields` / `periodRange` below for the
 * "Date" filter, and with `useDebounced` for any search box that reaches the
 * API rather than an array already in memory.
 */

/**
 * The toolbar's controls are the form controls from tokens.js at their compact
 * size — same outline, hover, focus and radius as a field on a form, one step
 * shorter so the strip doesn't crowd the table under it.
 */
const filterControl = controlClass(false, 'sm');

export const FilterInput = ({ className = '', ...rest }) => (
  <input type="text" className={`${filterControl} ${className}`} {...rest} />
);

/* -------------------------------------------------------------- date filter */

/** Rolling windows, measured back from "now" each time the filter runs. */
const PERIOD_DAYS = {
  today: 1,
  week: 7,
  month: 30,
};

/** The blank date filter: spread it into a page's EMPTY_FILTERS. */
export const EMPTY_PERIOD = { period: '', from: '', to: '' };

/** The <option> list for the Date select. */
export const PeriodOptions = () => (
  <>
    <option value="">All Time</option>
    <option value="today">Last 24 Hours</option>
    <option value="week">Last 7 Days</option>
    <option value="month">Last 30 Days</option>
    <option value="custom">Custom Date</option>
  </>
);

/**
 * Turn the current filter values into an absolute `{ from, to }` instant pair
 * for the API, as ISO strings, with `''` for an open end.
 *
 * The lists are filtered by the server now, so the date filter has to cross the
 * wire — and it has to cross it as an instant, not as "last 7 days". Resolving
 * the window here keeps it in the timezone the admin is actually reading the
 * dates in: "Last 24 Hours" means 24 hours before *their* now, and a custom
 * From of the 5th means midnight on the 5th where they are sitting, not UTC.
 */
export const periodRange = ({ period, from, to }) => {
  if (period === 'custom') {
    return {
      // Whole days: a From of the 5th keeps everything from 00:00 that morning,
      // a To of the 5th keeps the whole day.
      from: from ? new Date(`${from}T00:00:00`).toISOString() : '',
      to: to ? new Date(`${to}T23:59:59.999`).toISOString() : '',
    };
  }

  const days = PERIOD_DAYS[period];
  if (!days) return { from: '', to: '' };

  return {
    from: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString(),
    to: '',
  };
};

/**
 * A value that settles before it is used.
 *
 * The search box now drives a network request, so without this every keystroke
 * is a query. 350ms is long enough that typing a donor's name is one request
 * rather than eight, and short enough that it still feels like it is keeping up.
 */
export const useDebounced = (value, delay = 350) => {
  const [settled, setSettled] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setSettled(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return settled;
};

/**
 * The From / To pair shown once "Custom Date" is picked.
 *
 * Returns an array rather than a fragment so the two fields stay separate
 * children of FilterBar's grid and line up with the selects beside them.
 */
export const DateRangeFields = ({ idPrefix, from, to, onChange }) => [
  <FilterField key="from" label="From" htmlFor={`${idPrefix}-from`}>
    <FilterInput
      id={`${idPrefix}-from`}
      type="date"
      value={from}
      max={to || undefined}
      onChange={(e) => onChange('from', e.target.value)}
    />
  </FilterField>,
  <FilterField key="to" label="To" htmlFor={`${idPrefix}-to`}>
    <FilterInput
      id={`${idPrefix}-to`}
      type="date"
      value={to}
      min={from || undefined}
      onChange={(e) => onChange('to', e.target.value)}
    />
  </FilterField>,
];

export const FilterSelect = ({ className = '', children, ...rest }) => (
  <div className="relative">
    <select
      className={`${filterControl} cursor-pointer appearance-none pr-9 ${className}`}
      {...rest}
    >
      {children}
    </select>
    <FaChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400" />
  </div>
);

/**
 * Label above a single filter control — the same `LABEL` a form field carries,
 * so "Search Donor" over the toolbar and "Donor Name" on a form are set the
 * same way. The toolbar's controls are already one step shorter than a form's;
 * making its labels heavier as well was the only place in the panel where the
 * same element was styled two ways.
 */
export const FilterField = ({ label, htmlFor, children, className = '' }) => (
  <div className={`min-w-0 ${className}`}>
    <label htmlFor={htmlFor} className={LABEL}>
      {label}
    </label>
    {children}
  </div>
);

// Tailwind needs the class names spelled out, so the widths are looked up.
const COLUMN_CLASSES = {
  1: '',
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-2 lg:grid-cols-3',
  4: 'sm:grid-cols-2 lg:grid-cols-4',
};

export const FilterBar = ({ children, onReset, canReset = true, className = '' }) => {
  const count = React.Children.toArray(children).length;
  const columns = COLUMN_CLASSES[Math.min(count, 4)] || COLUMN_CLASSES[4];

  return (
    <div
      className={`mb-6 flex flex-col gap-4 rounded-xl border border-gray-200 bg-gray-50 p-4 sm:flex-row sm:items-end ${className}`}
    >
      <div className={`grid flex-1 gap-4 ${columns}`}>{children}</div>
      {onReset && (
        <button
          type="button"
          onClick={onReset}
          disabled={!canReset}
          title="Reset filters"
          aria-label="Reset filters"
          className={`inline-flex min-h-[44px] w-full flex-shrink-0 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white text-gray-500 shadow-sm ${TRANSITION} enabled:hover:border-gray-400 enabled:hover:bg-gray-50 enabled:hover:text-gray-700 enabled:active:scale-95 enabled:active:bg-gray-100 ${FOCUS_RING_TIGHT} focus-visible:ring-gray-400 disabled:cursor-not-allowed disabled:text-gray-300 sm:h-[42px] sm:min-h-0 sm:w-[42px]`}
        >
          <FaUndo />
          <span className="sm:hidden">Reset filters</span>
        </button>
      )}
    </div>
  );
};
