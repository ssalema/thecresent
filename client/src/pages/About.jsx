import { motion } from 'framer-motion';
import Skeleton from 'react-loading-skeleton';
import {
  FaArrowRight,
  FaBook,
  FaBullseye,
  FaEye,
  FaGraduationCap,
  FaHandsHelping,
  FaHeart,
  FaLeaf,
  FaQuoteLeft,
  FaSeedling,
  FaUsers,
} from 'react-icons/fa';

import foundingImg from '../assets/hero1.png';
import founderImg from '../assets/about.png';
import heroImg from '../assets/hero3.png';
import { useOrganizationContext } from '../context/OrganizationContext';
import {
  Button,
  Card,
  Eyebrow,
  IconBadge,
  Section,
  TwoToneHeading,
} from '../components/ui';
import {
  DARK_BAND,
  DARK_BAND_OVERLAY,
  HEADING_2,
  SURFACE,
  TRANSITION,
} from '../components/ui/tokens';

/**
 * The About page.
 *
 * Laid out as five bands — hero, pull-quote, founding, founder, mission &
 * vision — closed by the impact strip. Every band is built from the shared
 * kit (Section for rhythm and width, Card for surfaces, Button for actions) so
 * it reads as the same site as Home, Projects and Contact.
 */

/* ------------------------------------------------------------------ pieces */

/**
 * One figure in the closing impact strip.
 *
 * The kit's HeroStat is the same figure laid out in a row; this band stacks it
 * centred, so it keeps HeroStat's colours (blue-200 icon, blue-100 caption) to
 * stay the same object in a different arrangement.
 */
const ImpactStat = ({ icon: Icon, value, label }) => (
  <div className="flex flex-col items-center gap-1.5 text-center">
    <Icon className="text-xl text-blue-200" aria-hidden="true" />
    <span className="text-2xl font-bold leading-none tracking-tight sm:text-3xl">
      {value}
    </span>
    <span className="text-xs text-blue-100 sm:text-sm">{label}</span>
  </div>
);

/** The three pillars printed on the dark bar under the founder's photograph. */
const PILLARS = [
  { icon: FaGraduationCap, label: 'Education' },
  { icon: FaHeart, label: 'Service' },
  { icon: FaUsers, label: 'Social Impact' },
];

const IMPACT_STATS = [
  { icon: FaUsers, value: '12,000+', label: 'Lives Touched' },
  { icon: FaBook, value: '200+', label: 'Communities' },
  { icon: FaHeart, value: '15+', label: 'Years of Service' },
  { icon: FaSeedling, value: '50+', label: 'Initiatives' },
];

/* -------------------------------------------------------------------- page */

const About = () => {
  const { organization, loading } = useOrganizationContext();
  const { organizationName, tagline } = organization;
  const name = organizationName || 'The Crescent Foundation';

  // The heading prints the organization's last word in blue, so split the name
  // rather than hardcoding where the colour changes.
  const words = name.trim().split(/\s+/);
  const headingAccent = words.length > 1 ? words.pop() : '';
  const headingLead = words.join(' ');

  // "Our Story" jumps down the page rather than leaving it, so it stays a real
  // button — Button's `href` renders an <a target="_blank">, which would open
  // the same page in a new tab.
  const scrollToFounding = () =>
    document
      .getElementById('our-founding')
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <div className="bg-white pt-16 text-gray-800">
      {/* ------------------------------------------------------------ hero */}
      <header className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-blue-50/60 to-white">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 sm:py-16 lg:grid-cols-12 lg:gap-8 lg:px-8 lg:py-20">
          <motion.div
            className="lg:col-span-6"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          >
            <Eyebrow>About Us</Eyebrow>

            {/* The heading is built from the organization name, so shimmer
                rather than print a placeholder and swap it a moment later. */}
            {loading ? (
              <>
                <Skeleton
                  height={44}
                  width={320}
                  containerClassName="mt-4 block max-w-full"
                />
                <Skeleton height={16} width={260} containerClassName="mt-3 block max-w-full" />
              </>
            ) : (
              <>
                <TwoToneHeading
                  as="h1"
                  lead={headingLead}
                  accent={headingAccent}
                  className="mt-4 text-3xl sm:text-4xl md:text-5xl"
                />
                <p className="mt-3 text-sm font-semibold uppercase tracking-[0.18em] text-gray-600 sm:text-base">
                  {tagline || 'Serving Humanity, Inspiring Hope'}
                </p>
              </>
            )}

            <p className="mt-6 max-w-xl text-base leading-relaxed text-gray-600 sm:text-lg">
              At <span className="font-semibold text-blue-700">{name}</span>, we believe
              every individual deserves equal opportunity for survival, education, and
              development.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button onClick={scrollToFounding} trailingIcon={FaArrowRight}>
                Our Story
              </Button>
              <Button to="/donate" variant="secondary" icon={FaHeart}>
                Support Our Work
              </Button>
            </div>
          </motion.div>

          <motion.div
            className="relative lg:col-span-6"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <div className="relative overflow-hidden rounded-2xl shadow-e3">
              <img
                src={heroImg}
                alt={`${name} at work in the community`}
                className="h-64 w-full object-cover sm:h-80 lg:h-[26rem]"
              />
              {/* Only the footer scrim stays: the photograph itself is left
                  unwashed so it reads at full contrast. */}
              <div
                className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-blue-950/60 to-transparent"
                aria-hidden="true"
              />
              {/* Inter italic rather than the mockup's script face: the site
                  loads Inter alone (see index.html), and a `font-serif`
                  fallback would drop Times into an otherwise Inter page. */}
              <p className="absolute bottom-5 right-5 max-w-[14rem] text-right text-xl font-light italic leading-tight tracking-wide text-white drop-shadow sm:text-2xl">
                Brighter Communities
                <br />
                Stronger Tomorrows
              </p>
            </div>
          </motion.div>
        </div>
      </header>

      {/* ----------------------------------------------------------- quote */}
      {/* Deliberately tighter than Section's py-14: the band belongs to the
          hero above it, not to the founding story below. Same gutters and max
          width as every other band, so its edges still line up. */}
      <section className="px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <motion.blockquote
          className="relative mx-auto max-w-7xl overflow-hidden rounded-2xl bg-blue-50 px-6 py-10 text-center sm:px-16 sm:py-12"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
        >
          <FaLeaf
            className="pointer-events-none absolute -left-2 top-6 hidden text-6xl text-blue-200/60 sm:block"
            aria-hidden="true"
          />
          <FaLeaf
            className="pointer-events-none absolute -right-2 top-6 hidden scale-x-[-1] text-6xl text-blue-200/60 sm:block"
            aria-hidden="true"
          />
          <FaQuoteLeft
            className="mx-auto mb-4 text-2xl text-blue-400 sm:absolute sm:left-10 sm:top-10 sm:mb-0 sm:text-3xl"
            aria-hidden="true"
          />
          <p className="mx-auto max-w-3xl text-base italic leading-relaxed text-gray-700 sm:text-lg">
            “Every child, every individual deserves equal opportunity for survival,
            education, and development. Our mission is to create lasting impact through
            compassion and action.”
          </p>
          <footer className="mt-5 flex items-center justify-center gap-4 text-sm font-semibold text-gray-600">
            <span className="h-px w-10 bg-blue-300" aria-hidden="true" />— {name}
            <span className="h-px w-10 bg-blue-300" aria-hidden="true" />
          </footer>
        </motion.blockquote>
      </section>

      {/* -------------------------------------------------------- founding */}
      {/* scroll-mt clears the fixed navbar when "Our Story" jumps here. */}
      <Section
        id="our-founding"
        className="scroll-mt-16"
        containerClassName="grid items-center gap-10 lg:grid-cols-2 lg:gap-14"
      >
        <motion.div
          className="relative"
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
        >
          {/* A white mat around the photograph, so the floating caption card
              below has a surface to sit against at every screen width. */}
          <div className={`${SURFACE} p-2 sm:p-3`}>
            <img
              src={foundingImg}
              alt="Community outreach in the field"
              className="h-64 w-full rounded-lg object-cover sm:h-80 lg:h-[24rem]"
            />
          </div>
          <div
            className={`${SURFACE} absolute bottom-5 left-5 flex items-center gap-3 px-4 py-3 sm:bottom-7 sm:left-7`}
          >
            <FaUsers className="text-lg text-blue-600" aria-hidden="true" />
            <span className="text-sm font-semibold leading-snug text-gray-900">
              Together for Stronger
              <br />
              Communities
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
        >
          <Eyebrow>Our Beginning</Eyebrow>
          <TwoToneHeading
            lead="Our"
            accent="Founding"
            className="mt-3 text-3xl sm:text-4xl"
          />
          <p className="mt-5 leading-relaxed text-gray-600">
            {name} laid its foundation in 2008 with the aim for the betterment and
            upliftment of the weaker and underprivileged community in India. Founded
            under the Public Charitable Trust Registration Act in 2008, the organization
            was built with a vision to bring positive change to the lives of marginalized
            individuals and communities.
          </p>
          <p className="mt-4 leading-relaxed text-gray-600">
            From the very beginning, our focus has been on awareness, literacy, poor
            planning, and women’s empowerment, along with education, health, nutrition,
            and skill development. Today, {name} is engaged in a wide range of initiatives
            that create real opportunities for marginalized and weaker sections of
            society.
          </p>
          <div className="mt-7">
            <Button to="/projects" variant="secondary" trailingIcon={FaArrowRight}>
              Learn More About Us
            </Button>
          </div>
        </motion.div>
      </Section>

      {/* ---------------------------------------------------------- founder */}
      <Section
        className="bg-gradient-to-br from-blue-50 via-blue-50/60 to-white"
        containerClassName="grid items-center gap-10 lg:grid-cols-2 lg:gap-14"
      >
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
        >
          <Eyebrow>Our Founder</Eyebrow>
          <TwoToneHeading
            lead="Mohammed"
            accent="Siddique"
            className="mt-3 text-3xl sm:text-4xl"
          />
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-blue-600 sm:text-sm">
            A Visionary Leader with a Bigger Purpose
          </p>
          <p className="mt-5 leading-relaxed text-gray-600">
            {name} was initiated in 2008 by Mr. Mohammed Siddique, a dedicated social
            worker committed to the welfare and empowerment of underprivileged
            communities. His vision and leadership continue to inspire the mission and
            activities of the organization.
          </p>
          <p className="mt-4 leading-relaxed text-gray-600">
            With a strong belief in education, health, and skill development, he has
            worked tirelessly to bring awareness and create opportunities for
            marginalized individuals, especially in rural and urban underserved areas.
          </p>

          {/* `!` is required: Tailwind emits bg-blue-50 before Card's own
              bg-white, so an unmarked override loses and the card renders
              white — the same note the founder card carried before. */}
          <Card as="blockquote" tone="blue" className="mt-7 flex items-start gap-4">
            <FaQuoteLeft className="mt-1 flex-shrink-0 text-xl text-blue-400" aria-hidden="true" />
            <div>
              <p className="italic leading-relaxed text-gray-700">
                “Real change happens when compassion meets action.”
              </p>
              <footer className="mt-2 text-sm font-semibold text-gray-600">
                — Mohammed Siddique
              </footer>
            </div>
          </Card>
        </motion.div>

        <motion.div
          className={`overflow-hidden ${SURFACE}`}
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
        >
          <img
            src={founderImg}
            alt="Mohammed Siddique, founder"
            className="h-64 w-full object-cover sm:h-80 lg:h-[24rem]"
          />
          {/* The pillars sit on the photo's own footer rather than beside it,
              so the block reads as one object at every width. */}
          <div className="grid grid-cols-3 divide-x divide-white/20 bg-blue-900 py-4 text-white">
            {PILLARS.map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-1.5 px-2">
                <Icon className="text-lg text-blue-100" aria-hidden="true" />
                <span className="text-xs font-medium sm:text-sm">{label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </Section>

      {/* -------------------------------------------------- mission & vision */}
      <Section>
        <div className="mx-auto max-w-3xl text-center">
          <Eyebrow rule={false} className="justify-center">
            Our Mission &amp; Vision
          </Eyebrow>
          <TwoToneHeading
            lead="Building a"
            accent="Brighter Tomorrow"
            className="mt-3 text-3xl sm:text-4xl"
          />
          <p className="mt-4 text-base leading-relaxed text-gray-600 sm:text-lg">
            We strive to empower communities, ensuring every individual has access to
            education, health, and equal opportunities for a better future.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {[
            {
              icon: FaBullseye,
              title: 'Our Mission',
              body: `Our mission is to touch millions of lives and spread happiness to the underprivileged people of India on a sustainable basis. We will make use of multiple platforms and mediums to reach this goal and be one of the most respected NGOs known for its practice and ethics. ${name} was formed to respond to this issue and is the initiative and effort to facilitate an empowering community development process.`,
            },
            {
              icon: FaEye,
              title: 'Our Vision',
              body: `${name} hopes to reach people and nature beset with problems of poverty, illiteracy, unequal distribution of wealth, exploitation and all the associated ills. This is a result of lack of awareness, illiteracy, poor planning, and wanton greed of the section of human society — and a world in which every child attains the right to survival, protection, development, and participation.`,
            },
          ].map((item, idx) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: idx * 0.12 }}
              viewport={{ once: true }}
              className="h-full"
            >
              <Card className={`flex h-full gap-5 ${TRANSITION} hover:-translate-y-1 hover:shadow-e3`}>
                <IconBadge icon={item.icon} className="text-lg" />
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{item.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-gray-600 sm:text-base">
                    {item.body}
                  </p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* ---------------------------------------------------------- impact */}
      {/* The same navy as PageHero — blue-900 under a blue-950 gradient — so
          the page closes on the colour every other inner page opens with. */}
      <section className={`relative overflow-hidden ${DARK_BAND}`}>
        <div className={`absolute inset-0 ${DARK_BAND_OVERLAY}`} aria-hidden="true" />
        <FaHandsHelping
          className="pointer-events-none absolute -bottom-8 right-1/3 hidden text-[10rem] text-white/5 lg:block"
          aria-hidden="true"
        />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 sm:py-14 lg:grid-cols-12 lg:px-8">
          <div className="lg:col-span-3">
            <h2 className={`leading-tight ${HEADING_2}`}>
              Creating
              <br />
              Lasting Impact
            </h2>
            {/* The rule under a heading is blue-400 everywhere else on the site
                — the footer's column headings and the hero accent. Orange was
                the only warm mark in the whole palette. */}
            <span className="mt-3 block h-1 w-14 rounded-full bg-blue-400" aria-hidden="true" />
            <p className="mt-4 text-sm leading-relaxed text-blue-100">
              Through compassion, collaboration and community action.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4 lg:col-span-6">
            {IMPACT_STATS.map((stat) => (
              <ImpactStat key={stat.label} {...stat} />
            ))}
          </div>

          <div className="lg:col-span-3 lg:justify-self-end">
            <Button to="/donate" variant="onDark" trailingIcon={FaArrowRight}>
              Support Our Work
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
