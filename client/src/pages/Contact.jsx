import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  FaPhone,
  FaMapMarkerAlt,
  FaEnvelope,
  FaWhatsapp,
  FaGlobe,
} from "react-icons/fa";
import {
  Button,
  Card,
  Field,
  IconBadge,
  Input,
  Notice,
  PageHero,
  Section,
  Textarea,
} from "../components/ui";
import { CONTACT_LINK, HEADING_2 } from "../components/ui/tokens";
import Skeleton from "react-loading-skeleton";
import { ContactLineSkeleton } from "../components/ui/skeletons";
import {
  useOrganizationContext,
  telHref,
  mailtoHref,
  whatsappHref,
} from "../context/OrganizationContext";
import api, { apiErrorMessage, apiFieldErrors } from "../lib/api";
import { contactDefaults, contactSchema } from "../lib/schemas";

/** One line of contact detail: badge, label, and the value or link. */
const InfoRow = ({ icon, tone, label, children }) => (
  <li className="flex items-start gap-3">
    <IconBadge icon={icon} tone={tone} />
    <div className="min-w-0 pt-1.5">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <div className="mt-0.5 text-sm text-gray-800 sm:text-base">{children}</div>
    </div>
  </li>
);

const Contact = () => {
  const { organization, loading: organizationLoading } = useOrganizationContext();
  const {
    organizationName,
    address,
    contactNumber,
    contactEmail,
    whatsappNumber,
    websiteUrl,
    mapEmbedUrl,
  } = organization;

  const whatsapp = whatsappHref(
    whatsappNumber,
    organizationName ? `Hello ${organizationName}, I'd like to get in touch.` : ""
  );

  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    setError: setFieldError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(contactSchema),
    defaultValues: contactDefaults,
    // Quiet until the first submit, then live: nothing is flagged before the
    // visitor has finished typing it, and a corrected field clears as they fix it.
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

  const onSubmit = async (values) => {
    setError("");

    try {
      await api.post("/contacts", values);
      setSubmitted(true);
      reset(contactDefaults);
      setTimeout(() => setSubmitted(false), 6000);
    } catch (err) {
      // The old version logged this and left the form looking untouched, so a
      // failed send was indistinguishable from a successful one.
      console.error("Error submitting contact form:", err);

      // The server validates the same rules; if it disagrees with us, show its
      // verdict on the fields themselves rather than as one opaque banner.
      const fieldErrors = apiFieldErrors(err);
      if (fieldErrors) {
        for (let [field, message] of Object.entries(fieldErrors)) {
          setFieldError(field, { type: "server", message });
        }
      }

      setError(
        apiErrorMessage(
          err,
          "Your message could not be sent. Please try again, or reach us on the number above."
        )
      );
    }
  };

  return (
    <div className="bg-gray-50 pt-16">
      <PageHero
        title="Contact Us"
        subtitle="We're here to help. Reach out for any queries, support, or collaboration."
      />

      <Section containerClassName="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Left: contact details */}
        <Card>
          <div className="mb-6 border-b border-gray-200 pb-4">
            <h2 className={`${HEADING_2} text-gray-900`}>
              Get In <span className="text-blue-600">Touch</span>
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              We're always happy to hear from you.
            </p>
          </div>

          <ul className="space-y-5">
            {organizationLoading &&
              [0, 1, 2, 3, 4].map((i) => (
                <li key={i}>
                  <ContactLineSkeleton />
                </li>
              ))}

            {!organizationLoading && address && (
              <InfoRow icon={FaMapMarkerAlt} tone="blue" label="Head Office">
                {address}
              </InfoRow>
            )}

            {contactNumber && (
              <InfoRow icon={FaPhone} tone="green" label="Phone">
                <a
                  href={telHref(contactNumber)}
                  className={CONTACT_LINK}
                >
                  {contactNumber}
                </a>
              </InfoRow>
            )}

            {whatsapp && (
              <InfoRow icon={FaWhatsapp} tone="green" label="WhatsApp">
                <a
                  href={whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={CONTACT_LINK}
                >
                  Chat on WhatsApp
                </a>
              </InfoRow>
            )}

            {contactEmail && (
              <InfoRow icon={FaEnvelope} tone="red" label="Email">
                <a
                  href={mailtoHref(contactEmail)}
                  className={`break-all ${CONTACT_LINK}`}
                >
                  {contactEmail}
                </a>
              </InfoRow>
            )}

            {websiteUrl && (
              <InfoRow icon={FaGlobe} tone="blue" label="Website">
                <a
                  href={websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`break-all ${CONTACT_LINK}`}
                >
                  {websiteUrl.replace(/^https?:\/\//, "")}
                </a>
              </InfoRow>
            )}
          </ul>

          {organizationLoading && (
            <Skeleton
              containerClassName="mt-6 flex h-56 w-full sm:h-64"
              className="!h-full"
            />
          )}

          {!organizationLoading && mapEmbedUrl && (
            <iframe
              title={
                organizationName ? `${organizationName} location` : "Office location"
              }
              src={mapEmbedUrl}
              className="mt-6 h-56 w-full rounded-lg border border-gray-200 sm:h-64"
              allowFullScreen=""
              loading="lazy"
            ></iframe>
          )}
        </Card>

        {/* Right: message form */}
        <Card>
          <div className="mb-6 border-b border-gray-200 pb-4">
            <h2 className={`${HEADING_2} text-gray-900`}>Send Us a Message</h2>
            <p className="mt-1 text-sm text-gray-500">
              Fill in the form and our team will get back to you.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
            {submitted && (
              <Notice tone="success">
                Thank you for contacting us. Our team will reach you soon.
              </Notice>
            )}

            {error && <Notice tone="error">{error}</Notice>}

            <Field
              label="Name"
              htmlFor="contact-name"
              error={errors.name?.message}
            >
              <Input
                id="contact-name"
                type="text"
                placeholder="Your name"
                error={errors.name}
                {...filtered("name", /[^a-zA-Z\s]/g)}
              />
            </Field>

            <Field
              label="Email"
              htmlFor="contact-email"
              error={errors.email?.message}
            >
              <Input
                id="contact-email"
                type="email"
                placeholder="you@example.com"
                error={errors.email}
                {...register("email")}
              />
            </Field>

            <Field
              label="Mobile Number"
              htmlFor="contact-number"
              error={errors.number?.message}
              hint="10 digits, no spaces."
            >
              <Input
                id="contact-number"
                type="text"
                inputMode="numeric"
                placeholder="9876543210"
                maxLength={10}
                error={errors.number}
                {...filtered("number", /\D/g)}
              />
            </Field>

            <Field
              label="Message"
              htmlFor="contact-message"
              error={errors.message?.message}
            >
              <Textarea
                id="contact-message"
                placeholder="How can we help?"
                rows={5}
                error={errors.message}
                {...register("message")}
              />
            </Field>

            <Button type="submit" loading={isSubmitting} fullWidth size="md">
              {isSubmitting ? "Sending…" : "Submit"}
            </Button>
          </form>
        </Card>
      </Section>
    </div>
  );
};

export default Contact;
