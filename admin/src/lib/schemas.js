import { z } from 'zod';
// Extension included deliberately: Vite resolves it either way, but the test
// runner is plain Node ESM, which does not.
import { extractMapSrc, isEmail, isPhone, isUrl } from './validators.js';

/**
 * Form schemas for the admin panel.
 *
 * These mirror server/validation/schemas.js field for field and message for
 * message, so an admin sees the same wording whether the problem is caught here
 * or by the API. The server re-checks everything — this is convenience, never
 * enforcement.
 *
 * Image files are not fields in these schemas: they live in their own state
 * alongside the form and are checked with validateImage() from lib/validators.
 */

/** Optional text: blank is allowed, anything else must pass the check. */
const blankOr = (predicate, message) =>
  z.string().trim().refine((value) => value === '' || predicate(value), message);

/* ------------------------------------------------------------------- login */

export const loginSchema = z.object({
  username: z.string().trim().min(1, 'Enter your username'),
  // Not trimmed: a password's leading and trailing spaces are part of it.
  password: z.string().min(1, 'Enter your password'),
});

export const loginDefaults = { username: '', password: '' };

/* ---------------------------------------------------------------- projects */

export const PROJECT_CATEGORIES = [
  { value: 'current', label: 'Current' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'completed', label: 'Completed' },
];

const CATEGORY_VALUES = PROJECT_CATEGORIES.map((category) => category.value);

export const projectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Project name is required')
    .max(150, 'Project name must be 150 characters or fewer'),
  category: z
    .string()
    .refine((value) => CATEGORY_VALUES.includes(value), 'Choose a valid project category'),
  description: z
    .string()
    .trim()
    .min(1, 'Description is required')
    .max(10000, 'Description must be 10000 characters or fewer'),
});

export const projectDefaults = { name: '', category: 'current', description: '' };

/* ----------------------------------------------------------------- gallery */

export const gallerySchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Title is required')
    .max(150, 'Title must be 150 characters or fewer'),
});

export const galleryDefaults = { title: '' };

/* ---------------------------------------------------------------- settings */

export const SOCIAL_FIELDS = [
  { key: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/your-page' },
  { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/your-handle' },
  { key: 'twitter', label: 'Twitter (X)', placeholder: 'https://x.com/your-handle' },
  { key: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/company/your-org' },
  { key: 'youtube', label: 'YouTube', placeholder: 'https://youtube.com/@your-channel' },
];

// Built from SOCIAL_FIELDS so adding a network is a one-line change, and the
// error names the network the admin is actually looking at.
const socialSchema = z.object(
  Object.fromEntries(
    SOCIAL_FIELDS.map(({ key, label }) => [key, blankOr(isUrl, `Enter a valid ${label} URL`)])
  )
);

export const settingsSchema = z.object({
  organizationName: z
    .string()
    .trim()
    .min(1, 'Organization name is required')
    .max(120, 'Organization name must be 120 characters or fewer'),
  tagline: z.string(),
  contactEmail: blankOr(isEmail, 'Enter a valid email address'),
  contactNumber: blankOr(isPhone, 'Enter a valid contact number (7–15 digits)'),
  whatsappNumber: blankOr(isPhone, 'Enter a valid WhatsApp number (7–15 digits)'),
  address: z.string(),
  websiteUrl: blankOr(isUrl, 'Enter a valid URL starting with http:// or https://'),
  // Admins usually paste the whole Google Maps <iframe>; the src is pulled out
  // of it and the server stores just that URL. Only a Google Maps embed over
  // https is accepted — the value is rendered as an iframe src on the public
  // Contact page. See isMapEmbedUrl in lib/validators.js.
  mapEmbedUrl: blankOr(
    extractMapSrc,
    'Paste a Google Maps embed link (https://www.google.com/maps/embed?…) or its full <iframe> code'
  ),
  social: socialSchema,
  seo: z.object({
    metaTitle: z.string().trim().max(70, 'Meta title should be 70 characters or fewer'),
    metaDescription: z
      .string()
      .trim()
      .max(320, 'Meta description should be 320 characters or fewer'),
    metaKeywords: z.string(),
  }),
});
