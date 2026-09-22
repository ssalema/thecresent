import { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowRight, FaChevronDown, FaSpinner } from 'react-icons/fa';
import heroBg from '../../assets/Contactbg.png';
import { cloudinaryUrl, cloudinarySrcSet } from '../../lib/cloudinary';
import {
  controlClass,
  DARK_BAND,
  DARK_BAND_OVERLAY,
  ERROR_TEXT,
  FOCUS_RING,
  HEADING_1,
  HINT,
  LABEL,
  SELECT_CHEVRON,
  SURFACE_BASE,
  SURFACE_INTERACTIVE,
  TRANSITION,
} from './tokens';

/**
 * The public site's shared UI kit.
 *
 * Same design language as the admin panel — the two are one product, so a
 * button, an input and a card look the same on both sides of the login. The
 * raw class strings live in tokens.js; this file is the components that render
 * them.
 *
 *   surface   white, rounded-xl, hairline ring, elevation e1
 *   heading   page h1 text-3xl→5xl, band h2 HEADING_1, block h2 HEADING_2
 *   body      text-base, gray-600 for copy, gray-900 for headings
 *   control   44px tall, rounded-lg, outline darkens on hover and thickens to
 *             blue-600 on focus
 *   accent    blue-600 primary, blue-50/blue-600 icon badges
 */

/* ------------------------------------------------------------------ layout */

/**
 * The banner every inner page opens with. Contact, Projects, Gallery and
 * Donate each had their own copy of this markup with slightly different
 * heights and padding; they all render this now.
 */
export const PageHero = ({
  title,
  subtitle,
  image = heroBg,
  align = 'center',
  eyebrow,
  eyebrowIcon: EyebrowIcon,
  aside,
  children,
}) => {
  // The left variant is the same band with its content pulled into the content
  // column, so a page can hang a stat row (or anything else) under the title
  // without the header growing a second layout. `aside` adds a second column
  // beside it on desktop — the pull-quote card on Projects — and stacks it
  // under the copy on a phone.
  const left = align === 'left';

  return (
    <header
      className={`relative w-full bg-cover bg-center ${DARK_BAND} ${
        left
          ? 'px-4 py-12 sm:px-6 sm:py-14 lg:px-8 lg:py-16'
          : 'flex h-56 items-center justify-center px-4 text-center sm:h-64 md:h-72'
      }`}
      style={{ backgroundImage: `url(${image})` }}
    >
      {/* A gradient rather than a flat wash: the type stays legible at the centre
          while the photograph still reads at the edges. */}
      <div className="absolute inset-0 bg-blue-900/75" />
      <div className={`absolute inset-0 ${DARK_BAND_OVERLAY}`} />
      <div
        className={`relative z-10 ${
          left ? 'mx-auto w-full max-w-7xl' : 'max-w-3xl'
        } ${aside ? 'grid items-center gap-10 lg:grid-cols-12' : ''}`}
      >
        <div className={aside ? 'lg:col-span-7' : ''}>
          {eyebrow && (
            <p className="mb-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-blue-100">
              {EyebrowIcon && <EyebrowIcon className="text-sm" aria-hidden="true" />}
              {eyebrow}
            </p>
          )}
          <h1 className="text-3xl font-bold tracking-tight drop-shadow-sm sm:text-4xl md:text-5xl">
            {title}
          </h1>
          {subtitle && (
            <p
              className={`mt-3 max-w-2xl text-sm leading-relaxed text-blue-50 sm:text-base md:text-lg ${
                left ? '' : 'mx-auto'
              }`}
            >
              {subtitle}
            </p>
          )}
          {children}
        </div>
        {aside && <div className="lg:col-span-5 lg:justify-self-end">{aside}</div>}
      </div>
    </header>
  );
};

/**
 * One figure in the band under a hero title: icon, value, caption. It only ever
 * sits on the dark hero, so its colours are fixed rather than toned.
 */
export const HeroStat = ({ icon: Icon, value, label }) => (
  <div className="flex flex-col gap-1">
    <div className="flex items-center gap-2.5">
      <Icon className="text-lg text-blue-200 sm:text-xl" aria-hidden="true" />
      <span className="text-xl font-bold leading-none tracking-tight sm:text-2xl">
        {value}
      </span>
    </div>
    <span className="text-xs text-blue-100 sm:text-sm">{label}</span>
  </div>
);

/**
 * Vertical rhythm + the standard content width, in one wrapper.
 *
 * Anything else passed through reaches the <section> — `id` in particular, so
 * a page can hang an in-page scroll target off a band without wrapping it.
 */
export const Section = ({ className = '', containerClassName = '', children, ...rest }) => (
  <section className={`py-14 sm:py-20 ${className}`} {...rest}>
    <div className={`mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 ${containerClassName}`}>
      {children}
    </div>
  </section>
);

/**
 * The small tracked label that opens a band — "WHAT WE DO", "OUR MOMENTS".
 * The hairline rule after it is dropped on a centred heading, where it would
 * have to be mirrored on both sides to stay balanced.
 */
export const Eyebrow = ({ children, rule = true, className = '' }) => (
  <p
    className={`flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700 ${className}`}
  >
    {children}
    {rule && <span className="h-px w-10 bg-blue-300" aria-hidden="true" />}
  </p>
);

/**
 * A heading with one half picked out in blue. `accentFirst` puts the coloured
 * half in front — "About The Crescent Foundation" — for the headings that lead
 * with the label rather than close on it.
 */
export const TwoToneHeading = ({
  lead,
  accent,
  accentFirst = false,
  as: Tag = 'h2',
  className = '',
}) => (
  <Tag className={`font-bold tracking-tight text-gray-900 ${className}`}>
    {accentFirst ? (
      <>
        <span className="text-blue-600">{accent}</span> {lead}
      </>
    ) : (
      <>
        {lead} <span className="text-blue-600">{accent}</span>
      </>
    )}
  </Tag>
);

export const SectionHeading = ({
  title,
  subtitle,
  align = 'center',
  className = '',
}) => (
  <div
    className={`${align === 'center' ? 'mx-auto text-center' : 'text-left'} max-w-3xl ${className}`}
  >
    <h2 className={`${HEADING_1} text-gray-900`}>{title}</h2>
    {subtitle && (
      <p className="mt-3 text-base leading-relaxed text-gray-600 sm:text-lg">
        {subtitle}
      </p>
    )}
  </div>
);

/*
 * Anything else passed through reaches the element — `id` in particular, which
 * the legal pages hang their in-page anchors off.
 *
 * `as` swaps the tag without changing the look, so a card that is really a
 * quotation can render as <blockquote> and keep its meaning for a screen
 * reader.
 */
/**
 * `tone="blue"` is the tinted card — the founder's pull-quote, the legal
 * pages' closing panel. It exists so those two don't have to fight Tailwind's
 * output order with `!bg-blue-50`: Tailwind emits bg-blue-50 before Card's own
 * bg-white, so an unmarked override loses and the card renders white. Choosing
 * the ground here means only one class is ever emitted for it.
 */
const CARD_TONES = {
  white: 'bg-white',
  blue: 'bg-blue-50',
};

/**
 * `padding="compact"` is the tighter card — the legal pages' contents rail,
 * where the standard p-6 sm:p-8 would push the clause list off the screen.
 * Chosen here for the same reason as the tone: so a page never has to
 * out-shout the base class with `!p-5`.
 */
const CARD_PADDING = {
  default: 'p-6 sm:p-8',
  compact: 'p-5',
};

export const Card = ({
  as: Tag = 'div',
  tone = 'white',
  padding = 'default',
  className = '',
  children,
  ...rest
}) => (
  <Tag
    className={`${SURFACE_BASE} ${CARD_TONES[tone]} ${CARD_PADDING[padding]} ${className}`}
    {...rest}
  >
    {children}
  </Tag>
);

/** Circled icon used beside headings and contact rows. */
const BADGE_TONES = {
  blue: 'bg-blue-50 text-blue-600 ring-blue-100',
  green: 'bg-green-50 text-green-600 ring-green-100',
  red: 'bg-red-50 text-red-600 ring-red-100',
  amber: 'bg-amber-50 text-amber-600 ring-amber-100',
};

export const IconBadge = ({ icon: Icon, tone = 'blue', className = '' }) => (
  <span
    className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ring-1 ring-inset ${BADGE_TONES[tone]} ${className}`}
  >
    <Icon />
  </span>
);

/* ------------------------------------------------------------------ buttons */

/**
 * A filled button lifts on hover and settles flat when pressed — that
 * settling is what makes the press read as a press.
 *
 * Unlike the admin panel these states are not scoped to `enabled:`, because
 * this Button also renders as <a> / <Link>, which never matches :enabled. The
 * disabled case is handled by `pointer-events-none` on the base instead.
 */
const BUTTON_VARIANTS = {
  primary:
    'bg-blue-600 text-white shadow-e1 hover:bg-blue-700 hover:shadow-e2 active:bg-blue-800 active:shadow-none focus-visible:ring-blue-500',
  secondary:
    'border border-gray-300 bg-white text-gray-700 shadow-sm hover:border-gray-400 hover:bg-gray-50 active:bg-gray-100 focus-visible:ring-gray-400',
  // The quieter action beside a section heading — "View All Projects". Blue
  // rather than grey, because it is a step further into the site, not a way
  // out of the one action on the band.
  outline:
    'border border-blue-300 bg-white text-blue-700 shadow-sm hover:border-blue-400 hover:bg-blue-50 active:bg-blue-100 focus-visible:ring-blue-400',
  // For use on the dark hero / quote bands.
  onDark:
    'bg-white text-blue-700 shadow-e2 hover:bg-blue-50 hover:shadow-e3 active:bg-blue-100 active:shadow-e1 focus-visible:ring-white',
  // The second, quieter action on a dark band — the hero's "Our Work" beside
  // the filled "Donate Now".
  onDarkOutline:
    'border border-white/60 bg-white/10 text-white backdrop-blur-sm hover:border-white hover:bg-white/20 active:bg-white/25 focus-visible:ring-white',
};

/** Every size keeps a 44px hit area, the smallest a thumb reliably lands on. */
const BUTTON_SIZES = {
  sm: 'min-h-[44px] gap-1.5 px-4 py-2 text-sm',
  md: 'min-h-[48px] gap-2 px-6 py-3',
  lg: 'min-h-[52px] gap-2.5 px-8 py-4 text-lg',
};

/**
 * One button for the whole site. Pass `to` for an internal route, `href` for
 * an external link, or neither for a plain <button>.
 */
export const Button = ({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  trailingIcon: TrailingIcon,
  loading = false,
  disabled = false,
  fullWidth = false,
  to,
  href,
  className = '',
  children,
  ...rest
}) => {
  const classes = `inline-flex items-center justify-center rounded-lg font-semibold tracking-tight ${TRANSITION} active:scale-[0.98] ${FOCUS_RING} disabled:pointer-events-none disabled:opacity-60 disabled:shadow-none ${
    BUTTON_SIZES[size]
  } ${BUTTON_VARIANTS[variant]} ${fullWidth ? 'w-full' : ''} ${className}`;

  const content = (
    <>
      {loading ? <FaSpinner className="animate-spin" /> : Icon && <Icon />}
      {children}
      {/* The arrow that trails a "learn more" action. Decorative — the label
          already says where the button goes. */}
      {TrailingIcon && !loading && <TrailingIcon aria-hidden="true" />}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={classes} {...rest}>
        {content}
      </Link>
    );
  }

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={classes}
        {...rest}
      >
        {content}
      </a>
    );
  }

  return (
    <button
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={classes}
      {...rest}
    >
      {content}
    </button>
  );
};

/* -------------------------------------------------------------- carousels */

/**
 * The round arrow that drives a project carousel.
 *
 * The projects page hangs a pair off its section heading; the home page mounts
 * them on the edges of the row, where the heading is centred and has nothing to
 * sit beside. The lift on hover is the button's own transform, so an edge-
 * mounted arrow is positioned by a wrapper rather than by a class here — two
 * translate utilities on one element would overwrite each other.
 */
export const SliderArrow = ({ icon: Icon, label, onClick, className = '' }) => (
  <button
    type="button"
    onClick={onClick}
    title={label}
    aria-label={label}
    className={`flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-500 shadow-e1 ring-1 ring-gray-900/5 ${TRANSITION} hover:-translate-y-0.5 hover:text-blue-700 hover:shadow-e2 active:translate-y-0 active:shadow-none ${FOCUS_RING} focus-visible:ring-blue-500 ${className}`}
  >
    <Icon className="text-sm" />
  </button>
);

/**
 * The row of bars under a carousel — a page indicator that doubles as the
 * autoplay clock, in place of dots.
 *
 * The active bar's fill is driven by the caller through `registerFill`, which
 * hands back the element for each slide: the carousel owns the autoplay clock,
 * so writing the width straight to the DOM keeps the bar in lockstep with it
 * without re-rendering React sixty times a second.
 *
 * `items` is one `{ key, label }` per slide; the label only names the slide in
 * the button's accessible name.
 */
export const SliderProgress = ({
  items,
  activeIndex,
  isPaused = false,
  onSelect,
  registerFill,
  className = '',
}) => (
  <div className={`flex items-center justify-center gap-2 sm:gap-2.5 ${className}`}>
    {items.map((item, index) => {
      const isActive = activeIndex === index;
      return (
        <button
          key={item.key ?? index}
          type="button"
          aria-label={`Go to slide ${index + 1}${item.label ? `: ${item.label}` : ''}`}
          aria-current={isActive}
          onClick={() => onSelect(index)}
          className={`group rounded-full py-2 ${FOCUS_RING} focus-visible:ring-blue-500`}
        >
          <span
            className={`relative block h-1.5 overflow-hidden rounded-full transition-[width,background-color] duration-500 ease-out ${
              isActive
                ? 'w-14 bg-blue-100 sm:w-20'
                : 'w-6 bg-gray-200 group-hover:bg-gray-300 sm:w-8'
            }`}
          >
            <span
              ref={(el) => registerFill?.(index, el)}
              style={{ width: 0 }}
              className={`absolute left-0 top-0 h-full overflow-hidden rounded-full bg-gradient-to-r from-blue-600 to-sky-400 shadow-[0_0_8px_rgba(59,130,246,0.6)] ${
                isActive && !isPaused ? 'progress-shimmer' : ''
              }`}
            />
          </span>
        </button>
      );
    })}
  </div>
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
 * "expected string, received undefined" however much the visitor typed in.
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

/* --------------------------------------------------------- status feedback */

const NOTICE_TONES = {
  success: 'bg-green-50 text-green-800 border-green-200',
  error: 'bg-red-50 text-red-700 border-red-200',
  warning: 'bg-amber-50 text-amber-800 border-amber-200',
  info: 'bg-blue-50 text-blue-800 border-blue-200',
};

/** Inline banner for form results — replaces the old ad-hoc coloured boxes. */
export const Notice = ({ tone = 'info', className = '', children }) => (
  <p
    className={`rounded-lg border px-4 py-3 text-center text-sm font-medium leading-relaxed ${NOTICE_TONES[tone]} ${className}`}
    role={tone === 'error' ? 'alert' : 'status'}
  >
    {children}
  </p>
);

/* Page-level waiting is shown as a skeleton of the content, not a spinner —
   see components/ui/skeletons.jsx. The only spinner left is the one inside a
   Button, where there is no layout to stand in for. */

export const EmptyMessage = ({ children }) => (
  <p className="py-10 text-center text-gray-500">{children}</p>
);

/* ------------------------------------------------------------------- cards */

/**
 * The status pill that sits on a project tile's image — "Ongoing" and friends.
 * Solid rather than translucent, so it stays legible over any photograph.
 */
const CARD_BADGE_TONES = {
  green: 'bg-emerald-500 text-white',
  blue: 'bg-blue-600 text-white',
  slate: 'bg-green-600 text-white',
};

const CardBadge = ({ tone = 'blue', className = '', children }) => (
  <span
    className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider shadow-e1 ${CARD_BADGE_TONES[tone]} ${className}`}
  >
    {children}
  </span>
);

/**
 * A project tile. Used on the home carousel and the projects page so both read
 * identically.
 *
 * `badge`, `description` and `meta` are optional: the home strip shows only the
 * photo and the name, while the projects page adds a status pill, a two-line
 * excerpt and a footer of facts. Anything not passed simply isn't rendered, so
 * the two can't drift apart on the parts they do share.
 *
 * `meta` is a list of `{ icon, label }`, drawn as a hairline-separated row at
 * the foot of the card.
 */
export const ProjectCard = ({
  project,
  onClick,
  to,
  imageHeight = 'h-56 sm:h-60',
  badge,
  badgeTone = 'blue',
  description,
  meta = [],
  cta,
}) => {
  const body = (
    <div className={`group flex h-full flex-col overflow-hidden ${SURFACE_INTERACTIVE}`}>
      <div className="relative overflow-hidden">
        <ProjectImage
          src={project.images?.[0]?.url}
          alt={project.name}
          className={`w-full ${imageHeight} object-cover transition duration-500 ease-standard group-hover:scale-105`}
        />
        {(onClick || to) && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/70 to-black/40 opacity-0 transition duration-300 ease-standard group-hover:opacity-100">
            <span className="rounded-full bg-white/95 px-4 py-2 text-sm font-semibold text-blue-700 shadow-e2">
              View Details
            </span>
          </div>
        )}
        {badge && (
          <CardBadge tone={badgeTone} className="absolute right-3 top-3 z-10">
            {badge}
          </CardBadge>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <h3 className="text-base font-semibold text-gray-900 transition-colors duration-200 group-hover:text-blue-700 sm:text-lg">
          {project.name}
        </h3>
        {description && (
          /* Clamped to two lines so every card in a row ends at the same
             height, however much the admin typed. */
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-gray-600">
            {description}
          </p>
        )}
        {cta && (
          /* The card is already one big link, so this reads as an affordance
             rather than a second target — hence a span, not an anchor. */
          <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 transition-colors duration-200 group-hover:text-blue-700">
            {cta}
            <FaArrowRight
              className="text-xs transition-transform duration-200 ease-standard group-hover:translate-x-1"
              aria-hidden="true"
            />
          </span>
        )}
        {meta.length > 0 && (
          <div className="mt-auto flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-gray-100 pt-4 text-xs text-gray-500 sm:text-[13px]">
            {meta.map(({ icon: Icon, label }) => (
              <span key={label} className="inline-flex items-center gap-1.5">
                <Icon className="flex-shrink-0 text-gray-400" aria-hidden="true" />
                {label}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  if (to) {
    return (
      <Link
        to={to}
        className={`block h-full rounded-xl ${FOCUS_RING} focus-visible:ring-blue-500`}
      >
        {body}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`block h-full w-full rounded-xl text-left ${FOCUS_RING} focus-visible:ring-blue-500`}
      >
        {body}
      </button>
    );
  }

  return body;
};

/**
 * <img> that degrades to a neutral placeholder instead of a broken icon.
 *
 * `sizes` describes how wide the image is painted so the browser can pick the
 * right file from the srcset; the default matches the project card grid
 * (roughly a third of the page on desktop, full width on a phone).
 */
export const ProjectImage = ({
  src,
  alt,
  className = '',
  sizes = '(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw',
}) =>
  src ? (
    <img
      src={cloudinaryUrl(src, { width: 800 })}
      srcSet={cloudinarySrcSet(src, [400, 800, 1200])}
      sizes={sizes}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={className}
    />
  ) : (
    <div
      className={`flex items-center justify-center bg-gray-100 text-sm text-gray-400 ${className}`}
    >
      No image
    </div>
  );
