import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import {
  MOBILE_CARD,
  SURFACE,
  TABLE,
  TABLE_SHELL,
  TBODY,
  TD_CELL,
  THEAD,
  THEAD_CELL,
} from './tokens';

/**
 * Loading placeholders for the admin panel.
 *
 * Each skeleton mirrors the markup it stands in for — the table skeletons reuse
 * the real `DataTable` header row, and the card skeletons sit inside the same
 * `MobileCard` shell — so a screen keeps its shape while the request is in
 * flight and nothing shifts when the rows arrive.
 *
 * Shimmer colours are set once by `AdminSkeletonTheme` at the root of the panel
 * (see index.jsx), so individual skeletons never pass colours themselves.
 *
 * The shells — table, mobile card, form panel — are the same class strings the
 * real components render, imported from tokens.js. That is what keeps a
 * placeholder lined up column-for-column with the rows that replace it.
 */

const SKELETON_BASE_COLOR = '#e5e7eb'; // gray-200
const SKELETON_HIGHLIGHT_COLOR = '#f3f4f6'; // gray-100

export const AdminSkeletonTheme = ({ children }) => (
  <SkeletonTheme
    baseColor={SKELETON_BASE_COLOR}
    highlightColor={SKELETON_HIGHLIGHT_COLOR}
    borderRadius="0.5rem"
    duration={1.2}
  >
    {children}
  </SkeletonTheme>
);

const range = (n) => Array.from({ length: n }, (_, i) => i);

/* ------------------------------------------------------------------- atoms */

/** One table cell's worth of placeholder, shaped like the value it replaces. */
const Cell = ({ variant, width }) => {
  switch (variant) {
    case 'thumb':
      return <Skeleton width={56} height={56} borderRadius="0.5rem" />;
    case 'badge':
      return <Skeleton width={72} height={26} borderRadius="9999px" />;
    case 'actions':
      return (
        <div className="flex items-center gap-2">
          {range(width || 2).map((i) => (
            <Skeleton key={i} width={36} height={36} borderRadius="0.5rem" />
          ))}
        </div>
      );
    default:
      return <Skeleton height={14} width={width || '80%'} />;
  }
};

/** Sidebar / mobile-header branding, while organization settings load. */
export const BrandSkeleton = () => (
  <div className="flex min-w-0 items-center gap-3">
    <Skeleton circle width={36} height={36} />
    <div className="min-w-0">
      <Skeleton width={130} height={16} containerClassName="block" />
      <Skeleton width={70} height={11} containerClassName="block" className="mt-1" />
    </div>
  </div>
);

/**
 * Whole-page placeholder, used as the Suspense fallback while a route's chunk
 * downloads. It reproduces the shell — sidebar gutter, header block, one card —
 * so the panel does not flash an empty screen between pages.
 */
export const PageSkeleton = () => (
  <div className="flex min-h-screen bg-gray-50">
    <div className="hidden w-64 flex-shrink-0 border-r border-gray-200 bg-white p-4 md:block">
      <BrandSkeleton />
      <div className="mt-8 space-y-3">
        {range(6).map((i) => (
          <Skeleton key={i} height={40} containerClassName="block" />
        ))}
      </div>
    </div>
    <div className="w-full flex-grow p-4 pt-20 md:p-8 md:pt-8">
      <div className="mx-auto max-w-6xl">
        <Skeleton width={220} height={30} containerClassName="block" />
        <Skeleton width={320} height={14} containerClassName="block" className="mt-2" />
        <div className={`mt-6 ${SURFACE} p-6`}>
          <Skeleton height={18} width="30%" containerClassName="block" />
          <div className="mt-4 space-y-3">
            {range(5).map((i) => (
              <Skeleton key={i} height={50} containerClassName="block" />
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

/** Label + control pair, matching `Field` + `Input`. 50px is a control's height. */
const FieldSkeleton = ({ className = '' }) => (
  <div className={className}>
    <Skeleton width="40%" height={14} containerClassName="block" className="mb-1.5" />
    <Skeleton height={50} containerClassName="block" />
  </div>
);

/* ------------------------------------------------------------------ tables */

/**
 * The desktop table placeholder. `columns` takes the page's own column list,
 * each entry extended with a `variant` so the cell is shaped like its value.
 */
const TableSkeleton = ({ columns, rows = 5 }) => (
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
      <tbody className={TBODY}>
        {range(rows).map((row) => (
          <tr key={row}>
            {columns.map((column) => (
              <td key={column.key} className={TD_CELL}>
                <Cell variant={column.variant} width={column.width} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

/** The mobile card placeholder that pairs with `TableSkeleton`. */
const MobileCardsSkeleton = ({
  cards = 3,
  media = false,
  lines = 3,
  actions = 2,
}) => (
  <div className="grid gap-4">
    {range(cards).map((card) => (
      <div key={card} className={MOBILE_CARD}>
        {media && (
          <Skeleton
            containerClassName="flex h-44 w-full"
            className="!h-full !rounded-lg"
          />
        )}
        <Skeleton
          height={18}
          width="60%"
          containerClassName="block"
          className={media ? 'mt-3' : ''}
        />
        <div className="mt-2 space-y-2">
          {range(lines).map((line) => (
            <div key={line} className="flex items-baseline justify-between gap-3">
              <Skeleton width={70} height={11} />
              <Skeleton width={110} height={13} />
            </div>
          ))}
        </div>
        {/* Two actions sit side by side; a third wraps onto its own full-width
            row, which is exactly what the loaded card does. */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          {range(actions).map((action) => (
            <Skeleton
              key={action}
              height={36}
              containerClassName={`block ${
                action === actions - 1 && actions % 2 ? 'col-span-2' : ''
              }`}
            />
          ))}
        </div>
      </div>
    ))}
  </div>
);

/**
 * The pairing every list screen uses: table above `md`, cards below it — the
 * same two blocks the loaded page renders.
 */
const DataListSkeleton = ({
  columns,
  rows = 5,
  cards = 3,
  media = false,
  lines = 3,
  actions = 2,
}) => (
  <>
    <div className="hidden md:block">
      <TableSkeleton columns={columns} rows={rows} />
    </div>
    <div className="md:hidden">
      <MobileCardsSkeleton
        cards={cards}
        media={media}
        lines={lines}
        actions={actions}
      />
    </div>
  </>
);

/* ------------------------------------------------- per-screen list shapes */

const PROJECT_COLUMNS = [
  { key: 'image', label: 'Image', className: 'w-24', variant: 'thumb' },
  { key: 'name', label: 'Name', width: '65%' },
  { key: 'category', label: 'Category', variant: 'badge' },
  { key: 'actions', label: 'Actions', className: 'w-32', variant: 'actions', width: 2 },
];

export const ProjectListSkeleton = () => (
  <DataListSkeleton columns={PROJECT_COLUMNS} media lines={1} />
);

const GALLERY_COLUMNS = [
  { key: 'image', label: 'Cover', className: 'w-24', variant: 'thumb' },
  { key: 'title', label: 'Title', width: '65%' },
  { key: 'count', label: 'Images', variant: 'badge' },
  { key: 'actions', label: 'Actions', className: 'w-32', variant: 'actions', width: 2 },
];

export const GalleryListSkeleton = () => (
  <DataListSkeleton columns={GALLERY_COLUMNS} media lines={1} />
);

const MESSAGE_COLUMNS = [
  { key: 'name', label: 'Name', width: '60%' },
  { key: 'email', label: 'Email', width: '75%' },
  { key: 'date', label: 'Date & Time', width: '70%' },
  { key: 'actions', label: 'Actions', className: 'w-40', variant: 'actions', width: 3 },
];

export const MessageListSkeleton = () => (
  <DataListSkeleton columns={MESSAGE_COLUMNS} lines={2} actions={3} />
);

const DONATION_COLUMNS = [
  { key: 'name', label: 'Donor', width: '70%' },
  { key: 'mobile', label: 'Mobile', width: '80%' },
  { key: 'amount', label: 'Amount', width: '60%' },
  { key: 'type', label: 'Type', variant: 'badge' },
  { key: 'date', label: 'Date', width: '85%' },
  { key: 'payment', label: 'Payment ID', width: '90%' },
  { key: 'actions', label: 'Actions', className: 'w-32', variant: 'actions', width: 2 },
];

export const DonationListSkeleton = () => (
  <DataListSkeleton columns={DONATION_COLUMNS} lines={4} />
);

/* ------------------------------------------------------------------- forms */

/** A `Card`-shaped panel with a heading row and `fields` form rows. */
const FormCardSkeleton = ({
  fields = 4,
  columns = 2,
  className = '',
  children,
}) => (
  <section className={`${SURFACE} p-6 sm:p-8 ${className}`}>
    <div className="mb-6 flex items-start gap-3 border-b border-gray-200 pb-4">
      <Skeleton circle width={36} height={36} />
      <div className="min-w-0 flex-1">
        <Skeleton width={190} height={18} containerClassName="block" />
        <Skeleton
          width="55%"
          height={13}
          containerClassName="block"
          className="mt-1.5"
        />
      </div>
    </div>
    {children || (
      <div
        className={`grid grid-cols-1 gap-5 ${columns === 2 ? 'sm:grid-cols-2' : ''}`}
      >
        {range(fields).map((i) => (
          <FieldSkeleton key={i} />
        ))}
      </div>
    )}
  </section>
);

/**
 * Organization Settings: the two grids of cards the form renders — General
 * beside Branding, then SEO beside Social. Laid out here exactly as the form
 * lays them out, so nothing jumps sideways when the settings arrive.
 */
export const SettingsFormSkeleton = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <FormCardSkeleton fields={8} className="lg:col-span-2" />
      <FormCardSkeleton fields={2} columns={1} />
    </div>
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <FormCardSkeleton fields={3} columns={1} />
      <FormCardSkeleton fields={4} />
    </div>
    <div className="flex justify-end">
      <Skeleton width={160} height={44} />
    </div>
  </div>
);

/** The two-step progress rail Upload Project shows above its card. */
const StepperSkeleton = () => (
  <div className="mb-8 flex items-center justify-center gap-3">
    {range(2).map((i) => (
      <div key={i} className="flex items-center gap-3">
        <div className="flex flex-col items-center">
          <Skeleton circle width={40} height={40} />
          <Skeleton width={80} height={12} containerClassName="block" className="mt-2" />
        </div>
        {i === 0 && <Skeleton width={48} height={2} containerClassName="mb-6 block" />}
      </div>
    ))}
  </div>
);

/**
 * Upload Project / Upload Gallery, while an existing record is fetched for
 * editing. `stepper` and `actions` mirror what the screen underneath renders —
 * Upload Project has a step rail and a Back button, Upload Gallery has neither.
 */
export const UploadFormSkeleton = ({
  fields = 3,
  tiles = 4,
  stepper = false,
  actions = 1,
}) => (
  <>
    {stepper && <StepperSkeleton />}
    <FormCardSkeleton>
      <div className="space-y-5">
        {range(fields).map((i) => (
          <FieldSkeleton key={i} />
        ))}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {range(tiles).map((i) => (
            <Skeleton
              key={i}
              containerClassName="flex h-32 w-full"
              className="!h-full !rounded-lg"
            />
          ))}
        </div>
        <div className="flex justify-end gap-3 border-t border-gray-200 pt-6">
          {actions > 1 && <Skeleton width={110} height={44} />}
          <Skeleton width={140} height={44} />
        </div>
      </div>
    </FormCardSkeleton>
  </>
);
