import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../lib/api';
import { FaArrowLeft } from 'react-icons/fa';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import { Button, Notice, ProjectImage } from '../components/ui';
import {
  FOCUS_RING,
  HEADING_2,
  MEDIA_TILE,
  TRANSITION,
} from '../components/ui/tokens';
import { ProjectDetailsSkeleton } from '../components/ui/skeletons';
import { cloudinaryUrl } from '../lib/cloudinary';

const ProjectDetails = () => {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  // Every image on the page belongs to one lightbox sequence, so opening any of
  // them lets the visitor page through the whole project.
  const openAt = (idx) => {
    setIndex(idx);
    setOpen(true);
  };

  useEffect(() => {
    setLoading(true);
    setError('');

    api
      .get(`/projects/${id}`)
      .then((res) => setProject(res.data))
      .catch((err) => {
        console.error(err);
        setProject(null);
        // A malformed or unknown id comes back as a 404, which is a missing
        // project rather than a failure the visitor should retry.
        setError(
          err?.response?.status === 404
            ? 'We could not find that project.'
            : 'Failed to load this project. Please try again later.'
        );
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16">
        <ProjectDetailsSkeleton />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="mx-auto max-w-xl px-4 py-24 text-center">
          <Notice tone="error">{error || 'Project not found.'}</Notice>
          <div className="mt-6 flex justify-center">
            <Button to="/projects" icon={FaArrowLeft} variant="secondary">
              Back to Projects
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 pt-16">
      <div className="mx-auto max-w-7xl space-y-14 px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <Link
          to="/projects"
          className={`inline-flex min-h-[44px] items-center gap-2 rounded-lg text-sm font-medium text-gray-600 ${TRANSITION} hover:text-blue-600 ${FOCUS_RING} focus-visible:ring-blue-500`}
        >
          <FaArrowLeft aria-hidden="true" /> Back to Projects
        </Link>

        {/* --- Top Section --- */}
        <div className="flex flex-col items-center gap-8 md:flex-row md:gap-12">
          <div className="space-y-4 md:w-1/2">
            {project.category && (
              <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-blue-700">
                {project.category}
              </span>
            )}
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              {project.name}
            </h1>
            {project.description && (
              <p className="text-base leading-relaxed text-gray-700">
                {project.description}
              </p>
            )}
          </div>

          {project.images?.[0] && (
            <div className="md:w-1/2">
              <button
                type="button"
                onClick={() => openAt(0)}
                className={`${MEDIA_TILE} w-full`}
              >
                <ProjectImage
                  src={project.images[0].url}
                  alt={project.name}
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="h-72 w-full rounded-xl object-cover sm:h-80"
                />
                <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-base font-semibold text-white opacity-0 transition duration-300 group-hover:opacity-100 group-focus:opacity-100 sm:text-lg">
                  View Image
                </span>
              </button>
            </div>
          )}
        </div>

        {/* --- Scrollable Image Gallery --- */}
        {project.images?.length > 1 && (
          <div>
            <h2 className={`mb-4 ${HEADING_2} text-gray-900`}>Photos</h2>
            <div className="overflow-x-auto pb-3">
              <div className="flex min-w-max gap-4">
                {project.images.map((img, idx) => (
                  <button
                    type="button"
                    key={img.publicId || idx}
                    onClick={() => openAt(idx)}
                    className={`${MEDIA_TILE} h-56 w-72 flex-shrink-0 hover:scale-105`}
                  >
                    <ProjectImage
                      src={img.url}
                      alt={`${project.name} photo ${idx + 1}`}
                      sizes="288px"
                      className="h-56 w-72 rounded-xl object-cover"
                    />
                    <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-base font-semibold text-white opacity-0 transition duration-300 group-hover:opacity-100 group-focus:opacity-100">
                      View Image
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* --- Bottom Section (Image Left / Text Right) --- */}
        <div className="flex flex-col items-center gap-8 md:flex-row-reverse md:gap-12">
          <div className="space-y-4 md:w-1/2">
            <h2 className={`${HEADING_2} text-gray-900`}>
              Our Mission &amp; Impact
            </h2>
            <p className="text-base leading-relaxed text-gray-700">
              This project is dedicated to improving community healthcare access,
              focusing on patient well-being and consistent service delivery.
            </p>
            <Button to="/donate">Support This Work</Button>
          </div>

          {project.images?.[1] && (
            <div className="md:w-1/2">
              <button
                type="button"
                onClick={() => openAt(1)}
                className={`${MEDIA_TILE} w-full`}
              >
                <ProjectImage
                  src={project.images[1].url}
                  alt={`${project.name} mission`}
                  sizes="(min-width: 768px) 50vw, 100vw"
                  className="h-72 w-full rounded-xl object-cover sm:h-80"
                />
                <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-base font-semibold text-white opacity-0 transition duration-300 group-hover:opacity-100 group-focus:opacity-100 sm:text-lg">
                  View Image
                </span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox */}
      <Lightbox
        open={open}
        close={() => setOpen(false)}
        index={index}
        slides={(project.images || []).map((img) => ({
          src: cloudinaryUrl(img.url, { width: 1600 }),
          title: project.name,
        }))}
        animation={{ fade: 300 }}
      />
    </div>
  );
};

export default ProjectDetails;
