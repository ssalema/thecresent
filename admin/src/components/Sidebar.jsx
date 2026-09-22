import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  FaHome,
  FaImages,
  FaInbox,
  FaDonate,
  FaBuilding,
  FaSignOutAlt,
  FaBars,
  FaTimes,
} from 'react-icons/fa';
import LogoMark from './LogoMark';
import { useOrganizationContext } from '../context/OrganizationContext';
import { BrandSkeleton } from './ui/skeletons';
import { FOCUS_RING_TIGHT, TRANSITION } from './ui/tokens';
import { endSession } from '../lib/api';

/*
 * The sidebar reads its classes from tokens.js rather than from the UI kit:
 * ui/index.jsx renders this component, so importing `Button` back from it would
 * close an import cycle. The class strings are the same ones `Button` and
 * `IconButton` are built from, so the controls here still match the panel.
 */

// Grouped so the destinations read as three short lists rather than one
// long undifferentiated column.
const MENU_GROUPS = [
  {
    label: 'Content',
    items: [
      { name: 'Project Dashboard', icon: FaHome, path: '/' },
      { name: 'Gallery Dashboard', icon: FaImages, path: '/gallery' },
    ],
  },
  {
    label: 'Engagement',
    items: [
      { name: 'Inbox', icon: FaInbox, path: '/inbox' },
      { name: 'Donation Record', icon: FaDonate, path: '/donations' },
    ],
  },
  {
    label: 'Configuration',
    items: [{ name: 'Organization Settings', icon: FaBuilding, path: '/settings' }],
  },
];

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false); // For mobile toggle
  const { organization, loading } = useOrganizationContext();
  const { organizationName } = organization;

  // Lock background scroll while the mobile drawer is open.
  useEffect(() => {
    if (!isOpen) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  // Close the drawer on Escape, the same key that closes every dialog.
  useEffect(() => {
    if (!isOpen) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);

  // The panel brands itself from the same record it edits.
  const brand = loading ? (
    <BrandSkeleton />
  ) : (
    <div className="flex min-w-0 items-center gap-3">
      <LogoMark className="h-9 w-9 flex-shrink-0" textClassName="text-xs" />
      <div className="min-w-0">
        <div className="truncate text-base font-bold leading-tight text-gray-900">
          {organizationName || 'Organization'}
        </div>
        <div className="text-xs text-gray-500">Admin Panel</div>
      </div>
    </div>
  );

  // Await the server call before navigating: clearing only the access token
  // would leave the refresh cookie alive, and the next visit would sign the
  // "logged out" admin straight back in.
  const handleLogout = async () => {
    await endSession();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile header — above the drawer, so the close button stays tappable. */}
      <div className="fixed left-0 right-0 top-0 z-[60] flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 shadow-sm md:hidden">
        {brand}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={isOpen}
          className={`inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg text-gray-600 ${TRANSITION} hover:bg-gray-100 hover:text-gray-900 active:scale-95 active:bg-gray-200 ${FOCUS_RING_TIGHT} focus-visible:ring-gray-400`}
        >
          {isOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
        </button>
      </div>

      {/* Sidebar */}
      <nav
        aria-label="Admin navigation"
        className={`fixed left-0 top-0 z-50 flex h-screen w-64 transform flex-col justify-between border-r border-gray-200 bg-white shadow-e3 transition-transform duration-300 ease-emphasized md:translate-x-0 md:shadow-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex-1 overflow-y-auto">
          <div className="hidden border-b border-gray-200 p-6 md:block">{brand}</div>

          <div className="space-y-6 px-3 py-4 pt-20 md:pt-4">
            {MENU_GROUPS.map((group) => (
              <div key={group.label}>
                <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  {group.label}
                </p>
                <ul className="space-y-1">
                  {group.items.map(({ name, icon: Icon, path }) => {
                    const active = location.pathname === path;
                    return (
                      <li key={name}>
                        <Link
                          to={path}
                          onClick={() => setIsOpen(false)} // close on mobile
                          aria-current={active ? 'page' : undefined}
                          className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm ${TRANSITION} ${FOCUS_RING_TIGHT} focus-visible:ring-blue-500 ${
                            active
                              ? 'bg-blue-50 font-semibold text-blue-700'
                              : 'font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                          }`}
                        >
                          <Icon
                            className={`flex-shrink-0 text-base ${
                              active ? 'text-blue-600' : 'text-gray-400'
                            }`}
                          />
                          <span className="truncate">{name}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* The `dangerSoft` button, spelled out rather than imported — see the
            note at the top of the file. */}
        <div className="border-t border-gray-200 p-3">
          <button
            type="button"
            onClick={handleLogout}
            className={`flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-sm font-semibold tracking-tight text-red-600 ${TRANSITION} hover:bg-red-100 active:scale-[0.98] active:bg-red-200 ${FOCUS_RING_TIGHT} focus-visible:ring-red-500`}
          >
            <FaSignOutAlt />
            Logout
          </button>
        </div>
      </nav>

      {/* Overlay for mobile — the same dimmed scrim, fading in the same way, as
          the one behind every dialog. */}
      {isOpen && (
        <div
          aria-hidden="true"
          className="animate-overlay-in fixed inset-0 z-40 bg-gray-900/60 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

export default Sidebar;
