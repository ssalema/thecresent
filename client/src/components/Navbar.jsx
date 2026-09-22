import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LuHouse,
  LuInfo,
  LuFolder,
  LuPhone,
  LuHeart,
  LuMenu,
  LuX,
  LuBookImage,
} from "react-icons/lu";
import LogoMark from "./LogoMark";
import { useOrganizationContext } from "../context/OrganizationContext";
import Skeleton from "react-loading-skeleton";
import { FOCUS_RING, TRANSITION } from "./ui/tokens";

const MENU_ITEMS = [
  { name: "Home", to: "/", icon: LuHouse },
  { name: "About Us", to: "/about", icon: LuInfo },
  { name: "Projects", to: "/projects", icon: LuFolder },
  { name: "Gallery", to: "/gallery", icon: LuBookImage },
  { name: "Contact Us", to: "/contact", icon: LuPhone },
  { name: "Donate Us", to: "/donate", icon: LuHeart, donate: true },
];

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const { organization, loading } = useOrganizationContext();
  const { organizationName } = organization;

  // Prevent background scroll when the menu is open, restoring whatever the
  // page had before rather than forcing "auto".
  useEffect(() => {
    if (!open) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  // Escape closes the menu, matching every dialog on the site.
  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const menuVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.06 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: -10, scale: 0.9 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { type: "spring", stiffness: 500, damping: 20 },
    },
    exit: { opacity: 0, y: -10, scale: 0.9, transition: { duration: 0.2 } },
  };

  return (
    <nav className="fixed left-0 top-0 z-50 w-full border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          to="/"
          className={`flex min-w-0 items-center gap-2.5 rounded-lg ${FOCUS_RING} focus-visible:ring-blue-500`}
        >
          <motion.div
            className="flex-shrink-0"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <LogoMark className="h-10 w-10" textClassName="text-sm" />
          </motion.div>
          {/* The name comes from settings, so hold its place until they land. */}
          {loading ? (
            <Skeleton width={160} height={20} />
          ) : (
            <motion.span
              className={`truncate text-lg font-bold text-gray-900 ${TRANSITION} hover:text-blue-600 sm:text-xl`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {organizationName}
            </motion.span>
          )}
        </Link>

        {/* Desktop Menu */}
        <div className="hidden items-center gap-1 md:flex">
          {MENU_ITEMS.map(({ name, to, icon: Icon, donate }) => {
            const active = pathname === to;
            return (
              <Link
                key={name}
                to={to}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-[44px] items-center gap-2 rounded-lg px-3 text-sm font-medium lg:px-4 ${TRANSITION} ${FOCUS_RING} ${
                  donate
                    ? "ml-2 bg-blue-600 font-semibold text-white shadow-e1 hover:bg-blue-700 hover:shadow-e2 active:bg-blue-800 focus-visible:ring-blue-500"
                    : active
                    ? "bg-blue-50 font-semibold text-blue-700 focus-visible:ring-blue-500"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus-visible:ring-blue-500"
                }`}
              >
                <Icon size={18} />
                <span>{name}</span>
              </Link>
            );
          })}
        </div>

        {/* Mobile Menu Button */}
        <div className="relative z-50 md:hidden">
          <motion.button
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen(!open)}
            whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
            className={`flex h-11 w-11 items-center justify-center rounded-lg bg-blue-600 text-white shadow-e1 ${TRANSITION} hover:bg-blue-700 hover:shadow-e2 active:bg-blue-800 ${FOCUS_RING} focus-visible:ring-blue-500`}
          >
            {open ? <LuX size={22} /> : <LuMenu size={22} />}
          </motion.button>

          {/* Backdrop Overlay */}
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setOpen(false)}
                className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
              />
            )}
          </AnimatePresence>

          {/* Bubble Menu */}
          <AnimatePresence>
            {open && (
              <motion.div
                variants={menuVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="absolute right-0 top-full z-50 mt-3 flex flex-col items-end gap-3 p-1"
              >
                {MENU_ITEMS.map(({ name, to, icon: Icon, donate }) => {
                  const active = pathname === to;
                  return (
                    <motion.div key={name} variants={itemVariants}>
                      <Link
                        to={to}
                        onClick={() => setOpen(false)}
                        aria-current={active ? "page" : undefined}
                        className={`flex w-[172px] min-h-[44px] items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium shadow-e3 ${TRANSITION} ${FOCUS_RING} focus-visible:ring-blue-500 ${
                          donate
                            ? "bg-blue-600 font-semibold text-white hover:bg-blue-700"
                            : active
                            ? "bg-blue-50 font-semibold text-blue-700"
                            : "bg-white text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        <Icon size={18} />
                        <span>{name}</span>
                      </Link>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
