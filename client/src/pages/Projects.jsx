import React, { useEffect, useRef, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import { Autoplay } from 'swiper/modules';
import { useNavigate } from 'react-router-dom';
import {
  FaArrowLeft,
  FaArrowRight,
  FaLeaf,
  FaQuoteLeft,
  FaRegCalendarAlt,
  FaRegLightbulb,
  FaShieldAlt,
  FaUsers,
} from 'react-icons/fa';
import api from '../lib/api';
import {
  EmptyMessage,
  Notice,
  PageHero,
  ProjectCard,
  Section,
  SliderArrow,
  SliderProgress,
} from '../components/ui';
import { HEADING_2 } from '../components/ui/tokens';
import { ProjectsPageSkeleton } from '../components/ui/skeletons';

const SECTIONS = [
  {
    category: 'current',
    title: 'Current Projects',
    badge: 'Ongoing',
    badgeTone: 'green',
    empty: 'No current projects right now — check back soon.',
  },
  {
    category: 'upcoming',
    title: 'Upcoming Projects',
    badge: 'Upcoming',
    badgeTone: 'blue',
    empty: 'Nothing scheduled yet. Watch this space.',
  },
  {
    category: 'completed',
    title: 'Completed Projects',
    badge: 'Completed',
    badgeTone: 'slate',
    empty: 'Completed work will be listed here.',
  },
];

// The three promises under the hero title.
const HERO_POINTS = [
  { icon: FaUsers, label: 'Community Driven' },
  { icon: FaShieldAlt, label: 'Transparent Impact' },
  { icon: FaLeaf, label: 'Sustainable Change' },
];

// Shared by the Swiper config and by the overflow check below, so the two can't drift.
const BREAKPOINTS = {
  640: { slidesPerView: 2 },
  1024: { slidesPerView: 3 },
  1280: { slidesPerView: 4 },
};

// Swiper matches breakpoints against the window width by default.
const slidesForWidth = (width) =>
  Object.entries(BREAKPOINTS).reduce(
    (perView, [min, params]) => (width >= Number(min) ? params.slidesPerView : perView),
    1
  );

/** "Aug 2025" — the only date the project record actually carries. */
const monthYear = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? null
    : date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
};

// One carousel per category, with the same autoplay-linked progress bar the
// home page uses in place of dots — plus arrows in the section header, which is
// where the mockup's "view all" link sat.
const ProjectSlider = ({ title, category, empty, badge, badgeTone, projects }) => {
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const swiperRef = useRef(null);
  // Fills are written straight to the DOM so the ~60fps autoplay tick never re-renders React.
  const fillRefs = useRef([]);

  const setFill = (index, value) => {
    const el = fillRefs.current[index];
    // Width (not scaleX) so the shimmer sweep inside the fill isn't squashed.
    if (el) el.style.width = `${Math.min(Math.max(value, 0), 1) * 100}%`;
  };

  const resetFills = () => {
    fillRefs.current.forEach((_, i) => setFill(i, 0));
  };

  // Tracked so the indicators can hide when every project already fits on screen.
  const [slidesPerView, setSlidesPerView] = useState(() =>
    slidesForWidth(typeof window === 'undefined' ? 0 : window.innerWidth)
  );

  useEffect(() => {
    const onResize = () => setSlidesPerView(slidesForWidth(window.innerWidth));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const hasOverflow = projects.length > slidesPerView;

  // Upcoming projects have no detail page to open yet.
  const openable = category !== 'upcoming';

  return (
    <section>
      <div className="mb-6 flex items-center justify-between gap-4">
        <h2 className={`${HEADING_2} text-gray-900`}>{title}</h2>
        {hasOverflow && (
          <div className="flex items-center gap-2">
            <SliderArrow
              icon={FaArrowLeft}
              label={`Previous ${title.toLowerCase()}`}
              onClick={() => swiperRef.current?.slidePrev()}
            />
            <SliderArrow
              icon={FaArrowRight}
              label={`Next ${title.toLowerCase()}`}
              onClick={() => swiperRef.current?.slideNext()}
            />
          </div>
        )}
      </div>

      {projects.length === 0 ? (
        <EmptyMessage>{empty}</EmptyMessage>
      ) : (
        <div className="relative">
          <Swiper
            modules={[Autoplay]}
            slidesPerView={1}
            spaceBetween={24}
            speed={700}
            autoplay={
              hasOverflow
                ? { delay: 5000, disableOnInteraction: false, pauseOnMouseEnter: true }
                : false
            }
            loop={hasOverflow}
            onSlideChange={(swiper) => {
              setActiveIndex(swiper.realIndex);
              resetFills();
            }}
            // Swiper owns the autoplay clock, so the bar stays in lockstep with it —
            // including the pause while the pointer is over the carousel.
            onAutoplayTimeLeft={(swiper, _time, progress) => {
              setFill(swiper.realIndex, 1 - progress);
            }}
            onAutoplayPause={() => setIsPaused(true)}
            onAutoplayResume={() => setIsPaused(false)}
            onSwiper={(swiper) => (swiperRef.current = swiper)}
            breakpoints={BREAKPOINTS}
            className="w-full"
          >
            {projects.map((project) => {
              const date = monthYear(project.createdAt);
              return (
                <SwiperSlide key={project._id} className="h-auto">
                  <ProjectCard
                    project={project}
                    imageHeight="h-44 sm:h-48"
                    badge={badge}
                    badgeTone={badgeTone}
                    description={project.description}
                    meta={date ? [{ icon: FaRegCalendarAlt, label: date }] : []}
                    onClick={
                      openable ? () => navigate(`/projects/${project._id}`) : undefined
                    }
                  />
                </SwiperSlide>
              );
            })}
          </Swiper>

          {/* Progress Indicators — only when the slides actually overflow the view. */}
          {hasOverflow && (
            <SliderProgress
              className="mt-7"
              items={projects.map((project, index) => ({
                key: project._id || index,
                label: project.name,
              }))}
              activeIndex={activeIndex}
              isPaused={isPaused}
              registerFill={(index, el) => (fillRefs.current[index] = el)}
              onSelect={(index) => {
                swiperRef.current?.slideToLoop(index);
                setActiveIndex(index);
                resetFills();
                swiperRef.current?.autoplay?.start();
              }}
            />
          )}
        </div>
      )}
    </section>
  );
};

const Projects = () => {
  const [allProjects, setAllProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch all projects once
  useEffect(() => {
    api
      .get('/projects')
      .then((res) => setAllProjects(res.data))
      .catch((err) => {
        console.error(err);
        setError('Failed to load projects. Please try again later.');
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-gray-50 pt-16">
      <PageHero
        align="left"
        eyebrow="Our Projects"
        eyebrowIcon={FaRegLightbulb}
        title={
          <>
            Building a Better
            <br className="hidden sm:block" /> Tomorrow, Together
          </>
        }
        subtitle="Explore the initiatives we're working on to uplift communities and create lasting impact."
        aside={
          /* The same hairline-on-glass treatment the hero band already uses,
             so the quote reads as part of the photograph rather than a card
             dropped on top of it. */
          <figure className="rounded-xl bg-white/10 p-6 ring-1 ring-white/20 backdrop-blur-sm sm:p-7">
            <FaQuoteLeft className="text-2xl text-blue-300" aria-hidden="true" />
            <blockquote className="mt-4 text-base font-medium leading-relaxed text-white sm:text-lg">
              Alone we can do so little; together we can do so much.
            </blockquote>
            <figcaption className="mt-4 text-sm text-blue-100">– Helen Keller</figcaption>
          </figure>
        }
      >
        <ul className="mt-8 flex flex-wrap gap-x-8 gap-y-3 sm:gap-x-10">
          {HERO_POINTS.map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-center gap-2.5 text-sm text-blue-50">
              <Icon className="text-blue-200" aria-hidden="true" />
              {label}
            </li>
          ))}
        </ul>
      </PageHero>

      <Section>
        {loading && <ProjectsPageSkeleton sections={SECTIONS.length} />}

        {!loading && error && <Notice tone="error">{error}</Notice>}

        {!loading && !error && (
          <div className="space-y-16">
            {SECTIONS.map((section) => (
              <ProjectSlider
                key={section.category}
                {...section}
                projects={allProjects.filter((p) => p.category === section.category)}
              />
            ))}
          </div>
        )}
      </Section>
    </div>
  );
};

export default Projects;
