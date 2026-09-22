import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { SURFACE } from './tokens';

/**
 * Loading placeholders for the public site.
 *
 * Every skeleton here mirrors the real markup it stands in for — same widths,
 * heights, radii and grid — so the page doesn't jump when the data lands. The
 * shimmer colours are set once by `SiteSkeletonTheme` at the root of the app
 * (see index.jsx), so individual skeletons never pass colours themselves.
 *
 *   base       gray-200, the colour a real placeholder block would be
 *   highlight  gray-100, the sweep that runs across it
 */

const SKELETON_BASE_COLOR = '#e5e7eb'; // gray-200
const SKELETON_HIGHLIGHT_COLOR = '#f3f4f6'; // gray-100

export const SiteSkeletonTheme = ({ children }) => (
  <SkeletonTheme
    baseColor={SKELETON_BASE_COLOR}
    highlightColor={SKELETON_HIGHLIGHT_COLOR}
    borderRadius="0.5rem"
    duration={1.2}
  >
    {children}
  </SkeletonTheme>
);

/**
 * The same shimmer, re-toned for a dark band.
 *
 * The site-wide gray-200/gray-100 pair disappears into the footer's navy, so
 * the placeholders there are drawn as translucent white instead — the same
 * two-step contrast, read against a dark ground rather than a light one.
 */
export const OnDarkSkeletonTheme = ({ children }) => (
  <SkeletonTheme
    baseColor="rgba(255, 255, 255, 0.10)"
    highlightColor="rgba(255, 255, 255, 0.20)"
    borderRadius="0.5rem"
    duration={1.2}
  >
    {children}
  </SkeletonTheme>
);

/** `n` items, for `.map()` over a skeleton list. */
const range = (n) => Array.from({ length: n }, (_, i) => i);

/* ------------------------------------------------------------------- atoms */

/** A run of text lines, the last one short so it reads as a paragraph. */
const TextSkeleton = ({ lines = 3, className = '' }) => (
  <div className={className}>
    {range(lines).map((i) => (
      <Skeleton
        key={i}
        height={14}
        width={i === lines - 1 ? '70%' : '100%'}
        containerClassName="block"
        className="mb-2"
      />
    ))}
  </div>
);

/** Stand-in for a single line of contact detail (label + value). */
export const ContactLineSkeleton = () => (
  <div className="flex items-start gap-4">
    <Skeleton circle width={40} height={40} />
    <div className="min-w-0 flex-1">
      <Skeleton width="35%" height={14} containerClassName="block" />
      <Skeleton width="70%" height={13} containerClassName="block" className="mt-1.5" />
    </div>
  </div>
);

/* ------------------------------------------------------------------- cards */

/**
 * Matches `ProjectCard`: image on top, title underneath. `detailed` adds the
 * excerpt and meta lines the projects page's cards carry, so that page's
 * placeholder is the height of what lands.
 */
const ProjectCardSkeleton = ({ imageHeight = 'h-56 sm:h-60', detailed = false }) => (
  <div className={`flex h-full flex-col overflow-hidden ${SURFACE}`}>
    {/* A flex container so the block stretches to the tile height exactly,
        with no baseline gap under it. */}
    <Skeleton
      containerClassName={`flex w-full ${imageHeight}`}
      className="!h-full !rounded-none"
    />
    <div className={`flex flex-1 flex-col ${detailed ? 'p-4 sm:p-5' : 'p-4'}`}>
      <Skeleton height={18} width="75%" />
      {detailed && (
        <>
          <Skeleton
            height={13}
            containerClassName="mt-2 block"
            count={2}
            width="100%"
          />
          <Skeleton height={12} width="45%" containerClassName="mt-4 block" />
        </>
      )}
    </div>
  </div>
);

/**
 * A row of project cards at the same breakpoints the Swiper uses
 * (1 / 2 / 3 / 4 across), so the placeholder row is exactly as wide as the
 * carousel that replaces it.
 */
export const ProjectCardRowSkeleton = ({
  count = 4,
  imageHeight = 'h-56 sm:h-60',
  detailed = false,
  columns = 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
}) => (
  <div className={`grid grid-cols-1 gap-6 ${columns}`}>
    {range(count).map((i) => (
      <ProjectCardSkeleton key={i} imageHeight={imageHeight} detailed={detailed} />
    ))}
  </div>
);

/* ------------------------------------------------------------------- pages */

/** Projects page: one heading + card row per category section. */
export const ProjectsPageSkeleton = ({ sections = 3 }) => (
  <div className="space-y-16">
    {range(sections).map((i) => (
      <section key={i}>
        <div className="mb-6 flex items-center justify-between gap-4">
          <Skeleton height={30} width={240} />
          {/* The two slider arrows that sit where a "view all" link would. */}
          <div className="flex gap-2">
            <Skeleton circle width={40} height={40} />
            <Skeleton circle width={40} height={40} />
          </div>
        </div>
        <ProjectCardRowSkeleton imageHeight="h-44 sm:h-48" detailed />
      </section>
    ))}
  </div>
);

/**
 * Gallery page: the pill row that filters the grid by album. One wide bar plus
 * a couple of short ones, so the rail is the shape it will be once the album
 * titles land.
 */
export const GalleryFilterBarSkeleton = () => (
  <div className="mb-8 flex flex-wrap items-center gap-3">
    <Skeleton height={40} width={140} borderRadius="9999px" />
    <Skeleton
      height={40}
      containerClassName="block min-w-[200px] flex-1"
      borderRadius="9999px"
    />
  </div>
);

/**
 * Gallery page: the same `columns-*` masonry the real grid uses, with tiles of
 * varying height so the placeholder doesn't read as a uniform block.
 */
export const GalleryGridSkeleton = ({ count = 9 }) => {
  const HEIGHTS = [220, 300, 260, 340, 240, 290, 320, 250, 270];
  return (
    <div className="columns-1 gap-6 space-y-6 sm:columns-2 lg:columns-3">
      {range(count).map((i) => (
        <Skeleton
          key={i}
          height={HEIGHTS[i % HEIGHTS.length]}
          containerClassName="block w-full break-inside-avoid"
          className="!rounded-xl"
          borderRadius="0.75rem"
        />
      ))}
    </div>
  );
};

/** Home's gallery strip — four landscape tiles, two per row on a phone. */
export const GalleryStripSkeleton = ({ count = 4 }) => (
  <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
    {range(count).map((i) => (
      <Skeleton
        key={i}
        containerClassName="flex h-36 w-full sm:h-44 lg:h-48"
        className="!h-full !rounded-xl"
      />
    ))}
  </div>
);

/** Project details: title block, hero image, photo strip and the closing split. */
export const ProjectDetailsSkeleton = () => (
  <div className="mx-auto max-w-7xl space-y-14 px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
    <Skeleton width={150} height={16} />

    {/* Title + hero image */}
    <div className="flex flex-col items-center gap-8 md:flex-row md:gap-12">
      <div className="w-full space-y-4 md:w-1/2">
        <Skeleton width={110} height={24} borderRadius="9999px" />
        <Skeleton height={36} width="85%" containerClassName="block" />
        <TextSkeleton lines={4} />
      </div>
      <div className="w-full md:w-1/2">
        <Skeleton
          containerClassName="flex h-72 w-full sm:h-80"
          className="!h-full !rounded-xl"
        />
      </div>
    </div>

    {/* Photo strip */}
    <div>
      <Skeleton height={26} width={120} containerClassName="block" className="mb-4" />
      <div className="flex gap-4 overflow-hidden">
        {range(4).map((i) => (
          <Skeleton
            key={i}
            containerClassName="flex h-56 w-72 flex-shrink-0"
            className="!h-full !rounded-xl"
          />
        ))}
      </div>
    </div>

    {/* Mission block + its image */}
    <div className="flex flex-col items-center gap-8 md:flex-row-reverse md:gap-12">
      <div className="w-full space-y-4 md:w-1/2">
        <Skeleton height={30} width="60%" containerClassName="block" />
        <TextSkeleton lines={3} />
        <Skeleton height={48} width={190} borderRadius="0.5rem" />
      </div>
      <div className="w-full md:w-1/2">
        <Skeleton
          containerClassName="flex h-72 w-full sm:h-80"
          className="!h-full !rounded-xl"
        />
      </div>
    </div>
  </div>
);

/**
 * The Suspense fallback for a lazily loaded route: hero band plus a couple of
 * content blocks, so the shell of a page appears immediately on navigation.
 */
export const PageSkeleton = () => (
  <div className="min-h-screen bg-gray-50 pt-16">
    <div className="flex h-56 w-full flex-col items-center justify-center gap-3 bg-gray-200 px-4 sm:h-64 md:h-72">
      <Skeleton
        height={40}
        width={280}
        baseColor="#cbd5e1"
        highlightColor="#e2e8f0"
        containerClassName="block"
      />
      <Skeleton
        height={16}
        width={420}
        baseColor="#cbd5e1"
        highlightColor="#e2e8f0"
        containerClassName="block max-w-full"
      />
    </div>

    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
      <div className="mx-auto mb-10 max-w-3xl text-center">
        <Skeleton height={30} width="55%" containerClassName="block mx-auto" />
        <Skeleton
          height={16}
          width="80%"
          containerClassName="block mx-auto"
          className="mt-3"
        />
      </div>
      <ProjectCardRowSkeleton count={4} />
    </div>
  </div>
);
