import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import MessageDialog from '../components/MessageDialog';
import ImageGrid from '../components/ImageGrid';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaImages } from 'react-icons/fa';
import {
  Button,
  Card,
  Field,
  Input,
  PageHeader,
  PageShell,
} from '../components/ui';
import { UploadFormSkeleton } from '../components/ui/skeletons';
import api, {
  apiErrorMessage,
  isExplainedRequestError,
  uploadConfig,
} from '../lib/api';
import { galleryDefaults, gallerySchema } from '../lib/schemas';
import { screenImages, validateImage } from '../lib/validators';

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

const GalleryForm = ({ editData, onSuccess, onError }) => {
  // Images are files rather than form values, so they stay in their own state
  // alongside the schema-validated title.
  const [slots, setSlots] = useState([]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(gallerySchema),
    defaultValues: galleryDefaults,
    mode: 'onSubmit',
    reValidateMode: 'onChange',
  });

  useEffect(() => {
    if (!editData) return;
    reset({ title: editData.title || '' });
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

  const onSubmit = async ({ title }) => {
    if (slots.length === 0) {
      onError({
        type: 'warning',
        title: 'No images selected',
        message: 'Please upload at least one image for this gallery.',
      });
      return;
    }

    try {
      const data = new FormData();
      data.append('title', title);

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
        await api.put(`/gallery/${editData._id}`, data, config);
      } else {
        await api.post('/gallery', data, config);
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
        message: `The gallery could not be ${
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

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <Card
        icon={FaImages}
        title="Gallery Details"
        description="A title and the photos that belong to it. The first image is used as the cover."
      >
        <div className="space-y-6">
          <Field
            label="Title *"
            htmlFor="gallery-title"
            error={errors.title?.message}
            hint="Shown above this set of photos on the website."
          >
            <Input
              id="gallery-title"
              type="text"
              placeholder="e.g. Annual Health Camp 2025"
              error={errors.title}
              {...register('title')}
            />
          </Field>

          <Field label="Images *">
            <ImageGrid
              slots={slots}
              onAdd={handleAdd}
              onReplace={handleReplace}
              onRemove={handleRemove}
              label="Gallery image"
            />
          </Field>
        </div>

        <div className="mt-6 flex justify-end border-t border-gray-200 pt-6">
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
              ? 'Update Gallery'
              : 'Upload Gallery'}
          </Button>
        </div>
      </Card>
    </form>
  );
};

const UploadGallery = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [editData, setEditData] = useState(null);
  // { type, title, message, details, redirect } — null when no dialog is shown.
  const [dialog, setDialog] = useState(null);

  const id = new URLSearchParams(location.search).get('id');

  // Only an edit has something to fetch; a new gallery starts on a blank form.
  const [loading, setLoading] = useState(Boolean(id));

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api
      .get(`/gallery/${id}`)
      .then((res) => setEditData(res.data))
      .catch((err) => {
        console.error(err);
        setDialog({
          type: 'error',
          title: 'Could not load gallery',
          message: 'We were unable to fetch this gallery for editing.',
          details: apiErrorMessage(err, err.message),
          redirect: '/gallery',
        });
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleSuccess = () => {
    setDialog({
      type: 'success',
      title: editData ? 'Gallery updated' : 'Gallery uploaded',
      message: `The gallery was ${
        editData ? 'updated' : 'uploaded'
      } successfully.`,
      redirect: '/gallery',
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
        title={editData ? 'Edit Gallery' : 'Upload Gallery'}
        description={
          editData
            ? 'Rename this gallery, or add, replace and remove its photos.'
            : 'Give the set a title and upload the photos that belong to it.'
        }
        // The list screens offer the way in; the screen they open offers the
        // way back, rather than leaving the sidebar as the only exit.
        actions={
          <Button
            variant="secondary"
            icon={FaArrowLeft}
            onClick={() => navigate('/gallery')}
          >
            Back to Gallery
          </Button>
        }
      />

      {loading ? (
        <UploadFormSkeleton fields={1} tiles={6} />
      ) : (
        <GalleryForm
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

export default UploadGallery;
