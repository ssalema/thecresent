import { useEffect, useMemo, useState } from 'react';
import ConfirmDialog from '../components/ConfirmDialog';
import MessageDialog from '../components/MessageDialog';
import api, { apiErrorMessage } from '../lib/api';
import { useNavigate } from 'react-router-dom';
import {
  FaEdit,
  FaTrash,
  FaPlus,
  FaFolderOpen,
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
import { ProjectListSkeleton } from '../components/ui/skeletons';
import { cloudinaryUrl } from '../lib/cloudinary';

const COLUMNS = [
  { key: 'image', label: 'Image', className: 'w-24' },
  { key: 'name', label: 'Name' },
  { key: 'category', label: 'Category' },
  { key: 'actions', label: 'Actions', className: 'w-32' },
];

// Category doubles as a status, so each gets its own tone.
const CATEGORY_TONES = {
  current: 'blue',
  upcoming: 'amber',
  completed: 'green',
};

const CATEGORIES = ['current', 'upcoming', 'completed'];

const SORTERS = {
  newest: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  oldest: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
  nameAsc: (a, b) => (a.name || '').localeCompare(b.name || ''),
  nameDesc: (a, b) => (b.name || '').localeCompare(a.name || ''),
};

const EMPTY_FILTERS = { search: '', category: '', sort: 'newest' };

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

const Dashboard = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [dialog, setDialog] = useState(null);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const navigate = useNavigate();

  const setFilter = (key, value) =>
    setFilters((current) => ({ ...current, [key]: value }));

  const filtersActive = Object.keys(EMPTY_FILTERS).some(
    (key) => filters[key] !== EMPTY_FILTERS[key]
  );

  const visibleProjects = useMemo(() => {
    const term = filters.search.trim().toLowerCase();
    return projects
      .filter((p) => {
        if (filters.category && p.category !== filters.category) return false;
        if (!term) return true;
        return `${p.name || ''} ${p.description || ''}`
          .toLowerCase()
          .includes(term);
      })
      .sort(SORTERS[filters.sort] || SORTERS.newest);
  }, [projects, filters]);

  const { pageItems, paginationProps, setPage } = usePagination(visibleProjects);

  // A narrowed list should always be read from the top.
  useEffect(() => setPage(1), [filters, setPage]);

  useEffect(() => {
    api
      .get('/projects')
      .then((res) => setProjects(res.data))
      .catch((err) => {
        console.error(err);
        setDialog({
          type: 'error',
          title: 'Could not load projects',
          message: 'We were unable to fetch your projects. Please try again.',
          details: apiErrorMessage(err, err.message),
        });
      })
      .finally(() => setLoading(false));
  }, []);

  const confirmDelete = async () => {
    if (!projectToDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/projects/${projectToDelete._id}`);
      setProjects((prev) => prev.filter((p) => p._id !== projectToDelete._id));
      setProjectToDelete(null);
    } catch (err) {
      console.error(err);
      setProjectToDelete(null);
      setDialog({
        type: 'error',
        title: 'Could not delete project',
        message: 'The project was not deleted. Please try again.',
        details: apiErrorMessage(err, err.message),
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleEdit = (id) => navigate(`/upload?id=${id}`);

  const newProjectButton = (
    <Button icon={FaPlus} onClick={() => navigate('/upload')}>
      New Project
    </Button>
  );

  return (
    <PageShell>
      <PageHeader
        title="Projects"
        description="Everything listed on the public Projects page. Add, edit or remove a project here and the website updates immediately."
        actions={newProjectButton}
      />

      <Card
        icon={FaFolderOpen}
        title="All Projects"
        description={
          loading
            ? 'Loading…'
            : filtersActive
            ? `${visibleProjects.length} of ${projects.length} ${
                projects.length === 1 ? 'project' : 'projects'
              } match the filters.`
            : `${projects.length} ${projects.length === 1 ? 'project' : 'projects'} published.`
        }
      >
        {!loading && projects.length === 0 ? (
          <EmptyState
            icon={FaFolderOpen}
            title="No projects yet"
            message="Upload your first project to have it appear on the website."
            action={newProjectButton}
          />
        ) : (
          <>
            {/* The toolbar stays put while the rows load, so the screen does
                not rearrange itself under the admin as the request lands. */}
            <FilterBar
              onReset={() => setFilters(EMPTY_FILTERS)}
              canReset={filtersActive}
            >
              <FilterField label="Search Project" htmlFor="project-search">
                <FilterInput
                  id="project-search"
                  placeholder="Project name"
                  value={filters.search}
                  onChange={(e) => setFilter('search', e.target.value)}
                />
              </FilterField>
              <FilterField label="Category" htmlFor="project-category">
                <FilterSelect
                  id="project-category"
                  value={filters.category}
                  onChange={(e) => setFilter('category', e.target.value)}
                >
                  <option value="">All Categories</option>
                  {CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </option>
                  ))}
                </FilterSelect>
              </FilterField>
              <FilterField label="Sort By" htmlFor="project-sort">
                <FilterSelect
                  id="project-sort"
                  value={filters.sort}
                  onChange={(e) => setFilter('sort', e.target.value)}
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="nameAsc">Name (A–Z)</option>
                  <option value="nameDesc">Name (Z–A)</option>
                </FilterSelect>
              </FilterField>
            </FilterBar>

            {loading ? (
              <ProjectListSkeleton />
            ) : visibleProjects.length === 0 ? (
              <EmptyState
                icon={FaSearch}
                title="No matching projects"
                message="No project matches these filters. Try a different search or category."
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
                    {pageItems.map((p) => (
                      <Tr key={p._id}>
                        <Td>
                          <Thumb
                            src={p.images?.[0]?.url}
                            alt={p.name}
                            className="h-14 w-14 rounded-lg"
                          />
                        </Td>
                        <Td className="font-medium text-gray-900">{p.name}</Td>
                        <Td>
                          <Badge tone={CATEGORY_TONES[p.category] || 'gray'}>
                            {p.category}
                          </Badge>
                        </Td>
                        <Td>
                          <div className="flex items-center gap-2">
                            <IconButton
                              icon={FaEdit}
                              label="Edit project"
                              onClick={() => handleEdit(p._id)}
                            />
                            <IconButton
                              icon={FaTrash}
                              label="Delete project"
                              variant="red"
                              onClick={() => setProjectToDelete(p)}
                            />
                          </div>
                        </Td>
                      </Tr>
                    ))}
                  </DataTable>
                </div>

                {/* Card view for mobile */}
                <div className="grid gap-4 md:hidden">
                  {pageItems.map((p) => (
                    <MobileCard key={p._id}>
                      <Thumb
                        src={p.images?.[0]?.url}
                        alt={p.name}
                        className="h-44 w-full rounded-lg"
                      />
                      <h3 className="mt-3 text-base font-semibold text-gray-900">
                        {p.name}
                      </h3>
                      <div className="mt-2 space-y-1">
                        <CardRow label="Category">
                          <Badge tone={CATEGORY_TONES[p.category] || 'gray'}>
                            {p.category}
                          </Badge>
                        </CardRow>
                      </div>
                      <div className="mt-4 flex gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={FaEdit}
                          fullWidth
                          onClick={() => handleEdit(p._id)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          icon={FaTrash}
                          fullWidth
                          onClick={() => setProjectToDelete(p)}
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
        open={Boolean(projectToDelete)}
        title="Delete this project?"
        message="The project and its images will be permanently removed. This action cannot be undone."
        itemName={projectToDelete?.name}
        confirmText="Delete Project"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setProjectToDelete(null)}
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

export default Dashboard;
