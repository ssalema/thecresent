import { z } from 'zod';

/**
 * Form schemas for the public site.
 *
 * These mirror server/validation/schemas.js field for field and message for
 * message, so a visitor sees the same wording whether the problem is caught in
 * the browser or by the API. The server re-checks everything — this is
 * convenience, never enforcement.
 */

// Mirrors isEmail in server/src/utils/validators.js — change both together.
// The unsafe set is punctuation that never appears in an unquoted address but
// would break out of the mailto: and compose URLs an address is dropped into.
const EMAIL_URL_UNSAFE = /[&#?/\\%"<>]/;

const isEmail = (value) => {
  const trimmed = String(value).trim();
  if (EMAIL_URL_UNSAFE.test(trimmed)) return false;
  return /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(trimmed);
};

/* ----------------------------------------------------------------- contact */

export const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Your name is required')
    .max(100, 'Name must be 100 characters or fewer'),
  email: z
    .string()
    .trim()
    .min(1, 'An email address is required')
    .refine(isEmail, 'Enter a valid email address')
    .refine((value) => value.length <= 254, 'That email address is too long'),
  // Stricter than the server's 7–15 digits, matching what the field lets you
  // type. A subset of what the API accepts is always safe.
  number: z
    .string()
    .trim()
    .min(1, 'A contact number is required')
    .refine((value) => /^\d{10}$/.test(value), 'Enter a 10-digit mobile number'),
  message: z
    .string()
    .trim()
    .min(1, 'Please write a message')
    .max(5000, 'Message must be 5000 characters or fewer'),
});

export const contactDefaults = { name: '', email: '', number: '', message: '' };

/* ------------------------------------------------------------------ donate */

// Must match the funds the server tracks separately — see DONATION_TYPES there.
export const DONATION_TYPES = [
  {
    value: 'zakat',
    label: 'Zakat',
    gist:
      "The obligatory annual charity — 2.5% of the wealth you have held for a full lunar year. It may only be spent on the eight categories of recipients named in the Qur'an, so we keep it in a separate fund.",
  },
  {
    value: 'fitr',
    label: 'Fitr',
    gist:
      'Zakat al-Fitr — the fixed charity given by every member of a household before the Eid al-Fitr prayer. It must reach those in need in time for Eid, so we distribute it during Ramadan itself.',
  },
  {
    value: 'lillah',
    label: 'Lillah',
    gist:
      'A voluntary gift given purely for the sake of Allah, with no fixed amount or conditions. It funds our general work — education, food, medical aid and running costs.',
  },
];

const DONATION_VALUES = DONATION_TYPES.map((type) => type.value);

const MAX_DONATION_RUPEES = 500000;

const MAX_DONATION_MESSAGE = 500;

export const donationSchema = z.object({
  type: z
    .string()
    .min(1, 'Select a donation type')
    .refine((value) => DONATION_VALUES.includes(value), 'Select a donation type'),
  name: z
    .string()
    .trim()
    .min(1, 'Enter your name')
    .max(100, 'Name must be 100 characters or fewer')
    .refine(
      (value) => /^[A-Za-z\s]+$/.test(value),
      'Name can only contain letters and spaces'
    ),
  mobile: z
    .string()
    .trim()
    .min(1, 'Enter your mobile number')
    .refine((value) => /^\d{10}$/.test(value), 'Enter a 10-digit mobile number'),
  // Held as text so the field can stay empty; Razorpay is handed a number.
  amount: z
    .string()
    .trim()
    .min(1, 'Enter a donation amount')
    .refine((value) => /^\d+$/.test(value), 'Enter the amount in whole rupees')
    .refine((value) => Number(value) >= 1, 'Enter an amount of at least ₹1')
    .refine(
      (value) => Number(value) <= MAX_DONATION_RUPEES,
      `For donations above ₹${MAX_DONATION_RUPEES.toLocaleString(
        'en-IN'
      )}, please contact us directly`
    ),
  // An optional note from the donor. The API's createOrderBody does not name
  // this field, so the server strips it rather than storing it — it travels
  // with the payment as a Razorpay note instead. Optional means the form still
  // validates whether or not a message is written.
  message: z
    .string()
    .trim()
    .max(
      MAX_DONATION_MESSAGE,
      `Message must be ${MAX_DONATION_MESSAGE} characters or fewer`
    )
    .optional(),
});

/** The amounts offered as one-tap chips on the donate form, in rupees. */
export const DONATION_PRESETS = [500, 1000, 2500, 5000];

/*
 * The form opens on the first fund and the smallest preset already chosen, so
 * a donor who agrees with both can reach the pay button in two fields. Read
 * from the lists above rather than repeated, so a retired fund or a changed
 * preset cannot leave the form opening on a value it no longer offers.
 */
export const donationDefaults = {
  type: DONATION_TYPES[0].value,
  name: '',
  mobile: '',
  amount: String(DONATION_PRESETS[0]),
  message: '',
};
