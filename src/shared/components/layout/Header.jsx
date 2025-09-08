import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiBell, FiMenu, FiPlus, FiSettings, FiX } from 'react-icons/fi';

// App imports
import { SearchBox } from '@shared/components';
import { ProfileInfo } from '@features';
import RoleSwitcher from './RoleSwitcher';
import { useRole } from '@context/RoleContext';

// shadcn/ui
import Button from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Badge from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

// Sticky, minimal, professional header (React JS / JSX)
export default function Header() {
  const { currentRole: _currentRole } = useRole();
  const [mobileOpen, setMobileOpen] = useState(false);
  // Global notification system will replace this

  // Prefer react-router to derive path for Breadcrumb
  const location = useLocation();
  const currentPath = useMemo(() => {
    const raw = (location?.pathname ?? window.location.pathname) || '/';
    return raw.split('/').filter(Boolean);
  }, [location]);

  // Close mobile menu on route change
  useEffect(() => setMobileOpen(false), [location]);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-gradient-to-r from-teal-700 via-cyan-700 to-sky-700/95 text-white backdrop-blur supports-[backdrop-filter]:bg-teal-800/75">
      {/* Top bar */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mx-auto flex max-w-l items-center gap-4 px-4 py-3 md:py-4"
      >
        {/* Left: Logo + Greeting */}
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <img
            src="https://i.ibb.co/rK44TsnC/logo.png"
            alt="Logo"
            className="h-9 w-9 rounded-xl bg-white/10 p-1 ring-1 ring-white/20"
          />
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold leading-6 md:text-lg">
              Welcome back, <span className="font-bold">User</span>!
            </h1>
            <p className="hidden text-sm/5 text-white/85 sm:block">
              Let’s take a detailed look at your financial situation today
            </p>
          </div>
        </div>

        {/* Right: Actions cluster */}
        <div className="hidden items-center gap-2 md:flex">
          <Button variant="secondary" size="icon" className="h-9 w-9 bg-white/10 text-white hover:bg-white/20">
            <FiPlus className="h-4 w-4" />
          </Button>
          <Button variant="secondary" size="icon" className="h-9 w-9 bg-white/10 text-white hover:bg-white/20">
            <FiSettings className="h-4 w-4" />
          </Button>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="secondary"
                size="icon"
                className="relative h-9 w-9 bg-white/10 text-white hover:bg-white/20"
                aria-label="Notifications"
              >
                <FiBell className="h-5 w-5" />
                {/* Global notification system will handle badge */}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80 p-0" align="end">
              <div className="flex items-center justify-between px-3 py-2">
                <DropdownMenuLabel className="p-0 text-sm font-semibold">Notifications</DropdownMenuLabel>
                <Button variant="ghost" size="sm" className="text-xs">
                  Mark all read
                </Button>
              </div>
              <DropdownMenuSeparator />
              <ScrollArea className="max-h-[22rem]">
                <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                  Global notification system will be implemented here
                </div>
              </ScrollArea>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Search, Role, Profile */}
          <div className="ml-2 flex items-center gap-2">
            <SearchBox />
            <RoleSwitcher />
            <ProfileInfo />
          </div>
        </div>

        {/* Mobile toggler */}
        <Button
          variant="secondary"
          size="icon"
          onClick={() => setMobileOpen((s) => !s)}
          className="ml-auto h-9 w-9 bg-white/10 text-white hover:bg-white/20 md:hidden"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <FiX className="h-5 w-5" /> : <FiMenu className="h-5 w-5" />}
        </Button>
      </motion.div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-white/10 md:hidden"
          >
            <div className="mx-auto max-w-7xl px-4 py-3">
              <div className="mb-3 text-sm text-white/90">
                <Breadcrumb path={currentPath} />
              </div>
              <div className="flex flex-col gap-3">
                <SearchBox />
                <div className="flex items-center gap-3">
                  <RoleSwitcher />
                  <Button variant="secondary" size="icon" className="h-9 w-9 bg-white/10 text-white hover:bg-white/20">
                    <FiPlus className="h-4 w-4" />
                  </Button>
                  <Button variant="secondary" size="icon" className="h-9 w-9 bg-white/10 text-white hover:bg-white/20">
                    <FiSettings className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm/6 text-white/90">Notifications</span>
                  <Button variant="ghost" size="sm" className="text-xs text-white/90">
                    Mark all read
                  </Button>
                </div>
                <div className="rounded-lg bg-white/5">
                  <ScrollArea className="max-h-60">
                    <div className="px-3 py-6 text-center text-sm text-white/80">
                      Global notification system will be implemented here
                    </div>
                  </ScrollArea>
                </div>
                <div className="pt-1">
                  <ProfileInfo />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
