import { useRef } from 'react';
import { FaTrash, FaUpload } from 'react-icons/fa';
import { IconButton } from './ui';
import { DROPZONE, FOCUS_RING_TIGHT, TRANSITION } from './ui/tokens';
import { cloudinaryUrl } from '../lib/cloudinary';
import { IMAGE_ACCEPT, MAX_IMAGE_LABEL } from '../lib/validators';

/**
 * Numbered tile grid used by both upload screens.
 *
 * Slots are owned by the parent; this component only reports intent:
 *   onAdd(files)            — one or more files picked from the upload box
 *   onReplace(index, file)  — a tile was clicked and a new file chosen
 *   onRemove(index)         — a tile's delete button was pressed
 *
 * The hidden "replace" input and the index it belongs to are kept here, so a
 * caller never has to thread a ref through its own render.
 */
const ImageGrid = ({ slots, onAdd, onReplace, onRemove, label = 'Image' }) => {
  const replaceIndex = useRef(null);
  const replaceInputRef = useRef(null);

  const openReplace = (index) => {
    replaceIndex.current = index;
    replaceInputRef.current?.click();
  };

  const handleReplacePicked = (e) => {
    const file = e.target.files?.[0];
    const index = replaceIndex.current;
    e.target.value = ''; // allow re-picking the same file
    if (!file || index === null) return;
    onReplace(index, file);
    replaceIndex.current = null;
  };

  const handleAdd = (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (files.length) onAdd(files);
  };

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {/* Upload box */}
      <label className={`${DROPZONE} aspect-square flex-col`}>
        <FaUpload className="text-2xl" />
        <span className="mt-3 px-2 text-center text-sm font-medium">
          Click to upload
        </span>
        <span className="mt-1 px-2 text-center text-xs text-gray-400">
          JPG, PNG or WebP · up to {MAX_IMAGE_LABEL} each
        </span>
        <input
          type="file"
          accept={IMAGE_ACCEPT}
          multiple
          onChange={handleAdd}
          className="hidden"
        />
      </label>

      {/* Selected / existing images */}
      {slots.map((slot, index) => (
        <div
          key={slot.key}
          className={`group relative aspect-square rounded-xl border border-gray-200 bg-white p-2 shadow-e1 ${TRANSITION} hover:border-gray-300 hover:shadow-e2`}
        >
          <span className="absolute left-2 top-2 z-10 flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-gray-900/70 px-1.5 text-xs font-semibold text-white">
            {index + 1}
          </span>

          <button
            type="button"
            onClick={() => openReplace(index)}
            title="Click to replace this image"
            className={`flex h-full w-full items-center justify-center overflow-hidden rounded-lg ${FOCUS_RING_TIGHT} focus-visible:ring-blue-500`}
          >
            {/* Existing images come from Cloudinary and are shown in a small
                square tile; a not-yet-uploaded slot is a local blob: preview,
                which cloudinaryUrl passes through untouched. */}
            <img
              src={
                slot.kind === 'existing'
                  ? cloudinaryUrl(slot.url, { width: 400 })
                  : slot.preview
              }
              alt={`${label} ${index + 1}`}
              loading="lazy"
              decoding="async"
              className="max-h-full max-w-full object-contain"
            />
            <span className={`pointer-events-none absolute inset-0 flex items-center justify-center rounded-lg bg-black/50 text-sm font-semibold text-white opacity-0 ${TRANSITION} group-hover:opacity-100`}>
              Replace
            </span>
          </button>

          {/* `sm` keeps the button inside the tile — the default size grows to a
              full 44px touch target, which would crowd a thumbnail. */}
          <IconButton
            icon={FaTrash}
            label="Remove this image"
            variant="red"
            size="sm"
            onClick={() => onRemove(index)}
            className="absolute bottom-2 right-2 z-10 bg-white/90 shadow-e1"
          />
        </div>
      ))}

      {/* Placeholder for the next image */}
      <div className="relative flex aspect-square items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/60">
        <span className="absolute left-2 top-2 flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-gray-200 px-1.5 text-xs font-semibold text-gray-500">
          {slots.length + 1}
        </span>
        <span className="text-xs text-gray-400">Next</span>
      </div>

      {/* Shared input used by every slot's "replace" action */}
      <input
        ref={replaceInputRef}
        type="file"
        accept={IMAGE_ACCEPT}
        onChange={handleReplacePicked}
        className="hidden"
      />
    </div>
  );
};

export default ImageGrid;
