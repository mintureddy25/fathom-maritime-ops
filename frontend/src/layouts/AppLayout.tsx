import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import {
  ChartBarSquareIcon, WrenchScrewdriverIcon, FireIcon,
  RectangleGroupIcon, UsersIcon, ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';
import { useAuthStore } from '../store/auth';

export default function AppLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';

  const handleLogout = () => {
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

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top brand bar */}
      <div className="bg-slate-950 border-b border-slate-900">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <img src="/anchor.svg" alt="" className="h-5 w-5" style={{ filter: 'brightness(0)' }} />
            </div>
            <div className="leading-tight">
              <div className="text-base font-semibold tracking-wide text-slate-50">Fathom Maritime Ops</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-[0.22em]">Compliance console</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block leading-tight">
              <div className="font-medium text-slate-100 text-sm">{user?.name}</div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
                {user?.role}{user?.rank ? ` · ${user.rank}` : ''}
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign out"
              className="px-3 py-2 rounded-md text-sm text-slate-300 hover:text-slate-100 hover:bg-slate-900 inline-flex items-center gap-1.5"
            >
              <ArrowRightOnRectangleIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 border-b border-slate-900">
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

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">
        <Outlet />
      </main>
      <footer className="text-center text-xs text-slate-600 py-6">
        Fathom Maritime Ops · safe & compliant fleet operations
      </footer>
    </div>
  );
}
