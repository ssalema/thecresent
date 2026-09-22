import { LuBuilding2 } from "react-icons/lu";
import Skeleton from "react-loading-skeleton";
import { useOrganizationContext, initialsOf } from "../context/OrganizationContext";
import { cloudinaryUrl } from "../lib/cloudinary";

/**
 * The organization's logo — or its initials when none has been uploaded.
 *
 * Two things this deliberately does not do. It never falls back to a bundled
 * image, because any bundled mark is one specific organization's branding and
 * would ship to every install that has not uploaded its own. And it never
 * paints before settings arrive: the box holds its place with a skeleton, so
 * the mark cannot swap under the visitor after first paint.
 *
 * `className` must carry both a width and a height — the skeleton and the
 * initials tile fill the box, and only the `<img>` has an intrinsic size.
 */
const LogoMark = ({ className = "", rounded = "rounded-lg", textClassName = "text-base" }) => {
  const { organization, loading } = useOrganizationContext();
  const { organizationName, logo } = organization;

  const label = organizationName ? `${organizationName} logo` : "Logo";
  const url = logo?.url || "";

  if (loading) {
    return (
      <Skeleton
        containerClassName={`flex ${className}`}
        className={`!h-full ${rounded}`}
      />
    );
  }

  if (url) {
    // The logo is painted small (a navbar/footer tile) but the uploaded file
    // can be any size, and it is on every page — serve a 200px re-encode.
    return (
      <img
        src={cloudinaryUrl(url, { width: 200 })}
        alt={label}
        className={`object-contain ${className}`}
      />
    );
  }

  const initials = initialsOf(organizationName);

  return (
    <span
      role="img"
      aria-label={label}
      title={organizationName || undefined}
      className={`flex items-center justify-center bg-blue-600 font-bold uppercase tracking-tight text-white ${rounded} ${className} ${textClassName}`}
    >
      {/* With no name either — a database that has never been filled in — a
          neutral glyph, so the tile is never a blank blue square. */}
      {initials || <LuBuilding2 className="h-1/2 w-1/2" strokeWidth={1.75} />}
    </span>
  );
};

export default LogoMark;
