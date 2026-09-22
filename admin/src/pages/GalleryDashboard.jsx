import { useEffect, useMemo, useState } from 'react';
import ConfirmDialog from '../components/ConfirmDialog';
import MessageDialog from '../components/MessageDialog';
import api, { apiErrorMessage } from '../lib/api';
import { useNavigate } from 'react-router-dom';
import {
  FaEdit,
  FaTrash,
  FaPlus,
  FaImages,
  FaImage,
  FaSearch,
} from 'react-icons/fa';
import {
  Badge,
  Button,
  Card,
  CardRow,
  DataTable,
  EmptyState,
  IconButton,
  MobileCard,
  PageHeader,
  PageShell,
  Td,
  Tr,
} from '../components/ui';
import {
  FilterBar,
  FilterField,
  FilterInput,
  FilterSelect,
} from '../components/Filters';
import Pagination, { usePagination } from '../components/Pagination';
import { GalleryListSkeleton } from '../components/ui/skeletons';
import { cloudinaryUrl } from '../lib/cloudinary';

const COLUMNS = [
  { key: 'image', label: 'Cover', className: 'w-24' },
  { key: 'title', label: 'Title' },
  { key: 'count', label: 'Images' },
  { key: 'actions', label: 'Actions', className: 'w-32' },
];

const SORTERS = {
  newest: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  oldest: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
  nameAsc: (a, b) => (a.title || '').localeCompare(b.title || ''),
  nameDesc: (a, b) => (b.title || '').localeCompare(a.title || ''),
};

const EMPTY_FILTERS = { search: '', sort: 'newest' };

const imageCount = (gallery) => {
  const count = gallery.images?.length || 0;
  return `${count} ${count === 1 ? 'image' : 'images'}`;
};

// A list thumbnail is ~56px, so there is no reason to pull the full upload.
const Thumb = ({ src, alt, className = '' }) =>
  src ? (
    <img
      src={cloudinaryUrl(src, { width: 160 })}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={`object-cover ${className}`}
    />
  ) : (
    <div
      className={`flex items-center justify-center bg-gray-100 text-gray-400 ${className}`}
    >
      <FaImage />
    </div>
  );

/**
 * The gallery list.
 *
 * The whole collection is held in memory and searched, sorted and paged here —
 * the same arrangement as the projects screen, and for the same reason: a
 * charity's galleries are counted in tens, and only the inbox and the donation
 * records grow with traffic rather than with what an admin uploads.
 */
const GalleryDashboard = () => {
  const [galleries, setGalleries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [galleryToDelete, setGalleryToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [dialog, setDialog] = useState(null);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const navigate = useNavigate();

  const setFilter = (key, value) =>
    setFilters((current) => ({ ...current, [key]: value }));

  const filtersActive = Object.keys(EMPTY_FILTERS).some(
    (key) => filters[key] !== EMPTY_FILTERS[key]
  );

  const visibleGalleries = useMemo(() => {
    const term = filters.search.trim().toLowerCase();
    return galleries
      .filter((g) => !term || (g.title || '').toLowerCase().includes(term))
      .sort(SORTERS[filters.sort] || SORTERS.newest);
  }, [galleries, filters]);

  const { pageItems, paginationProps, setPage } = usePagination(visibleGalleries);

  // A narrowed list should always be read from the top.
  useEffect(() => setPage(1), [filters, setPage]);

  useEffect(() => {
    api
      .get('/gallery')
      .then((res) => setGalleries(res.data))
      .catch((err) => {
        console.error(err);
        setDialog({
          type: 'error',
          title: 'Could not load galleries',
          message: 'We were unable to fetch your galleries. Please try again.',
          details: apiErrorMessage(err, err.message),
        });
      })
      .finally(() => setLoading(false));
  }, []);

  const confirmDelete = async () => {
    if (!galleryToDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/gallery/${galleryToDelete._id}`);
      setGalleries((prev) => prev.filter((g) => g._id !== galleryToDelete._id));
      setGalleryToDelete(null);
    } catch (err) {
      console.error(err);
      setGalleryToDelete(null);
      setDialog({
        type: 'error',
        title: 'Could not delete gallery',
        message: 'The gallery was not deleted. Please try again.',
        details: apiErrorMessage(err, err.message),
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleEdit = (id) => navigate(`/gallery/upload?id=${id}`);

  const newGalleryButton = (
    <Button icon={FaPlus} onClick={() => navigate('/gallery/upload')}>
      New Gallery
    </Button>
  );

  const cardDescription = loading
    ? 'Loading…'
    : filtersActive
    ? `${visibleGalleries.length} of ${galleries.length} ${
        galleries.length === 1 ? 'gallery' : 'galleries'
      } match the filters.`
    : `${galleries.length} ${
        galleries.length === 1 ? 'gallery' : 'galleries'
      } published.`;

  return (
    <PageShell>
      <PageHeader
        title="Gallery"
        description="Photo sets shown on the public Gallery page. Each gallery holds one cover image and any number of photos."
        actions={newGalleryButton}
      />

      <Card icon={FaImages} title="All Galleries" description={cardDescription}>
        {!loading && galleries.length === 0 ? (
          <EmptyState
            icon={FaImages}
            title="No galleries yet"
            message="Upload a set of photos to have it appear on the website."
            action={newGalleryButton}
          />
        ) : (
          <>
            {/* The toolbar stays put while the rows load, so the screen does
                not rearrange itself under the admin as the request lands. */}
            <FilterBar
              onReset={() => setFilters(EMPTY_FILTERS)}
              canReset={filtersActive}
            >
              <FilterField label="Search Gallery" htmlFor="gallery-search">
                <FilterInput
                  id="gallery-search"
                  placeholder="Gallery title"
                  value={filters.search}
                  onChange={(e) => setFilter('search', e.target.value)}
                />
              </FilterField>
              <FilterField label="Sort By" htmlFor="gallery-sort">
                <FilterSelect
                  id="gallery-sort"
                  value={filters.sort}
                  onChange={(e) => setFilter('sort', e.target.value)}
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="nameAsc">Title (A–Z)</option>
                  <option value="nameDesc">Title (Z–A)</option>
                </FilterSelect>
              </FilterField>
            </FilterBar>

            {loading ? (
              <GalleryListSkeleton />
            ) : visibleGalleries.length === 0 ? (
              <EmptyState
                icon={FaSearch}
                title="No matching galleries"
                message="No gallery matches these filters. Try a different search."
                action={
                  <Button
                    variant="secondary"
                    onClick={() => setFilters(EMPTY_FILTERS)}
                  >
                    Clear filters
                  </Button>
                }
              />
            ) : (
              <>
                {/* Table for desktop / laptop */}
                <div className="hidden md:block">
                  <DataTable columns={COLUMNS}>
                    {pageItems.map((g) => (
                      <Tr key={g._id}>
                        <Td>
                          <Thumb
                            src={g.images?.[0]?.url}
                            alt={g.title}
                            className="h-14 w-14 rounded-lg"
                          />
                        </Td>
                        <Td className="font-medium text-gray-900">{g.title}</Td>
                        <Td>
                          <Badge tone="blue">{imageCount(g)}</Badge>
                        </Td>
                        <Td>
                          <div className="flex items-center gap-2">
                            <IconButton
                              icon={FaEdit}
                              label="Edit gallery"
                              onClick={() => handleEdit(g._id)}
                            />
                            <IconButton
                              icon={FaTrash}
                              label="Delete gallery"
                              variant="red"
                              onClick={() => setGalleryToDelete(g)}
                            />
                          </div>
                        </Td>
                      </Tr>
                    ))}
                  </DataTable>
                </div>

                {/* Card view for mobile */}
                <div className="grid gap-4 md:hidden">
                  {pageItems.map((g) => (
                    <MobileCard key={g._id}>
                      <Thumb
                        src={g.images?.[0]?.url}
                        alt={g.title}
                        className="h-44 w-full rounded-lg"
                      />
                      <h3 className="mt-3 text-base font-semibold text-gray-900">
                        {g.title}
                      </h3>
                      <div className="mt-2 space-y-1">
                        <CardRow label="Images">
                          <Badge tone="blue">{imageCount(g)}</Badge>
                        </CardRow>
                      </div>
                      <div className="mt-4 flex gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={FaEdit}
                          fullWidth
                          onClick={() => handleEdit(g._id)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          icon={FaTrash}
                          fullWidth
                          onClick={() => setGalleryToDelete(g)}
                        >
                          Delete
                        </Button>
                      </div>
                    </MobileCard>
                  ))}
                </div>

                <Pagination {...paginationProps} />
              </>
            )}
          </>
        )}
      </Card>

      <ConfirmDialog
        open={Boolean(galleryToDelete)}
        title="Delete this gallery?"
        message="The gallery and all of its images will be permanently removed. This action cannot be undone."
        itemName={galleryToDelete?.title}
        confirmText="Delete Gallery"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setGalleryToDelete(null)}
      />

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

export default GalleryDashboard;
