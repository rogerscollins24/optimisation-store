import { Outlet, NavLink } from 'react-router-dom';
import { Home, LifeBuoy, Play, FileText } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-gray-50 to-slate-100">
      <div className="flex-1 overflow-y-auto pb-24">
        <div className="mx-auto w-full max-w-7xl px-4 py-4 md:px-8 md:py-6">
          <Outlet />
        </div>
      </div>

      <nav className="fixed bottom-0 left-0 z-50 w-full border-t border-gray-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-around px-2">
          <NavLink
            to="/"
            className={({ isActive }) =>
              cn('flex w-16 flex-col items-center justify-center gap-1 text-xs', isActive ? 'text-blue-600' : 'text-gray-500')
            }
          >
            <Home size={24} />
            <span>Home</span>
          </NavLink>

          <NavLink
            to="/starting"
            className={({ isActive }) =>
              cn('relative -top-4 flex w-16 flex-col items-center justify-center gap-1 text-xs', isActive ? 'text-blue-600' : 'text-gray-500')
            }
          >
            <div className="mb-1 rounded-full bg-blue-600 p-3 text-white shadow-lg">
              <Play size={28} fill="currentColor" />
            </div>
            <span className="font-medium">Starting</span>
          </NavLink>

          <NavLink
            to="/records"
            className={({ isActive }) =>
              cn('flex w-16 flex-col items-center justify-center gap-1 text-xs', isActive ? 'text-blue-600' : 'text-gray-500')
            }
          >
            <FileText size={24} />
            <span>Records</span>
          </NavLink>

          <NavLink
            to="/support"
            className={({ isActive }) =>
              cn('flex w-16 flex-col items-center justify-center gap-1 text-xs', isActive ? 'text-blue-600' : 'text-gray-500')
            }
          >
            <LifeBuoy size={24} />
            <span>Support</span>
          </NavLink>
        </div>
      </nav>
    </div>
  );
}
