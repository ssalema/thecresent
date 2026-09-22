import { useRef } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Swal from "sweetalert2";
import {
  FaArrowRight,
  FaCheckCircle,
  FaGraduationCap,
  FaHandHoldingHeart,
  FaHandHoldingUsd,
  FaHeart,
  FaHeartbeat,
  FaLock,
  FaPhoneAlt,
  FaSeedling,
  FaShieldAlt,
  FaUser,
  FaUsers,
} from "react-icons/fa";
import heroBg from "../assets/Contactbg.png";
import { Button, Card, Field, Input, Textarea } from "../components/ui";
import {
  DARK_BAND,
  ERROR_TEXT,
  FOCUS_RING,
  HEADING_2,
  TRANSITION,
} from "../components/ui/tokens";
import { useOrganization } from "../context/OrganizationContext";
import api, { apiErrorMessage } from "../lib/api";
// The list of funds, the preset amounts and the short explainer shown once a
// fund is chosen live with the schema, so the options offered and the options
// accepted cannot drift.
import {
  DONATION_PRESETS,
  DONATION_TYPES,
  donationDefaults,
  donationSchema,
} from "../lib/schemas";

const RAZORPAY_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";

/** The icon each fund is shown with, keyed by the schema's `value`. */
const TYPE_ICONS = {
  zakat: FaHandHoldingUsd,
  fitr: FaSeedling,
  lillah: FaHeart,
};

/** The three promises made in the hero, under the headline. */
const HERO_PROMISES = [
  { icon: FaHandHoldingUsd, label: "Trusted &\nTransparent" },
  { icon: FaShieldAlt, label: "Secure\nDonations" },
  { icon: FaHandHoldingHeart, label: "100% For\nThe Cause" },
];

/** What the money goes to — the band under the form. */
const IMPACTS = [
  {
    icon: FaUsers,
    title: "Support Communities",
    body: "Help us provide food, shelter, and essentials to those in need.",
  },
  {
    icon: FaGraduationCap,
    title: "Educate & Empower",
    body: "Your support helps children access quality education.",
  },
  {
    icon: FaHeartbeat,
    title: "Healthcare for All",
    body: "We provide medical aid and healthcare to the underprivileged.",
  },
  {
    icon: FaHandHoldingHeart,
    title: "Build a Better Tomorrow",
    body: "Together, we build a stronger, kinder, and more hopeful society.",
  },
];

const ASSURANCES = [
  "SSL Encrypted Transactions",
  "100% Donation for Causes",
  "Regular Updates & Reporting",
];

/** The policy links in the fine print under the pay button. */
const FINE_PRINT_LINK = `rounded-sm font-medium text-blue-700 underline-offset-4 hover:underline ${TRANSITION} ${FOCUS_RING} focus-visible:ring-blue-500`;

/** The small-caps heading that opens each block of the form. */
const GROUP_LABEL =
  "mb-3 block text-xs font-semibold uppercase tracking-wider text-gray-500";

/**
 * The shared look of the fund chips and the amount chips: a control at the same
 * height as an Input, reading as unselected until it takes the blue outline and
 * tint the rest of the site uses for a chosen thing.
 */
const chipClass = (active) =>
  [
    "inline-flex min-h-[48px] items-center justify-center gap-2 rounded-lg border px-3 text-sm font-semibold",
    TRANSITION,
    FOCUS_RING,
    "focus-visible:ring-blue-500",
    active
      ? "border-blue-600 bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600"
      : "border-gray-300 bg-white text-gray-700 shadow-sm hover:border-gray-400 hover:bg-gray-50",
  ].join(" ");

// Load the Razorpay checkout script once, on demand
const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);

    const existing = document.querySelector(`script[src="${RAZORPAY_SCRIPT}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(true));
      existing.addEventListener("error", () => resolve(false));
      return;
    }

    const script = document.createElement("script");
    script.src = RAZORPAY_SCRIPT;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

const Donate = () => {
  const { organizationName, logo, contactEmail, contactNumber } = useOrganization();

  // The amount is driven from two places — the preset chips and the box itself
  // — so the box is held by a ref, to focus it when "Other" is chosen.
  const amountRef = useRef(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(donationSchema),
    defaultValues: donationDefaults,
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  /**
   * Keep a field to the characters it accepts as it is typed.
   *
   * The DOM node is the source of truth for a registered input, so the value is
   * sanitized on the event before RHF's own handler reads it.
   */
  const filtered = (name, disallowed) => {
    const field = register(name);
    return {
      ...field,
      onChange: (e) => {
        e.target.value = e.target.value.replace(disallowed, "");
        return field.onChange(e);
      },
    };
  };

  // Registered here rather than inline: the ref RHF hands back is merged with
  // ours below, so the box stays registered and is still focusable from "Other".
  const amountField = filtered("amount", /\D/g);

  const selectedTypeValue = watch("type");
  const selectedType = DONATION_TYPES.find(
    (item) => item.value === selectedTypeValue
  );
  const amount = watch("amount");

  // "Other" is not a value of its own — it is the state of holding an amount
  // none of the chips offer, which an empty box also is.
  const presetActive = DONATION_PRESETS.some((preset) => String(preset) === amount);

  /*
   * Re-validate on a chip press only once the field has already failed, which
   * is what the form's reValidateMode does for typed input. Before that, a
   * press must not be able to raise an error on a field the visitor has not
   * finished with.
   */
  const chooseType = (value) =>
    setValue("type", value, { shouldValidate: Boolean(errors.type) });

  const choosePreset = (preset) =>
    setValue("amount", String(preset), { shouldValidate: Boolean(errors.amount) });

  const chooseOther = () => {
    setValue("amount", "", { shouldValidate: false });
    amountRef.current?.focus();
  };

  const onSubmit = async (form) => {
    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        Swal.fire({
          icon: "error",
          title: "Unable to load payment gateway",
          text: "Please check your internet connection and try again.",
        });
        return;
      }

      // 1. Create the order on the server
      const { data: order } = await api.post("/donations/create-order", form);

      // 2. Open the Razorpay checkout
      const razorpay = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: organizationName,
        image: logo?.url || undefined,
        description: `${form.type} Donation`,
        order_id: order.orderId,
        prefill: { name: form.name, contact: form.mobile },
        // The API has no field for the donor's message, so it rides along on
        // the payment as a gateway note rather than being quietly dropped.
        notes: {
          type: form.type,
          ...(form.message ? { message: form.message } : {}),
        },
        theme: { color: "#2563eb" },
        handler: async (response) => {
          // 3. Verify the signature on the server
          try {
            await api.post('/donations/verify', response);

            Swal.fire({
              icon: "success",
              title: "Thank you for Donating!",
              text: `Payment ID: ${response.razorpay_payment_id}`,
              showConfirmButton: false,
              timer: 3000,
            });

            reset(donationDefaults);
          } catch (error) {
            console.error(error);
            const reachUs = contactEmail || contactNumber;
            Swal.fire({
              icon: "error",
              title: "Payment verification failed",
              text: reachUs
                ? `If money was deducted, please contact us at ${reachUs} with your payment ID.`
                : "If money was deducted, please contact us with your payment ID.",
            });
          }
        },
        modal: {
          ondismiss: () => {
            api
              .post('/donations/failed', { razorpay_order_id: order.orderId })
              .catch((error) => console.error(error));
          },
        },
      });

      razorpay.on("payment.failed", (response) => {
        api
          .post('/donations/failed', { razorpay_order_id: order.orderId })
          .catch((error) => console.error(error));

        // A decline never captures the payment, so say so plainly. Without it
        // the gateway's wording alone reads as if money may have moved.
        Swal.fire({
          icon: "error",
          title: "Payment failed",
          text: `${response.error?.description || "Please try again."} No amount has been deducted.`,
        });
      });

      razorpay.open();
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: "error",
        title: "Unable to start payment",
        text: apiErrorMessage(error, "Please try again."),
      });
    }
  };

  return (
    <div className="bg-gray-50 pt-16">
      {/*
        The hero runs deep and the form is pulled back up over it, so the page
        opens on the donation itself rather than on a banner to scroll past.
        The other inner pages use PageHero; this one carries the same
        photograph and the same blue wash, so it still reads as the same site.
      */}
      <header
        className={`relative overflow-hidden px-4 pb-44 pt-12 sm:px-6 sm:pb-48 sm:pt-16 ${DARK_BAND}`}
      >
        <div
          className="absolute inset-0 bg-cover bg-center opacity-40"
          style={{ backgroundImage: `url(${heroBg})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-blue-950 via-blue-950/85 to-blue-950/40" />

        <div className="relative z-10 mx-auto max-w-3xl text-white">
          <p className="flex items-center gap-2 text-sm font-semibold text-blue-200">
            <FaHeart aria-hidden="true" />
            Donate to Make a Difference
          </p>

          <h1 className="mt-3 text-3xl font-bold leading-tight tracking-tight sm:text-4xl md:text-5xl">
            Your Donation
            <span className="block text-blue-400">Changes Lives</span>
          </h1>

          <p className="mt-4 max-w-md text-base leading-relaxed text-blue-100">
            Every contribution helps us serve humanity and bring hope to those in
            need.
          </p>

          <ul className="mt-8 flex flex-wrap gap-x-10 gap-y-6">
            {HERO_PROMISES.map(({ icon: Icon, label }) => (
              <li key={label} className="max-w-[7rem]">
                <Icon className="text-xl text-blue-200" aria-hidden="true" />
                <p className="mt-2 whitespace-pre-line text-xs font-medium leading-snug text-blue-50">
                  {label}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </header>

      <div className="relative z-10 mx-auto -mt-32 max-w-3xl px-4 pb-14 sm:px-6 sm:pb-20">
        <Card>
          <div className="text-center">
            <h2
              className={`flex items-center justify-center gap-3 ${HEADING_2} text-gray-900`}
            >
              <FaHandHoldingHeart className="text-blue-600" aria-hidden="true" />
              Make a Donation
            </h2>
            <p className="mt-1.5 text-sm text-gray-500">
              Choose your donation details and help us bring change.
            </p>
          </div>

          {/* Donation Form */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="mt-8 space-y-7"
          >
            {/* --------------------------------------------- donation type */}
            <fieldset>
              <legend className={GROUP_LABEL}>Donation Type</legend>

              {/* The value lives in the form; the chips are its control. */}
              <input type="hidden" {...register("type")} />

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {DONATION_TYPES.map((item) => {
                  const Icon = TYPE_ICONS[item.value];
                  const active = selectedTypeValue === item.value;

                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => chooseType(item.value)}
                      aria-pressed={active}
                      className={chipClass(active)}
                    >
                      {Icon && (
                        <Icon
                          className={active ? "text-blue-600" : "text-gray-500"}
                          aria-hidden="true"
                        />
                      )}
                      {item.label}
                    </button>
                  );
                })}
              </div>

              {errors.type ? (
                <p className={ERROR_TEXT} role="alert">
                  {errors.type.message}
                </p>
              ) : (
                selectedType && (
                  // Zakat, Fitr and Lillah are three different obligations held
                  // in three separate funds, so the gist stays on the page —
                  // the choice above it has to be an informed one.
                  <p className="mt-2.5 text-sm leading-relaxed text-gray-500">
                    <span className="font-semibold text-gray-700">
                      {selectedType.label}:
                    </span>{" "}
                    {selectedType.gist}
                  </p>
                )
              )}
            </fieldset>

            {/* ----------------------------------------------- your details */}
            <fieldset>
              <legend className={GROUP_LABEL}>Your Details</legend>

              {/* Visible labels, the same as the contact form. A placeholder
                  alone names a field only until the donor starts typing in
                  it — on the one form where a mistake costs money, the label
                  has to stay on screen. */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field
                  label="Full Name"
                  htmlFor="donation-name"
                  error={errors.name?.message}
                >
                  <div className="relative">
                    <FaUser
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                      aria-hidden="true"
                    />
                    <Input
                      id="donation-name"
                      type="text"
                      placeholder="Your name"
                      className="pl-10"
                      error={errors.name}
                      {...filtered("name", /[^A-Za-z\s]/g)}
                    />
                  </div>
                </Field>

                <Field
                  label="Mobile Number"
                  htmlFor="donation-mobile"
                  error={errors.mobile?.message}
                >
                  <div className="relative">
                    <FaPhoneAlt
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                      aria-hidden="true"
                    />
                    <Input
                      id="donation-mobile"
                      type="text"
                      placeholder="9876543210"
                      inputMode="numeric"
                      maxLength="10"
                      className="pl-10"
                      error={errors.mobile}
                      {...filtered("mobile", /\D/g)}
                    />
                  </div>
                </Field>
              </div>
            </fieldset>

            {/* ----------------------------------------------------- amount */}
            <fieldset>
              <legend className={GROUP_LABEL}>Donation Amount</legend>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                {DONATION_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => choosePreset(preset)}
                    aria-pressed={String(preset) === amount}
                    className={chipClass(String(preset) === amount)}
                  >
                    ₹{preset.toLocaleString("en-IN")}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={chooseOther}
                  aria-pressed={!presetActive}
                  className={chipClass(!presetActive)}
                >
                  Other
                </button>
              </div>

              <Field
                htmlFor="donation-amount"
                error={errors.amount?.message}
                className="mt-3"
              >
                <div className="relative">
                  <span
                    className="pointer-events-none absolute left-px top-px flex w-10 items-center justify-center rounded-l-lg border-r border-gray-300 bg-gray-50 text-gray-500"
                    style={{ height: "calc(100% - 2px)" }}
                    aria-hidden="true"
                  >
                    ₹
                  </span>
                  <Input
                    id="donation-amount"
                    type="text"
                    aria-label="Donation amount in rupees"
                    placeholder="Enter Amount"
                    inputMode="numeric"
                    className="pl-14"
                    error={errors.amount}
                    {...amountField}
                    ref={(node) => {
                      amountField.ref(node);
                      amountRef.current = node;
                    }}
                  />
                </div>
              </Field>
            </fieldset>

            {/* ---------------------------------------------------- message */}
            <fieldset>
              <legend className={GROUP_LABEL}>Message (Optional)</legend>

              <Field
                htmlFor="donation-message"
                error={errors.message?.message}
                hint={
                  <span className="inline-flex items-center gap-2">
                    <FaShieldAlt className="flex-shrink-0" aria-hidden="true" />
                    Your message may be shared anonymously
                  </span>
                }
              >
                <Textarea
                  id="donation-message"
                  rows={3}
                  aria-label="Message"
                  placeholder="Add a message of hope…"
                  maxLength={500}
                  error={errors.message}
                  {...register("message")}
                />
              </Field>
            </fieldset>

            <div className="pt-1">
              <Button
                type="submit"
                size="lg"
                fullWidth
                loading={isSubmitting}
                icon={FaHeart}
                trailingIcon={FaArrowRight}
              >
                {isSubmitting ? "Opening Payment…" : "Donate Securely"}
              </Button>

              <p className="mt-4 flex items-center justify-center gap-2 text-center text-xs text-gray-500">
                <FaLock className="flex-shrink-0" aria-hidden="true" />
                Your donation is secure and encrypted. We respect your privacy.
              </p>

              {/* The fine print a donor is entitled to read before paying,
                  rather than only in the footer once the money has gone. */}
              <p className="mt-2 text-center text-xs leading-relaxed text-gray-500">
                By donating you agree to our{" "}
                <Link to="/terms-and-conditions" className={FINE_PRINT_LINK}>
                  Terms &amp; Conditions
                </Link>
                ,{" "}
                <Link to="/privacy-policy" className={FINE_PRINT_LINK}>
                  Privacy Policy
                </Link>{" "}
                and{" "}
                <Link to="/refund-policy" className={FINE_PRINT_LINK}>
                  Refund Policy
                </Link>
                .
              </p>
            </div>
          </form>
        </Card>

        {/* -------------------------------------------------------- impact */}
        <Card className="mt-8">
          <h2 className={`text-center ${HEADING_2} text-gray-900`}>
            Your Donation Creates Real Impact
          </h2>

          <ul className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0 lg:divide-x lg:divide-gray-200">
            {IMPACTS.map(({ icon: Icon, title, body }) => (
              <li key={title} className="px-2 text-center lg:px-5">
                <Icon className="mx-auto text-3xl text-blue-600" aria-hidden="true" />
                <h3 className="mt-4 text-base font-bold text-gray-900">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{body}</p>
              </li>
            ))}
          </ul>
        </Card>

        {/* ---------------------------------------------------- assurances */}
        <div
          className={`mt-8 flex flex-col items-center gap-8 rounded-xl p-6 shadow-e1 ring-1 ring-gray-900/5 sm:p-8 lg:flex-row lg:justify-between ${DARK_BAND}`}
        >
          <div className="flex items-center gap-5 text-center lg:text-left">
            <FaShieldAlt
              className="hidden flex-shrink-0 text-5xl text-white/90 sm:block"
              aria-hidden="true"
            />
            <div>
              <h2 className={HEADING_2}>Secure. Transparent. Trusted.</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-blue-100">
                We ensure your donation reaches the right hands.
              </p>
            </div>
          </div>

          <ul className="space-y-2.5">
            {ASSURANCES.map((item) => (
              <li key={item} className="flex items-center gap-3 text-sm">
                <FaCheckCircle className="flex-shrink-0 text-white" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Donate;
