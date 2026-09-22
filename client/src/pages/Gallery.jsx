import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  FaArrowRight,
  FaCalendarAlt,
  FaHandsHelping,
  FaRegCalendarAlt,
  FaRegClock,
  FaRegHeart,
  FaRegImages,
  FaSyncAlt,
  FaUserFriends,
  FaUsers,
} from 'react-icons/fa';
import api from '../lib/api';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import {
  Button,
  EmptyMessage,
  HeroStat,
  Notice,
  PageHero,
  Section,
} from '../components/ui';
import {
  DARK_BAND,
  DARK_BAND_OVERLAY,
  FOCUS_RING,
  HEADING_2,
  MEDIA_TILE,
  TRANSITION,
} from '../components/ui/tokens';
import {
  GalleryFilterBarSkeleton,
  GalleryGridSkeleton,
} from '../components/ui/skeletons';
import { cloudinaryUrl, cloudinarySrcSet } from '../lib/cloudinary';

const itemVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0 },
};

/** How many photos the grid shows before "Load More Photos" is needed. */
const PAGE_SIZE = 9;

const ALL = '__all__';

/**
 * The closing impact band. These are the organisation's headline figures rather
 * than anything the gallery itself can count, so they live here as copy.
 */
const IMPACT_STATS = [
  { icon: FaUsers, value: '1000+', label: 'Families Helped' },
  { icon: FaHandsHelping, value: '20+', label: 'Communities' },
  { icon: FaCalendarAlt, value: '50+', label: 'Events Organized' },
  { icon: FaUserFriends, value: '100+', label: 'Volunteers' },
];

const Gallery = () => {
  const [galleries, setGalleries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [activeAlbum, setActiveAlbum] = useState(ALL);
  const [visible, setVisible] = useState(PAGE_SIZE);

  // Every gallery the admin creates contributes its images to one flat grid,
  // each tagged with the gallery it came from so the filter rail can group them.
  useEffect(() => {
    api
      .get('/gallery')
      .then((res) => setGalleries(res.data || []))
      .catch((err) => {
        console.error(err);
        setError('Failed to load the gallery. Please try again later.');
      })
      .finally(() => setLoading(false));
  }, []);

  const images = useMemo(
    () =>
      galleries.flatMap((gallery) =>
        (gallery.images || []).map((img) => ({
          src: img.url,
          title: gallery.title,
        }))
      ),
    [galleries]
  );

  // One pill per album, plus the "All Photos" pill in front. Albums with no
  // images at all would filter to an empty grid, so they never get a pill.
  const albums = useMemo(
    () =>
      galleries
        .filter((gallery) => (gallery.images || []).length > 0)
        .map((gallery) => ({
          title: gallery.title,
          count: gallery.images.length,
        })),
    [galleries]
  );

  const filtered = useMemo(
    () =>
      activeAlbum === ALL
        ? images
        : images.filter((img) => img.title === activeAlbum),
    [images, activeAlbum]
  );

  const shown = filtered.slice(0, visible);
  const hasMore = visible < filtered.length;

  // A narrower album can hold fewer photos than are already on screen, so the
  // page resets to the first block whenever the filter changes.
  const selectAlbum = (album) => {
    setActiveAlbum(album);
    setVisible(PAGE_SIZE);
  };

  const pillClass = (isActive) =>
    `inline-flex min-h-[44px] items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${TRANSITION} ${FOCUS_RING} focus-visible:ring-blue-500 ${
      isActive
        ? 'bg-blue-600 text-white shadow-e1'
        : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50 hover:text-blue-700'
    }`;

  return (
    <div className="bg-gray-50 pt-16">
      <PageHero
        align="left"
        title="Gallery"
        subtitle="Moments of hope, humanity and impact."
      >
        <div className="mt-8 flex flex-wrap gap-x-10 gap-y-6 sm:mt-10 sm:gap-x-14">
          {/* Photos and Events are counted from what the admin has actually
              uploaded; the other two are the organisation's own figures. */}
          <HeroStat icon={FaRegImages} value={loading ? '—' : images.length} label="Photos" />
          <HeroStat
            icon={FaRegCalendarAlt}
            value={loading ? '—' : albums.length}
            label="Events"
          />
          <HeroStat icon={FaRegClock} value="10+" label="Years of Impact" />
          <HeroStat icon={FaRegHeart} value="1000+" label="Lives Touched" />
        </div>
      </PageHero>

      {/* Gallery Grid */}
      <Section>
        {loading && (
          <>
            <GalleryFilterBarSkeleton />
            <GalleryGridSkeleton />
          </>
        )}

        {!loading && error && <Notice tone="error">{error}</Notice>}

        {!loading && !error && images.length === 0 && (
          <EmptyMessage>No gallery images have been added yet.</EmptyMessage>
        )}

        {!loading && !error && images.length > 0 && (
          <>
            {/* Album filter — only worth showing once there's more than one. */}
            {albums.length > 1 && (
              <div
                className="mb-8 flex flex-wrap items-center gap-3"
                role="group"
                aria-label="Filter photos by album"
              >
                <button
                  type="button"
                  onClick={() => selectAlbum(ALL)}
                  aria-pressed={activeAlbum === ALL}
                  className={pillClass(activeAlbum === ALL)}
                >
                  All Photos
                  <span className="text-xs font-medium opacity-70">
                    {images.length}
                  </span>
                </button>
                {albums.map((album) => (
                  <button
                    key={album.title}
                    type="button"
                    onClick={() => selectAlbum(album.title)}
                    aria-pressed={activeAlbum === album.title}
                    className={pillClass(activeAlbum === album.title)}
                  >
                    {album.title}
                    <span className="text-xs font-medium opacity-70">
                      {album.count}
                    </span>
                  </button>
                ))}
              </div>
            )}

            <div className="columns-1 gap-6 space-y-6 sm:columns-2 lg:columns-3">
              {shown.map((img, idx) => (
                <motion.button
                  type="button"
                  key={`${img.src}-${idx}`}
                  variants={itemVariants}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.5, delay: Math.min(idx % PAGE_SIZE, 6) * 0.06 }}
                  whileHover={{ scale: 1.02 }}
                  className={`${MEDIA_TILE} w-full break-inside-avoid`}
                  onClick={() => {
                    setIndex(idx);
                    setOpen(true);
                  }}
                >
                  {/* Grid tiles are at most a third of the page — the
                      full-size original is only fetched by the lightbox. */}
                  <img
                    src={cloudinaryUrl(img.src, { width: 800 })}
                    srcSet={cloudinarySrcSet(img.src, [400, 800, 1200])}
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    alt={img.title || `Gallery ${idx + 1}`}
                    loading="lazy"
                    decoding="async"
                    className="w-full rounded-xl object-cover"
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 px-4 text-center opacity-0 transition duration-300 group-hover:opacity-100 group-focus:opacity-100">
                    <span className="text-base font-semibold text-white sm:text-lg">
                      View Image
                    </span>
                    {img.title && (
                      <span className="mt-1 text-sm text-blue-50">{img.title}</span>
                    )}
                  </div>
                </motion.button>
              ))}
            </div>

            {/* The rest of the album is already in memory — "load more" only
                reveals it, so the grid never waits on a second request. */}
            {hasMore && (
              <div className="mt-10 flex justify-center">
                <Button
                  variant="primary"
                  size="sm"
                  trailingIcon={FaSyncAlt}
                  onClick={() => setVisible((count) => count + PAGE_SIZE)}
                >
                  Load More Photos
                </Button>
              </div>
            )}
          </>
        )}

        {/* Impact band */}
        <section className="mt-14 rounded-2xl bg-blue-50 px-6 py-8 ring-1 ring-blue-100 sm:mt-16 sm:px-10 sm:py-10">
          <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-12">
            <div>
              <h2 className={`${HEADING_2} text-gray-900`}>
                Our Impact in Pictures
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-gray-600 sm:text-base">
                Every picture tells a story of hope, compassion and change.
              </p>
              <Button
                to="/projects"
                size="sm"
                trailingIcon={FaArrowRight}
                className="mt-6"
              >
                See Our Projects
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-6 sm:grid-cols-4 sm:gap-4">
              {IMPACT_STATS.map(({ icon: Icon, value, label }) => (
                // The same figure Home's counter row prints — blue-600 icon
                // over a gray-900 number — so a statistic reads the same
                // wherever the site shows one.
                <div key={label} className="text-center">
                  <Icon
                    className="mx-auto text-xl text-blue-600 sm:text-2xl"
                    aria-hidden="true"
                  />
                  <p className="mt-3 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                    {value}
                  </p>
                  <p className="mt-1 text-xs text-gray-600 sm:text-sm">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Donate band */}
        <section
          className={`relative isolate mt-6 overflow-hidden rounded-2xl px-6 py-8 sm:mt-8 sm:px-10 ${DARK_BAND}`}
        >
          <div
            className={`absolute inset-0 -z-10 ${DARK_BAND_OVERLAY}`}
            aria-hidden="true"
          />
          <div className="flex flex-col items-center gap-6 text-center md:flex-row md:items-center md:gap-8 md:text-left">
            <span className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-white text-2xl text-blue-700">
              <FaRegHeart aria-hidden="true" />
            </span>
            <div className="flex-1">
              <h2 className={HEADING_2}>Be a Part of the Change</h2>
              <p className="mt-2 text-sm leading-relaxed text-blue-100 sm:text-base">
                Your support helps us create more moments like these.
              </p>
            </div>
            <Button to="/donate" variant="onDark" size="sm" icon={FaRegHeart}>
              Donate Now
            </Button>
          </div>
        </section>
      </Section>

      {/* Lightbox */}
      <Lightbox
        open={open}
        close={() => setOpen(false)}
        index={index}
        slides={shown.map((img) => ({
          // Full-screen view: capped at 1600px and re-encoded, rather than
          // whatever the admin happened to upload.
          src: cloudinaryUrl(img.src, { width: 1600 }),
          title: img.title,
        }))}
        animation={{ fade: 300 }}
      />
    </div>
  );
};

export default Gallery;
