import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FaAngleDoubleLeft,
  FaAngleDoubleRight,
  FaArrowLeft,
  FaArrowRight,
  FaChevronDown,
} from 'react-icons/fa';
import { FOCUS_RING_TIGHT, SELECT_CHEVRON, TRANSITION } from './ui/tokens';

/**
 * The admin panel's pagination bar.
 *
 * Sits under any list or table: a rows-per-page picker and the range of rows
 * currently shown on the left, the page controls on the right. Only the
 * current page is rendered as a number — the pill reads "1" on page one, "2"
 * on page two, and so on — with first / previous / next / last around it.
 *
 * Pair it with `usePagination`, which owns the slicing and the page state:
 *
 *   const p = usePagination(items);
 *   ...
 *   {p.pageItems.map(...)}
 *   <Pagination {...p.paginationProps} />
 */

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100];

/** A 44px target on a phone, tightening to the desktop 36px above `sm`. */
const navClass = `inline-flex h-11 w-11 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-600 shadow-sm ${TRANSITION} enabled:hover:border-gray-400 enabled:hover:bg-gray-50 enabled:hover:text-gray-900 enabled:active:scale-90 enabled:active:bg-gray-100 ${FOCUS_RING_TIGHT} focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-300 disabled:shadow-none sm:h-9 sm:w-9`;

const NavButton = ({ icon: Icon, label, ...rest }) => (
  <button type="button" title={label} aria-label={label} className={navClass} {...rest}>
    <Icon className="text-xs" />
  </button>
);

const Pagination = ({
  page,
  pageCount,
  rowsPerPage,
  rowsPerPageOptions = ROWS_PER_PAGE_OPTIONS,
  totalRows,
  rangeStart,
  rangeEnd,
  onPageChange,
  onRowsPerPageChange,
  className = '',
}) => {
  // Nothing to page through and nothing to re-slice: stay out of the way.
  if (totalRows === 0) return null;

  const atStart = page <= 1;
  const atEnd = page >= pageCount;

  return (
    <div
      className={`mt-4 flex flex-col gap-4 border-t border-gray-200 pt-4 text-sm text-gray-600 sm:flex-row sm:items-center sm:justify-between ${className}`}
    >
      <div className="flex items-center gap-3">
        <label htmlFor="rows-per-page" className="whitespace-nowrap">
          Rows per page:
        </label>
        <div className="relative">
          <select
            id="rows-per-page"
            value={rowsPerPage}
            onChange={(e) => onRowsPerPageChange(Number(e.target.value))}
            className={`min-h-[44px] cursor-pointer appearance-none rounded-lg border border-gray-300 bg-white py-1.5 pl-3 pr-9 font-medium text-gray-900 shadow-sm ${TRANSITION} hover:border-gray-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/25 sm:min-h-0`}
          >
            {rowsPerPageOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <FaChevronDown className={SELECT_CHEVRON} />
        </div>
        <span className="whitespace-nowrap text-gray-500">
          {rangeStart}–{rangeEnd} of <span className="font-semibold text-gray-900">{totalRows}</span>
        </span>
      </div>

      <div className="flex items-center gap-3">
        <span className="whitespace-nowrap text-gray-500">
          Page <span className="font-semibold text-gray-900">{page}</span> of{' '}
          <span className="font-semibold text-gray-900">{pageCount}</span>
        </span>
        <div className="flex items-center gap-2">
          <NavButton
            icon={FaAngleDoubleLeft}
            label="First page"
            disabled={atStart}
            onClick={() => onPageChange(1)}
          />
          <NavButton
            icon={FaArrowLeft}
            label="Previous page"
            disabled={atStart}
            onClick={() => onPageChange(page - 1)}
          />
          {/* Only the page you are on is shown, and the number changes with it.
              Its fill is blue-600: the panel has one accent, and the page you
              are on is not a different one. */}
          <span
            aria-current="page"
            aria-label={`Page ${page} of ${pageCount}`}
            className="inline-flex h-11 min-w-[2.75rem] items-center justify-center rounded-lg bg-blue-600 px-3 font-semibold text-white shadow-e1 sm:h-9 sm:min-w-[2.25rem]"
          >
            {page}
          </span>
          <NavButton
            icon={FaArrowRight}
            label="Next page"
            disabled={atEnd}
            onClick={() => onPageChange(page + 1)}
          />
          <NavButton
            icon={FaAngleDoubleRight}
            label="Last page"
            disabled={atEnd}
            onClick={() => onPageChange(pageCount)}
          />
        </div>
      </div>
    </div>
  );
};

/**
 * Page state for a list held in memory.
 *
 * Returns the rows for the current page plus a `paginationProps` bundle to
 * spread straight onto <Pagination />. The page is clamped whenever the list
 * shrinks — deleting the last row of the last page walks you back a page
 * instead of leaving an empty table.
 */
export const usePagination = (items, initialRowsPerPage = ROWS_PER_PAGE_OPTIONS[0]) => {
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(initialRowsPerPage);

  const totalRows = items?.length || 0;
  const pageCount = Math.max(1, Math.ceil(totalRows / rowsPerPage));

  useEffect(() => {
    setPage((current) => Math.min(current, pageCount));
  }, [pageCount]);

  // `page` can be one render ahead of the clamp above, so slice from a safe copy.
  const safePage = Math.min(page, pageCount);
  const start = (safePage - 1) * rowsPerPage;

  const pageItems = useMemo(
    () => (items || []).slice(start, start + rowsPerPage),
    [items, start, rowsPerPage]
  );

  const handleRowsPerPageChange = (value) => {
    setRowsPerPage(value);
    setPage(1);
  };

  return {
    page: safePage,
    pageCount,
    rowsPerPage,
    pageItems,
    setPage,
    paginationProps: {
      page: safePage,
      pageCount,
      rowsPerPage,
      totalRows,
      rangeStart: totalRows === 0 ? 0 : start + 1,
      rangeEnd: Math.min(start + rowsPerPage, totalRows),
      onPageChange: (next) => setPage(Math.min(Math.max(next, 1), pageCount)),
      onRowsPerPageChange: handleRowsPerPageChange,
    },
  };
};

/**
 * Page state for a list the *server* slices.
 *
 * Same bar, same props — the difference is that this hook holds no rows. It
 * owns `page` and `rowsPerPage`, the page passes them to the API, and the API's
 * reported `total` comes back in. Use it wherever the collection can outgrow a
 * single response; `usePagination` above still fits a list already in memory.
 *
 * `resetPage` is what a changed filter calls: a narrowed list should always be
 * read from the top, and page 7 of the old result set is meaningless in the new
 * one.
 */
export const useServerPagination = (
  totalRows = 0,
  initialRowsPerPage = ROWS_PER_PAGE_OPTIONS[0]
) => {
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(initialRowsPerPage);

  const pageCount = Math.max(1, Math.ceil(totalRows / rowsPerPage));

  // Deleting the last row of the last page walks back a page rather than
  // leaving an empty table. Setting state here triggers one more fetch, which
  // returns a smaller pageCount or the same one — so it settles immediately
  // instead of ping-ponging.
  useEffect(() => {
    setPage((current) => Math.min(current, pageCount));
  }, [pageCount]);

  const resetPage = useCallback(() => setPage(1), []);

  const handleRowsPerPageChange = useCallback((value) => {
    setRowsPerPage(value);
    setPage(1);
  }, []);

  const start = (page - 1) * rowsPerPage;

  return {
    page,
    rowsPerPage,
    pageCount,
    setPage,
    resetPage,
    paginationProps: {
      page,
      pageCount,
      rowsPerPage,
      totalRows,
      rangeStart: totalRows === 0 ? 0 : start + 1,
      rangeEnd: Math.min(start + rowsPerPage, totalRows),
      onPageChange: (next) => setPage(Math.min(Math.max(next, 1), pageCount)),
      onRowsPerPageChange: handleRowsPerPageChange,
    },
  };
};

export default Pagination;
