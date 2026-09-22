import { useEffect, useMemo, useRef, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectFade } from 'swiper/modules';
import { motion, useInView } from 'framer-motion';
import {
  FaArrowLeft,
  FaArrowRight,
  FaBook,
  FaEye,
  FaHandHoldingHeart,
  FaHeart,
  FaHeartbeat,
  FaPlay,
  FaQuoteLeft,
  FaRegCalendarAlt,
  FaRegFileAlt,
  FaShieldAlt,
  FaTools,
  FaUsers,
} from 'react-icons/fa';
import api from '../lib/api';
import Lightbox from 'yet-another-react-lightbox';
import 'swiper/css';
import 'swiper/css/effect-fade';
import 'yet-another-react-lightbox/styles.css';

import hero1 from '../assets/hero1.png';
import hero2 from '../assets/hero2.png';
import hero3 from '../assets/hero3.png';
import orgImg from '../assets/org.png';
import ctaImg from '../assets/hero4.png';
import { useOrganization } from '../context/OrganizationContext';
import {
  Button,
  Card,
  EmptyMessage,
  Eyebrow,
  IconBadge,
  ProjectCard,
  Section,
  SectionHeading,
  SliderArrow,
  SliderProgress,
  TwoToneHeading,
} from '../components/ui';
import {
  DARK_BAND,
  DARK_BAND_OVERLAY,
  FOCUS_RING,
  MEDIA_TILE,
  TRANSITION,
} from '../components/ui/tokens';
import {
  GalleryStripSkeleton,
  ProjectCardRowSkeleton,
} from '../components/ui/skeletons';
import { cloudinaryUrl, cloudinarySrcSet } from '../lib/cloudinary';

const slides = [
  { id: 1, img: hero1 },
  { id: 2, img: hero2 },
  { id: 3, img: hero3 },
];

const stats = [
  { icon: FaUsers, value: 12000, suffix: '+', label: 'Beneficiaries Reached' },
  { icon: FaRegFileAlt, value: 50, suffix: '+', label: 'Community Projects' },
  { icon: FaRegCalendarAlt, value: 15, suffix: '', label: 'Years of Service' },
  { icon: FaHeart, value: 100, suffix: '+', label: 'Volunteers Engaged' },
];

/** The four areas of work that stand beside the About copy. */
const FOCUS_AREAS = [
  {
    icon: FaBook,
    title: 'Education for All',
    body: 'We promote quality education and learning opportunities for every child.',
  },
  {
    icon: FaHeartbeat,
    title: 'Healthcare Support',
    body: 'We provide access to basic healthcare and wellness programs.',
  },
  {
    icon: FaTools,
    title: 'Livelihood & Skills',
    body: 'We empower people with skills and resources for a better livelihood.',
  },
  {
    icon: FaUsers,
    title: 'Community Development',
    body: 'We work hand-in-hand with communities to create lasting change.',
  },
];

/** The three promises printed under the donate call to action. */
const TRUST_POINTS = [
  { icon: FaShieldAlt, label: 'Secure Donation' },
  { icon: FaEye, label: '100% Transparency' },
  { icon: FaHandHoldingHeart, label: 'Real Impact' },
];

/** How many photographs the gallery rail carries before it repeats itself. */
const MIN_MARQUEE_TILES = 8;

/** "Aug 2025" — the only date a project record actually carries. */
const monthYear = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? null
    : date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
};

// Counts up from zero the first time the number scrolls into view.
const Counter = ({ value, suffix }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return undefined;

    const duration = 1600;
    const start = performance.now();
    let frame;

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      // Ease out so the number decelerates into its final value.
      setCount(Math.round(value * (1 - Math.pow(1 - progress, 3))));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [inView, value]);

  return (
    <span ref={ref}>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
};

const Home = () => {
  const organization = useOrganization();
  const name = organization.organizationName || 'The Crescent Foundation';
  const youtube = organization.social?.youtube;

  const [projects, setProjects] = useState([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [galleryImages, setGalleryImages] = useState([]);
  const [galleryLoading, setGalleryLoading] = useState(true);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [activeProject, setActiveProject] = useState(0);
  const [projectsPaused, setProjectsPaused] = useState(false);
  const projectSwiper = useRef(null);
  // Fills are written straight to the DOM so the autoplay tick never re-renders
  // React — the same wiring the projects page's carousels use.
  const fillRefs = useRef([]);

  const setFill = (index, value) => {
    const el = fillRefs.current[index];
    // Width (not scaleX) so the shimmer sweep inside the fill isn't squashed.
    if (el) el.style.width = `${Math.min(Math.max(value, 0), 1) * 100}%`;
  };

  const resetFills = () => {
    fillRefs.current.forEach((_, i) => setFill(i, 0));
  };

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await api.get('/projects');
        const currentProjects = res.data
          .filter((p) => p.category === 'current')
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // newest first
        setProjects(currentProjects);
      } catch (err) {
        console.error('Failed to fetch projects:', err);
      } finally {
        setProjectsLoading(false);
      }
    };
    fetchProjects();
  }, []);

  // Gallery rail — the first few images the admin has published.
  useEffect(() => {
    const fetchGallery = async () => {
      try {
        const res = await api.get('/gallery');
        const images = (res.data || [])
          .flatMap((gallery) =>
            (gallery.images || []).map((img) => ({
              src: img.url,
              title: gallery.title,
            }))
          )
          .slice(0, 12);
        setGalleryImages(images);
      } catch (err) {
        console.error('Failed to fetch gallery:', err);
      } finally {
        setGalleryLoading(false);
      }
    };
    fetchGallery();
  }, []);

  /**
   * The drifting rail is one list printed twice: translating the track by half
   * its width lands exactly on the copy, so the loop has no seam. A handful of
   * photographs is repeated up to a minimum first, otherwise a two-image
   * gallery would leave the rail half empty between passes.
   */
  const marquee = useMemo(() => {
    if (galleryImages.length === 0) return { tiles: [], half: 0, duration: '0s' };

    const base = [];
    while (base.length < MIN_MARQUEE_TILES) {
      galleryImages.forEach((img, index) => base.push({ ...img, index }));
    }

    return {
      tiles: [...base, ...base],
      half: base.length,
      // A constant speed however many photographs the rail is carrying.
      duration: `${base.length * 5}s`,
    };
  }, [galleryImages]);

  const openLightbox = (index) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  return (
    <div className="bg-white pt-16">
      {/* ------------------------------------------------------------- hero */}
      <section className="relative isolate overflow-hidden bg-gradient-to-br from-blue-50 via-white to-white">
        {/* The photograph is a band across the top of a phone and the right
            half of the band on a wide screen — one carousel either way, moved
            by the breakpoint rather than rendered twice. */}
        <div className="relative h-64 w-full overflow-hidden sm:h-80 lg:absolute lg:inset-y-0 lg:right-0 lg:h-auto lg:w-[52%]">
          <Swiper
            modules={[Autoplay, EffectFade]}
            effect="fade"
            fadeEffect={{ crossFade: true }}
            autoplay={{ delay: 5000, disableOnInteraction: false }}
            loop
            allowTouchMove={false}
            className="h-full w-full"
          >
            {slides.map((slide) => (
              <SwiperSlide key={slide.id}>
                <img src={slide.img} alt="" className="h-full w-full object-cover" />
              </SwiperSlide>
            ))}
          </Swiper>
          {/* Fades into the page ground on the side the copy sits, so the
              photograph joins the band instead of being pasted onto it. */}
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/60 via-transparent to-white/80 lg:bg-gradient-to-r lg:from-white lg:via-white/20 lg:to-transparent"
            aria-hidden="true"
          />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 pb-32 pt-10 sm:px-6 sm:pb-40 sm:pt-14 lg:px-8 lg:pb-44 lg:pt-28">
          <motion.div
            // Narrower at the breakpoint where the photograph first takes the
            // right half of the band, so the copy and the picture never meet.
            className="max-w-xl lg:max-w-md lg:pr-8 xl:max-w-lg"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          >
            <Eyebrow>Together, we</Eyebrow>

            <h1 className="mt-5 text-4xl font-bold leading-[1.08] tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
              Create Lasting
              <span className="block text-blue-700">Change</span>
            </h1>

            <p className="mt-5 max-w-md text-sm leading-relaxed text-gray-600 sm:text-base">
              We work with communities to provide essential resources, support and
              opportunities for a better, more sustainable tomorrow.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Button to="/donate" icon={FaHeart}>
                Donate Now
              </Button>
              <Button to="/projects" variant="secondary" trailingIcon={FaArrowRight}>
                Explore Our Work
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ------------------------------------------- impact counters, lifted
          over the foot of the hero so the two bands read as one unit. */}
      <div className="relative z-10 mx-auto -mt-24 max-w-7xl px-4 sm:-mt-28 sm:px-6 lg:px-8">
        <motion.div
          className="overflow-hidden rounded-2xl bg-white shadow-e3 ring-1 ring-gray-900/5"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          {/* A one-pixel gap over a grey ground draws the dividers at any
              column count, without borders that have to be undone per cell. */}
          <div className="grid grid-cols-1 gap-px bg-gray-200 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="flex flex-col items-center gap-2 bg-white px-6 py-7 text-center"
              >
                <stat.icon
                  className="text-2xl text-blue-600 sm:text-3xl"
                  aria-hidden="true"
                />
                <p className="text-2xl font-bold leading-none tracking-tight text-gray-900 sm:text-3xl">
                  <Counter value={stat.value} suffix={stat.suffix} />
                </p>
                <p className="text-sm text-gray-600">{stat.label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ------------------------------------------------------------ about */}
      <Section containerClassName="grid items-center gap-10 lg:grid-cols-12 lg:gap-12">
        <motion.div
          className="relative lg:col-span-4"
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
        >
          <img
            src={orgImg}
            alt={`${name} at work`}
            className="h-64 w-full rounded-2xl object-cover shadow-e3 sm:h-80 lg:h-[26rem]"
          />
          {/* Only offered when the organisation has actually published a
              channel to watch — there is no story behind a dead button. */}
          {youtube && (
            <a
              href={youtube}
              target="_blank"
              rel="noopener noreferrer"
              className={`absolute bottom-4 left-4 inline-flex items-center gap-3 rounded-full bg-white/95 py-2 pl-2 pr-5 text-sm font-semibold text-gray-900 shadow-e2 backdrop-blur-sm ${TRANSITION} hover:bg-white hover:shadow-e3 ${FOCUS_RING} focus-visible:ring-blue-500`}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-white">
                <FaPlay className="ml-0.5 text-xs" aria-hidden="true" />
              </span>
              Watch Our Story
            </a>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          className="lg:col-span-4"
        >
          <TwoToneHeading
            accent="About"
            lead={name}
            accentFirst
            className="text-3xl sm:text-4xl"
          />
          <p className="mt-4 text-base leading-relaxed text-gray-600">
            {name} is a non-profit organization dedicated to creating sustainable
            solutions that improve lives. We work in the areas of education, health,
            community development and social empowerment, with a vision of a brighter
            and more equitable tomorrow.
          </p>

          <Button to="/about" trailingIcon={FaArrowRight} className="mt-8">
            Know More About Us
          </Button>
        </motion.div>

        <motion.dl
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          className="divide-y divide-gray-200 lg:col-span-4"
        >
          {FOCUS_AREAS.map((item) => (
            <div key={item.title} className="flex gap-4 py-5 first:pt-0 last:pb-0">
              <IconBadge icon={item.icon} />
              <div>
                <dt className="font-semibold text-gray-900">{item.title}</dt>
                <dd className="mt-1 text-sm leading-relaxed text-gray-600">
                  {item.body}
                </dd>
              </div>
            </div>
          ))}
        </motion.dl>
      </Section>

      {/* --------------------------------------------------------- projects */}
      <Section className="bg-gray-50">
        <div className="mx-auto mb-8 flex max-w-3xl flex-col items-center text-center sm:mb-10">
          <Eyebrow rule={false}>What we do</Eyebrow>
          <SectionHeading
            title="Our Ongoing Projects"
            subtitle="The work happening on the ground right now."
            className="mt-2"
          />
        </div>

        {projectsLoading && (
          <ProjectCardRowSkeleton
            count={4}
            columns="sm:grid-cols-2 lg:grid-cols-4"
            imageHeight="h-44 sm:h-48"
            detailed
          />
        )}

        {!projectsLoading && projects.length === 0 && (
          <EmptyMessage>No projects running currently.</EmptyMessage>
        )}

        {!projectsLoading && projects.length > 0 && (
          <div className="relative">
            <Swiper
              modules={[Autoplay]}
              slidesPerView={1}
              spaceBetween={24}
              speed={700}
              autoplay={{
                delay: 5000,
                disableOnInteraction: false,
                pauseOnMouseEnter: true,
              }}
              loop={projects.length > 1}
              breakpoints={{
                640: { slidesPerView: 2 },
                1024: { slidesPerView: 3 },
                1280: { slidesPerView: 4 },
              }}
              onSlideChange={(swiper) => {
                setActiveProject(swiper.realIndex);
                resetFills();
              }}
              // Swiper owns the autoplay clock, so the bar stays in lockstep
              // with it — including the pause while the pointer is over the row.
              onAutoplayTimeLeft={(swiper, _time, progress) => {
                setFill(swiper.realIndex, 1 - progress);
              }}
              onAutoplayPause={() => setProjectsPaused(true)}
              onAutoplayResume={() => setProjectsPaused(false)}
              onSwiper={(swiper) => (projectSwiper.current = swiper)}
              className="w-full"
            >
              {projects.map((project) => {
                const date = monthYear(project.createdAt);
                return (
                  <SwiperSlide key={project._id} className="h-auto">
                    <ProjectCard
                      project={project}
                      to={`/projects/${project._id}`}
                      imageHeight="h-44 sm:h-48"
                      badge="Ongoing"
                      badgeTone="green"
                      description={project.description}
                      meta={date ? [{ icon: FaRegCalendarAlt, label: date }] : []}
                    />
                  </SwiperSlide>
                );
              })}
            </Swiper>

            {/* The arrows sit off the row on a wide screen and tuck onto its
                edges where there is no margin to spare. */}
            {projects.length > 1 && (
              <>
                {/* The arrow lifts on hover with its own transform, so the
                    centring on the row's edge belongs to a wrapper. */}
                <span className="absolute -left-2 top-1/2 z-10 -translate-y-1/2 lg:-left-5">
                  <SliderArrow
                    icon={FaArrowLeft}
                    label="Previous project"
                    onClick={() => projectSwiper.current?.slidePrev()}
                  />
                </span>
                <span className="absolute -right-2 top-1/2 z-10 -translate-y-1/2 lg:-right-5">
                  <SliderArrow
                    icon={FaArrowRight}
                    label="Next project"
                    onClick={() => projectSwiper.current?.slideNext()}
                  />
                </span>
              </>
            )}

            {projects.length > 1 && (
              <SliderProgress
                className="mt-7"
                items={projects.map((project, index) => ({
                  key: project._id || index,
                  label: project.name,
                }))}
                activeIndex={activeProject}
                isPaused={projectsPaused}
                registerFill={(index, el) => (fillRefs.current[index] = el)}
                onSelect={(index) => {
                  projectSwiper.current?.slideToLoop(index);
                  setActiveProject(index);
                  resetFills();
                  projectSwiper.current?.autoplay?.start();
                }}
              />
            )}
          </div>
        )}

        <div className="mt-10 flex justify-center">
          <Button to="/projects" variant="outline" size="sm" trailingIcon={FaArrowRight}>
            View All Projects
          </Button>
        </div>
      </Section>

      {/* ---------------------------------------------------------- gallery */}
      <Section>
        <div className="mx-auto mb-8 flex max-w-3xl flex-col items-center text-center sm:mb-10">
          <Eyebrow rule={false}>Moments of impact</Eyebrow>
          <SectionHeading
            title="Moments from Our Work"
            subtitle="Real stories. Real impact. Real people."
            className="mt-2"
          />
        </div>

        {galleryLoading && <GalleryStripSkeleton />}

        {!galleryLoading && galleryImages.length === 0 && (
          <EmptyMessage>No photographs published yet.</EmptyMessage>
        )}

        {!galleryLoading && galleryImages.length > 0 && (
          /* Full-bleed: the rail runs off both edges of the page, so the drift
             reads as a strip passing by rather than a row sliding inside a box.
             It pauses under the pointer and while anything on it holds focus,
             so a photograph can always be caught and opened. */
          <div className="marquee-rail relative -mx-4 sm:-mx-6 lg:-mx-8">
            <div
              className="marquee-track flex w-max gap-4 sm:gap-6"
              style={{ '--marquee-duration': marquee.duration }}
            >
              {marquee.tiles.map((img, position) => {
                // The second pass is the same photographs again — decorative,
                // so it is kept out of the tab order and the accessible tree.
                const isCopy = position >= marquee.half;
                return (
                  <button
                    key={`${img.src}-${position}`}
                    type="button"
                    tabIndex={isCopy ? -1 : undefined}
                    aria-hidden={isCopy || undefined}
                    onClick={() => openLightbox(img.index)}
                    className={`${MEDIA_TILE} w-[280px] flex-shrink-0 sm:w-[360px] lg:w-[420px]`}
                  >
                    <img
                      src={cloudinaryUrl(img.src, { width: 800 })}
                      srcSet={cloudinarySrcSet(img.src, [400, 800, 1200])}
                      sizes="(min-width: 1024px) 420px, (min-width: 640px) 360px, 280px"
                      alt={img.title || `Gallery ${img.index + 1}`}
                      loading="lazy"
                      decoding="async"
                      className="h-52 w-full object-cover transition duration-500 ease-standard group-hover:scale-105 sm:h-64 lg:h-72"
                    />
                    <span className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 px-3 text-center opacity-0 transition duration-300 group-hover:opacity-100 group-focus:opacity-100">
                      <span className="text-sm font-semibold text-white">View Image</span>
                      {img.title && (
                        <span className="mt-1 line-clamp-1 text-xs text-blue-50">
                          {img.title}
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-10 flex justify-center">
          <Button to="/gallery" variant="outline" size="sm" trailingIcon={FaArrowRight}>
            View Full Gallery
          </Button>
        </div>

        {/* The lightbox walks everything the admin published, not only what
            happens to be on screen as the rail drifts past. */}
        <Lightbox
          open={lightboxOpen}
          close={() => setLightboxOpen(false)}
          index={lightboxIndex}
          slides={galleryImages.map((img) => ({
            src: cloudinaryUrl(img.src, { width: 1600 }),
            title: img.title,
          }))}
          animation={{ fade: 300 }}
        />
      </Section>

      {/* -------------------------------------------------------------- cta */}
      <Section
        className="bg-gray-50"
        containerClassName="grid items-stretch gap-8 lg:grid-cols-12"
      >
        <Card
          as="figure"
          tone="blue"
          className="flex flex-col justify-center lg:col-span-5"
        >
          <FaQuoteLeft className="text-2xl text-blue-500" aria-hidden="true" />
          <blockquote className="mt-4 text-base leading-relaxed text-gray-700 sm:text-lg">
            Real change happens when people care — and keep caring long after the
            headlines move on. Every rupee given here is spent where it was promised.
          </blockquote>
          <figcaption className="mt-6 text-sm">
            <span className="block font-semibold text-gray-900">{name}</span>
            <span className="text-gray-500">Our promise to every donor</span>
          </figcaption>
        </Card>

        <motion.div
          className={`relative isolate overflow-hidden rounded-2xl px-6 py-12 text-center sm:px-10 sm:py-14 lg:col-span-7 ${DARK_BAND}`}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <img
            src={ctaImg}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 -z-10 h-full w-full object-cover"
          />
          <div className="absolute inset-0 -z-10 bg-blue-900/90" />
          <div
            className={`absolute inset-0 -z-10 ${DARK_BAND_OVERLAY}`}
            aria-hidden="true"
          />

          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Be Part of the Change
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-blue-100 sm:text-base">
            Your support can transform lives and create opportunities for thousands in
            need.
          </p>
          <Button to="/donate" variant="onDark" icon={FaHeart} className="mt-8">
            Donate Now
          </Button>

          <ul className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-blue-50 sm:gap-x-8">
            {TRUST_POINTS.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-2">
                <Icon className="text-blue-200" aria-hidden="true" />
                {label}
              </li>
            ))}
          </ul>
        </motion.div>
      </Section>
    </div>
  );
};

export default Home;
