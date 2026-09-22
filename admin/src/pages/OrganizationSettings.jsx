import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  FaBuilding,
  FaSearch,
  FaImage,
  FaShareAlt,
  FaTrash,
  FaUpload,
} from 'react-icons/fa';
import MessageDialog from '../components/MessageDialog';
import {
  Button,
  Card,
  Field,
  Input,
  PageHeader,
  PageShell,
  Textarea,
} from '../components/ui';
import { DROPZONE, ERROR_TEXT, HINT, LABEL } from '../components/ui/tokens';
import { SettingsFormSkeleton } from '../components/ui/skeletons';
import {
  EMPTY_ORGANIZATION,
  initialsOf,
  useOrganizationContext,
} from '../context/OrganizationContext';
import {
  IMAGE_ACCEPT,
  MAX_BRANDING_BYTES,
  MAX_BRANDING_LABEL,
  validateImage,
} from '../lib/validators';
import api, {
  apiErrorMessage,
  apiFieldErrors,
  uploadConfig,
} from '../lib/api';
import { SOCIAL_FIELDS, settingsSchema } from '../lib/schemas';

// The form mirrors the API document exactly, so saving is a straight copy.
const toForm = (organization) => ({
  organizationName: organization.organizationName || '',
  tagline: organization.tagline || '',
  contactEmail: organization.contactEmail || '',
  contactNumber: organization.contactNumber || '',
  whatsappNumber: organization.whatsappNumber || '',
  address: organization.address || '',
  websiteUrl: organization.websiteUrl || '',
  mapEmbedUrl: organization.mapEmbedUrl || '',
  social: { ...EMPTY_ORGANIZATION.social, ...(organization.social || {}) },
  seo: { ...EMPTY_ORGANIZATION.seo, ...(organization.seo || {}) },
});

/**
 * One branding image (logo or favicon): shows what is stored today, what is
 * about to replace it, and lets the admin clear it entirely.
 */
const ImagePicker = ({ label, hint, currentUrl, file, cleared, error, onPick, onClear }) => {
  const [preview, setPreview] = useState('');

  useEffect(() => {
    if (!file) {
      setPreview('');
      return undefined;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const shown = preview || (cleared ? '' : currentUrl);

  return (
    <div>
      {/* Labelled, hinted and error-marked exactly like a `Field` — a picked
          file is a form value, whatever the markup underneath. */}
      <p className={LABEL}>{label}</p>

      <div className="flex flex-col items-center gap-3 rounded-lg border border-gray-200 p-4">
        <div className="flex h-28 w-full items-center justify-center overflow-hidden rounded-lg bg-gray-50">
          {shown ? (
            <img src={shown} alt={label} className="max-h-full max-w-full object-contain" />
          ) : (
            <span className="text-sm text-gray-400">No image</span>
          )}
        </div>

        <div className="flex w-full flex-col gap-2 sm:flex-row">
          {/* The same dashed drop target as the upload tiles on the two upload
              screens — one way to hand the panel a file. */}
          <label
            className={`${DROPZONE} min-h-[44px] flex-1 gap-2 px-3 py-2 text-sm font-medium`}
          >
            <FaUpload />
            {shown ? 'Replace' : 'Upload'}
            <input
              type="file"
              accept={IMAGE_ACCEPT}
              className="hidden"
              onChange={(e) => {
                const picked = e.target.files?.[0] || null;
                e.target.value = ''; // allow re-picking the same file
                if (picked) onPick(picked);
              }}
            />
          </label>

          {shown && (
            <Button
              type="button"
              variant="dangerSoft"
              size="sm"
              icon={FaTrash}
              onClick={onClear}
            >
              Remove
            </Button>
          )}
        </div>
      </div>

      {error ? (
        <p className={ERROR_TEXT} role="alert">
          {error}
        </p>
      ) : (
        hint && <p className={HINT}>{hint}</p>
      )}
    </div>
  );
};

const OrganizationSettings = () => {
  const { organization, loading, setOrganization } = useOrganizationContext();

  const [logo, setLogo] = useState({ file: null, cleared: false });
  const [favicon, setFavicon] = useState({ file: null, cleared: false });
  // The two branding images are files, not form fields, so they carry their own
  // errors rather than living in the schema.
  const [imageErrors, setImageErrors] = useState({});
  const [dialog, setDialog] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(settingsSchema),
    defaultValues: toForm(organization),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  });

  // Re-seed once the initial fetch lands (and after a save, from the response).
  useEffect(() => {
    reset(toForm(organization));
    setLogo({ file: null, cleared: false });
    setFavicon({ file: null, cleared: false });
    setImageErrors({});
  }, [organization, reset]);

  // Only for the two live character counters under the SEO fields.
  const metaTitle = watch('seo.metaTitle') || '';
  const metaDescription = watch('seo.metaDescription') || '';
  const organizationName = watch('organizationName') || '';

  const lastUpdated = useMemo(() => {
    const value = organization.updatedAt;
    if (!value) return '';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : date.toLocaleString();
  }, [organization.updatedAt]);

  // The schema covers the text fields; the two picked files are checked here.
  // Branding is capped tighter than a gallery photo — see config/upload.js.
  const validateImages = () => {
    const next = {};
    const logoError = validateImage(logo.file, 'Logo', MAX_BRANDING_BYTES);
    if (logoError) next.logo = logoError;
    const faviconError = validateImage(
      favicon.file,
      'Favicon',
      MAX_BRANDING_BYTES
    );
    if (faviconError) next.favicon = faviconError;

    setImageErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (form) => {
    if (!validateImages()) {
      setDialog({
        type: 'warning',
        title: 'Please check the form',
        message: 'Some fields need attention before these settings can be saved.',
      });
      return;
    }

    try {
      const data = new FormData();
      data.append('organizationName', form.organizationName);
      data.append('tagline', form.tagline);
      data.append('contactEmail', form.contactEmail);
      data.append('contactNumber', form.contactNumber);
      data.append('whatsappNumber', form.whatsappNumber);
      data.append('address', form.address);
      data.append('websiteUrl', form.websiteUrl);
      data.append('mapEmbedUrl', form.mapEmbedUrl);
      data.append('social', JSON.stringify(form.social));
      data.append('seo', JSON.stringify(form.seo));

      if (logo.file) data.append('logo', logo.file);
      else if (logo.cleared) data.append('removeLogo', 'true');

      if (favicon.file) data.append('favicon', favicon.file);
      else if (favicon.cleared) data.append('removeFavicon', 'true');

      const res = await api.put('/settings', data, uploadConfig);

      // Push the saved document straight into context: the sidebar, receipts
      // and every other admin screen update immediately, and the website picks
      // it up on its next load — no redeploy involved.
      setOrganization(res.data.settings);

      setDialog({
        type: 'success',
        title: 'Organization settings saved',
        message:
          'These details now apply across the website, the admin panel and every receipt.',
      });
    } catch (err) {
      console.error(err);

      // The server names its fields the way the form does — `social.facebook`,
      // `seo.metaTitle` — so its verdict lands on the offending input.
      const fieldErrors = apiFieldErrors(err);
      if (fieldErrors) {
        for (let [field, message] of Object.entries(fieldErrors)) {
          setError(field, { type: 'server', message });
        }
      }

      // A 401 sends the panel back to the login screen (see lib/api.js), so
      // name the real cause rather than blaming the form.
      const expired = err?.response?.status === 401;
      setDialog({
        type: 'error',
        title: expired ? 'Your session has expired' : 'Could not save settings',
        message: expired
          ? 'Your changes were not saved. Please log in again and retry.'
          : 'Your changes were not saved. Please review the form and try again.',
        details: apiErrorMessage(err, err.message),
      });
    }
  };

  // Fired when the schema rejects something, so the dialog still appears.
  const onInvalid = () => {
    validateImages();
    setDialog({
      type: 'warning',
      title: 'Please check the form',
      message: 'Some fields need attention before these settings can be saved.',
    });
  };

  return (
    <PageShell>
      <PageHeader
        title="Organization Settings"
        description="The single source of truth for your organization. Everything here is used by the website, this panel, donation receipts and PDFs."
        meta={lastUpdated ? `Last updated: ${lastUpdated}` : undefined}
      />

      {loading ? (
        <SettingsFormSkeleton />
      ) : (
        <form
          onSubmit={handleSubmit(onSubmit, onInvalid)}
          noValidate
          className="space-y-6"
        >
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* ---------- General information ---------- */}
            <Card
              icon={FaBuilding}
              title="General Information"
              description="Name and contact details shown across the site."
              className="lg:col-span-2"
            >
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Field
                  label="Organization Name *"
                  htmlFor="organizationName"
                  error={errors.organizationName?.message}
                >
                  <Input
                    id="organizationName"
                    type="text"
                    placeholder="Your organization's name"
                    error={errors.organizationName}
                    maxLength={120}
                    {...register('organizationName')}
                  />
                </Field>

                <Field
                  label="Tagline"
                  htmlFor="tagline"
                  error={errors.tagline?.message}
                >
                  <Input
                    id="tagline"
                    type="text"
                    placeholder="A short line shown under your name"
                    error={errors.tagline}
                    {...register('tagline')}
                  />
                </Field>

                <Field
                  label="Contact Email"
                  htmlFor="contactEmail"
                  error={errors.contactEmail?.message}
                >
                  <Input
                    id="contactEmail"
                    type="email"
                    placeholder="info@example.org"
                    error={errors.contactEmail}
                    {...register('contactEmail')}
                  />
                </Field>

                <Field
                  label="Contact Number"
                  htmlFor="contactNumber"
                  error={errors.contactNumber?.message}
                >
                  <Input
                    id="contactNumber"
                    type="tel"
                    placeholder="+91 98765 43210"
                    error={errors.contactNumber}
                    {...register('contactNumber')}
                  />
                </Field>

                <Field
                  label="WhatsApp Number"
                  htmlFor="whatsappNumber"
                  error={errors.whatsappNumber?.message}
                  hint="Used for the WhatsApp links on the site and on receipts."
                >
                  <Input
                    id="whatsappNumber"
                    type="tel"
                    placeholder="+91 98765 43210"
                    error={errors.whatsappNumber}
                    {...register('whatsappNumber')}
                  />
                </Field>

                <Field
                  label="Website URL"
                  htmlFor="websiteUrl"
                  error={errors.websiteUrl?.message}
                >
                  <Input
                    id="websiteUrl"
                    type="url"
                    placeholder="https://example.org"
                    error={errors.websiteUrl}
                    {...register('websiteUrl')}
                  />
                </Field>

                <Field
                  label="Company Address"
                  htmlFor="address"
                  error={errors.address?.message}
                  className="sm:col-span-2"
                >
                  <Textarea
                    id="address"
                    rows={3}
                    placeholder="Street, area, city, state - PIN"
                    error={errors.address}
                    {...register('address')}
                  />
                </Field>

                <Field
                  label="Google Maps Embed"
                  htmlFor="mapEmbedUrl"
                  error={errors.mapEmbedUrl?.message}
                  hint="Paste the embed link, or the whole <iframe> from Google Maps → Share → Embed a map."
                  className="sm:col-span-2"
                >
                  <Textarea
                    id="mapEmbedUrl"
                    rows={2}
                    placeholder="https://www.google.com/maps/embed?pb=..."
                    error={errors.mapEmbedUrl}
                    {...register('mapEmbedUrl')}
                  />
                </Field>
              </div>
            </Card>

            {/* ---------- Branding ---------- */}
            <Card
              icon={FaImage}
              title="Branding"
              description="Shown in the header, footer, receipts and the browser tab."
            >
              <div className="space-y-6">
                <ImagePicker
                  label="Logo"
                  hint={`PNG with a transparent background works best. Max ${MAX_BRANDING_LABEL}.`}
                  currentUrl={organization.logo?.url || ''}
                  file={logo.file}
                  cleared={logo.cleared}
                  error={imageErrors.logo}
                  onPick={(file) => {
                    setLogo({ file, cleared: false });
                    setImageErrors((prev) => ({ ...prev, logo: undefined }));
                  }}
                  onClear={() => setLogo({ file: null, cleared: true })}
                />

                <ImagePicker
                  label="Favicon"
                  hint={`A square icon, ideally 32×32 or 64×64. Max ${MAX_BRANDING_LABEL}.`}
                  currentUrl={organization.favicon?.url || ''}
                  file={favicon.file}
                  cleared={favicon.cleared}
                  error={imageErrors.favicon}
                  onPick={(file) => {
                    setFavicon({ file, cleared: false });
                    setImageErrors((prev) => ({ ...prev, favicon: undefined }));
                  }}
                  onClear={() => setFavicon({ file: null, cleared: true })}
                />

                {/* No default image ships with the app — a bundled mark would
                    be one organization's branding shown to every other. */}
                <p className="text-xs leading-relaxed text-gray-500">
                  With no logo uploaded, the organization's initials
                  <span className="mx-1 inline-flex h-4 items-center rounded bg-blue-600 px-1 align-text-bottom text-[9px] font-bold uppercase tracking-tight text-white">
                    {initialsOf(organizationName) || '—'}
                  </span>
                  stand in for it. Leaving the favicon blank falls back to the
                  logo, so the browser tab matches the rest of the site.
                </p>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* ---------- SEO ---------- */}
            <Card
              icon={FaSearch}
              title="SEO Settings"
              description="Drives the page title and meta tags on the public website."
            >
              <div className="space-y-5">
                <Field
                  label="Meta Title"
                  htmlFor="metaTitle"
                  error={errors.seo?.metaTitle?.message}
                  hint={`${metaTitle.length}/70 characters. Falls back to the organization name.`}
                >
                  <Input
                    id="metaTitle"
                    type="text"
                    placeholder="Your Organization | What you do"
                    error={errors.seo?.metaTitle}
                    {...register('seo.metaTitle')}
                  />
                </Field>

                <Field
                  label="Meta Description"
                  htmlFor="metaDescription"
                  error={errors.seo?.metaDescription?.message}
                  hint={`${metaDescription.length}/320 characters. Falls back to the tagline.`}
                >
                  <Textarea
                    id="metaDescription"
                    rows={4}
                    placeholder="A short summary of your organization for search results."
                    error={errors.seo?.metaDescription}
                    {...register('seo.metaDescription')}
                  />
                </Field>

                <Field
                  label="Meta Keywords"
                  htmlFor="metaKeywords"
                  error={errors.seo?.metaKeywords?.message}
                  hint="Comma separated."
                >
                  <Input
                    id="metaKeywords"
                    type="text"
                    placeholder="charity, ngo, education, donation"
                    error={errors.seo?.metaKeywords}
                    {...register('seo.metaKeywords')}
                  />
                </Field>
              </div>
            </Card>

            {/* ---------- Social ---------- */}
            <Card
              icon={FaShareAlt}
              title="Social Media Links"
              description="Only the networks you fill in are shown in the footer."
            >
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                {SOCIAL_FIELDS.map(({ key, label, placeholder }) => (
                  <Field
                    key={key}
                    label={label}
                    htmlFor={`social-${key}`}
                    error={errors.social?.[key]?.message}
                  >
                    <Input
                      id={`social-${key}`}
                      type="url"
                      placeholder={placeholder}
                      error={errors.social?.[key]}
                      {...register(`social.${key}`)}
                    />
                  </Field>
                ))}
              </div>
            </Card>
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              size="lg"
              loading={isSubmitting}
              className="w-full sm:w-auto"
            >
              {isSubmitting ? 'Saving…' : 'Save Changes'}
            </Button>
          </div>
        </form>
      )}

      <MessageDialog
        open={Boolean(dialog)}
        type={dialog?.type}
        title={dialog?.title}
        message={dialog?.message}
        details={dialog?.details}
        onClose={() => setDialog(null)}
      />
    </PageShell>
  );
};

export default OrganizationSettings;
