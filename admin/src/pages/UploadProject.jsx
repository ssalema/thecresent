import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import MessageDialog from '../components/MessageDialog';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  FaCheck,
  FaImages,
  FaInfoCircle,
  FaArrowLeft,
  FaArrowRight,
} from 'react-icons/fa';
import ImageGrid from '../components/ImageGrid';
import {
  Button,
  Card,
  Field,
  Input,
  PageHeader,
  PageShell,
  Select,
  Textarea,
} from '../components/ui';
import { TRANSITION } from '../components/ui/tokens';
import { UploadFormSkeleton } from '../components/ui/skeletons';
import api, {
  apiErrorMessage,
  isExplainedRequestError,
  uploadConfig,
} from '../lib/api';
import { screenImages, validateImage } from '../lib/validators';
import {
  PROJECT_CATEGORIES,
  projectDefaults,
  projectSchema,
} from '../lib/schemas';

let nextKey = 1;

// Each slot is one numbered tile in the grid.
//   kind 'existing' → already on Cloudinary: { url, publicId }
//   kind 'new'      → a File the admin just picked: { file, preview }
// Replacing an image swaps an 'existing' slot for a 'new' one in place, which is
// exactly what the server needs to delete the old asset and upload the new one.
const existingSlot = (image) => ({
  key: `slot-${nextKey++}`,
  kind: 'existing',
  url: image.url,
  publicId: image.publicId,
});

const newSlot = (file) => ({
  key: `slot-${nextKey++}`,
  kind: 'new',
  file,
  preview: URL.createObjectURL(file),
});

const STEPS = ['Project Details', 'Upload Images'];

const Stepper = ({ step }) => (
  <ol className="mb-8 flex items-center justify-center">
    {STEPS.map((label, index) => {
      const number = index + 1;
      const active = step === number;
      const done = step > number;
      return (
        <li key={label} className="flex items-center">
          <div className="flex flex-col items-center text-center">
            <span
              className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold ${TRANSITION} ${
                done
                  ? 'bg-blue-600 text-white'
                  : active
                  ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                  : 'bg-gray-100 text-gray-400'
              }`}
            >
              {done ? <FaCheck /> : number}
            </span>
            <span
              className={`mt-2 text-xs sm:text-sm ${
                active || done ? 'font-semibold text-blue-600' : 'text-gray-500'
              }`}
            >
              {label}
            </span>
          </div>

          {/* Connector to the next step */}
          {number < STEPS.length && (
            <span
              className={`mx-3 mb-6 h-0.5 w-12 rounded sm:w-24 ${
                done ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            />
          )}
        </li>
      );
    })}
  </ol>
);

// Defined at module scope: keeping it inside UploadProject would remount the
// form (and wipe every field) each time the page re-renders.
const ProjectForm = ({ editData, onSuccess, onError }) => {
  const [step, setStep] = useState(1);
  // Images are files rather than form values, so they stay in their own state
  // alongside the schema-validated details.
  const [slots, setSlots] = useState([]);

  const {
    register,
    handleSubmit,
    reset,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(projectSchema),
    defaultValues: projectDefaults,
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  });

  useEffect(() => {
    if (!editData) return;
    reset({
      name: editData.name || '',
      category: editData.category || 'current',
      description: editData.description || '',
    });
    setSlots((editData.images || []).map(existingSlot));
  }, [editData, reset]);

  // Object URLs are created per slot and must be revoked when the page goes
  // away, otherwise every re-pick leaks a blob.
  const slotsRef = useRef(slots);
  slotsRef.current = slots;
  useEffect(
    () => () =>
      slotsRef.current.forEach((s) => s.preview && URL.revokeObjectURL(s.preview)),
    []
  );

  // Oversized or non-image files are rejected here rather than after a long
  // upload — whatever passes is what the server would have accepted anyway.
  const handleAdd = (files) => {
    const pending = slotsRef.current.filter((s) => s.kind === 'new').length;
    const { accepted, problems } = screenImages(files, pending);

    if (problems.length) {
      onError({
        type: 'warning',
        title: accepted.length ? 'Some images were not added' : 'Image not added',
        message: `${problems.length} of ${files.length} selected ${
          files.length === 1 ? 'image was' : 'images were'
        } skipped.`,
        details: problems.join(' · '),
      });
    }
    if (accepted.length) setSlots((prev) => [...prev, ...accepted.map(newSlot)]);
  };

  const handleRemove = (index) => {
    setSlots((prev) => {
      const removed = prev[index];
      if (removed?.preview) URL.revokeObjectURL(removed.preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleReplace = (index, file) => {
    const problem = validateImage(file, file.name);
    if (problem) {
      onError({
        type: 'warning',
        title: 'Image not replaced',
        message: `Image ${index + 1} was left as it was.`,
        details: problem,
      });
      return;
    }
    setSlots((prev) =>
      prev.map((slot, i) => {
        if (i !== index) return slot;
        if (slot.preview) URL.revokeObjectURL(slot.preview);
        return newSlot(file);
      })
    );
  };

  // Step 1's inputs are unmounted on step 2, so the browser's own `required`
  // check never runs on submit — validate the details before moving on instead.
  const handleNext = async () => {
    if (await trigger()) {
      setStep(2);
      return;
    }
    onError({
      type: 'warning',
      title: 'Missing details',
      message:
        'Please fill in the project name and description before continuing.',
    });
  };

  const onSubmit = async (form) => {
    if (slots.length === 0) {
      onError({
        type: 'warning',
        title: 'No images selected',
        message: 'Please upload at least one image for this project.',
      });
      return;
    }

    try {
      const data = new FormData();
      data.append('name', form.name);
      data.append('category', form.category);
      data.append('description', form.description);

      // Files go in the order they appear in `slots`, so fileIndex lines up
      // with the server's req.files array.
      let fileIndex = 0;
      const plan = slots.map((slot) => {
        if (slot.kind === 'existing') {
          return { type: 'existing', publicId: slot.publicId, url: slot.url };
        }
        data.append('images', slot.file);
        return { type: 'new', fileIndex: fileIndex++ };
      });

      const config = uploadConfig;

      if (editData) {
        data.append('slots', JSON.stringify(plan));
        await api.put(`/projects/${editData._id}`, data, config);
      } else {
        await api.post('/projects', data, config);
      }
      onSuccess();
    } catch (err) {
      console.error(err);
      // When the server explained the refusal, that explanation is the message;
      // "check your connection" is only right when nothing came back at all.
      const explained = isExplainedRequestError(err);
      onError({
        type: 'error',
        title: editData ? 'Update failed' : 'Upload failed',
        message: `The project could not be ${
          editData ? 'updated' : 'uploaded'
        }. ${
          explained
            ? apiErrorMessage(err)
            : 'Please check your connection and try again.'
        }`,
        details: explained ? null : apiErrorMessage(err, err.message),
      });
    }
  };

  // Reached when the schema rejects the details while step 2 is showing: send
  // the admin back to the fields that need fixing.
  const onInvalid = () => {
    setStep(1);
    onError({
      type: 'warning',
      title: 'Missing details',
      message: 'Please fill in the project name and description before saving.',
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit, onInvalid)} noValidate className="space-y-6">
      <Stepper step={step} />

      {/* Step 1 */}
      {step === 1 && (
        <Card
          icon={FaInfoCircle}
          title="Project Details"
          description="How this project is named and grouped on the website."
        >
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field
              label="Project Name *"
              htmlFor="project-name"
              error={errors.name?.message}
            >
              <Input
                id="project-name"
                type="text"
                placeholder="e.g. Winter Blanket Drive"
                error={errors.name}
                {...register('name')}
              />
            </Field>

            <Field
              label="Category *"
              htmlFor="project-category"
              error={errors.category?.message}
              hint="Decides which tab the project appears under."
            >
              <Select
                id="project-category"
                error={errors.category}
                {...register('category')}
              >
                {PROJECT_CATEGORIES.map(({ value, label }) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </Field>

            <Field
              label="Description *"
              htmlFor="project-description"
              error={errors.description?.message}
              hint="Shown on the project's details page."
              className="sm:col-span-2"
            >
              <Textarea
                id="project-description"
                rows={4}
                placeholder="Describe what this project does, who it helps, and how it is run…"
                error={errors.description}
                {...register('description')}
              />
            </Field>
          </div>

          <div className="mt-6 flex justify-end border-t border-gray-200 pt-6">
            <Button
              type="button"
              onClick={handleNext}
              className="w-full sm:w-auto"
            >
              Next
              <FaArrowRight />
            </Button>
          </div>
        </Card>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <Card
          icon={FaImages}
          title="Upload Images"
          description="The first image is used as the project's cover. Click a tile to replace it."
        >
          <ImageGrid
            slots={slots}
            onAdd={handleAdd}
            onReplace={handleReplace}
            onRemove={handleRemove}
            label="Project image"
          />

          <div className="mt-6 flex flex-col gap-3 border-t border-gray-200 pt-6 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              icon={FaArrowLeft}
              onClick={() => setStep(1)}
              className="w-full sm:w-auto"
            >
              Back
            </Button>
            <Button
              type="submit"
              loading={isSubmitting}
              className="w-full sm:w-auto"
            >
              {isSubmitting
                ? editData
                  ? 'Updating…'
                  : 'Uploading…'
                : editData
                ? 'Update Project'
                : 'Upload Project'}
            </Button>
          </div>
        </Card>
      )}
    </form>
  );
};

const UploadProject = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [editData, setEditData] = useState(null);
  // { type, title, message, details, redirect } — null when no dialog is shown.
  const [dialog, setDialog] = useState(null);

  const searchParams = new URLSearchParams(location.search);
  const id = searchParams.get('id');

  // Only an edit has something to fetch; a new project starts on a blank form.
  const [loading, setLoading] = useState(Boolean(id));

  useEffect(() => {
    if (id) {
      setLoading(true);
      api
        .get(`/projects/${id}`)
        .then((res) => setEditData(res.data))
        .catch((err) => {
          console.error(err);
          setDialog({
            type: 'error',
            title: 'Could not load project',
            message: 'We were unable to fetch this project for editing.',
            details: apiErrorMessage(err, err.message),
            redirect: '/',
          });
        })
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handleSuccess = () => {
    setDialog({
      type: 'success',
      title: editData ? 'Project updated' : 'Project uploaded',
      message: `The project was ${
        editData ? 'updated' : 'uploaded'
      } successfully.`,
      redirect: '/',
    });
  };

  const handleClose = () => {
    const redirect = dialog?.redirect;
    setDialog(null);
    if (redirect) navigate(redirect);
  };

  return (
    <PageShell maxWidth="max-w-4xl">
      <PageHeader
        title={editData ? 'Edit Project' : 'Upload Project'}
        description={
          editData
            ? 'Update the details or swap out the images for this project.'
            : 'Add a project in two steps: its details first, then its images.'
        }
        // The list screens offer the way in; the screen they open offers the
        // way back, rather than leaving the sidebar as the only exit.
        actions={
          <Button
            variant="secondary"
            icon={FaArrowLeft}
            onClick={() => navigate('/')}
          >
            Back to Projects
          </Button>
        }
      />

      {loading ? (
        <UploadFormSkeleton fields={3} stepper actions={2} />
      ) : (
        <ProjectForm
          editData={editData}
          onSuccess={handleSuccess}
          onError={setDialog}
        />
      )}

      <MessageDialog
        open={Boolean(dialog)}
        type={dialog?.type}
        title={dialog?.title}
        message={dialog?.message}
        details={dialog?.details}
        onClose={handleClose}
      />
    </PageShell>
  );
};

export default UploadProject;
