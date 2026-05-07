import { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import clsx from 'clsx';
import {
  ChartBarSquareIcon, WrenchScrewdriverIcon, FireIcon,
  RectangleGroupIcon, UsersIcon, ArrowRightOnRectangleIcon,
  Bars3Icon, XMarkIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '../store/auth';

export default function AppLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = user?.role === 'admin';
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    setMobileOpen(false);
    logout();
    navigate('/login');
  };

  const nav = [
    { to: '/', label: 'Dashboard', icon: <ChartBarSquareIcon className="h-4 w-4" />, end: true },
    { to: '/maintenance', label: 'Maintenance', icon: <WrenchScrewdriverIcon className="h-4 w-4" /> },
    { to: '/drills', label: 'Drills', icon: <FireIcon className="h-4 w-4" /> },
    ...(isAdmin ? [
      { to: '/ships', label: 'Ships', icon: <RectangleGroupIcon className="h-4 w-4" /> },
      { to: '/crew', label: 'Crew', icon: <UsersIcon className="h-4 w-4" /> },
    ] : []),
  ];

  // Close mobile menu on route change
  const closeMobile = () => setMobileOpen(false);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top brand bar */}
      <div className="bg-slate-950 border-b border-slate-900">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <img src="/anchor.svg" alt="" className="h-5 w-5" style={{ filter: 'brightness(0)' }} />
            </div>
            <div>
              <div className="text-base font-semibold tracking-wide text-slate-50 leading-none">Fathom Maritime Ops</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-[0.22em] leading-none mt-3">Compliance console</div>
            </div>
          </div>

          {/* Desktop user info + sign-out */}
          <div className="hidden md:flex items-center gap-3">
            <div className="text-right">
              <div className="font-medium text-slate-100 text-sm leading-none">{user?.name}</div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500 leading-none mt-3">
                {user?.role}{user?.rank ? ` · ${user.rank}` : ''}
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign out"
              className="px-3 py-2 rounded-md text-sm text-slate-300 hover:text-slate-100 hover:bg-slate-900 inline-flex items-center gap-1.5"
            >
              <ArrowRightOnRectangleIcon className="h-4 w-4" />
              <span>Sign out</span>
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(o => !o)}
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
            className="md:hidden p-2 rounded-md text-slate-300 hover:text-slate-100 hover:bg-slate-900"
          >
            {mobileOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Desktop tab bar */}
      <div className="hidden md:block bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 border-b border-slate-900">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex items-center gap-1 overflow-x-auto overflow-y-hidden">
            {nav.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.end}
                className={({ isActive }) => clsx(
                  'relative flex items-center gap-2 px-4 py-4 text-sm font-medium whitespace-nowrap transition-colors',
                  isActive
                    ? 'text-emerald-300'
                    : 'text-slate-400 hover:text-slate-100',
                )}
              >
                {({ isActive }) => (
                  <>
                    {n.icon}
                    {n.label}
                    <span
                      className={clsx(
                        'absolute left-3 right-3 -bottom-px h-[3px] rounded-t bg-emerald-400 transition-all',
                        isActive ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-50',
                      )}
                    />
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={closeMobile} />
          <div className="relative ml-auto h-full w-72 max-w-[85%] bg-slate-950 border-l border-slate-900 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-900">
              <div className="leading-tight">
                <div className="text-sm font-medium text-slate-100">{user?.name}</div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
                  {user?.role}{user?.rank ? ` · ${user.rank}` : ''}
                </div>
              </div>
              <button
                onClick={closeMobile}
                aria-label="Close menu"
                className="p-2 rounded-md text-slate-400 hover:text-slate-100 hover:bg-slate-900"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-2 py-3">
              {nav.map((n) => {
                const isActive = n.end
                  ? location.pathname === n.to
                  : location.pathname === n.to || location.pathname.startsWith(n.to + '/');
                return (
                  <NavLink
                    key={n.to}
                    to={n.to}
                    end={n.end}
                    onClick={closeMobile}
                    className={clsx(
                      'flex items-center gap-3 px-3 py-3 rounded-md text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-emerald-500/10 text-emerald-300'
                        : 'text-slate-300 hover:text-slate-100 hover:bg-slate-900',
                    )}
                  >
                    {n.icon}
                    {n.label}
                  </NavLink>
                );
              })}
            </nav>

            <div className="border-t border-slate-900 p-3">
              <button
                onClick={handleLogout}
                className="w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium bg-slate-900 hover:bg-slate-800 text-slate-100"
              >
                <ArrowRightOnRectangleIcon className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">
        <Outlet />
      </main>
      <footer className="text-center text-xs text-slate-600 py-6">
        Fathom Maritime Ops · safe & compliant fleet operations
      </footer>
    </div>
  );
}
