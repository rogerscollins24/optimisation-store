import { Outlet, NavLink } from 'react-router-dom';
import { Home, Play, FileText } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export default function Layout() {
  return (
    <div className="flex flex-col h-screen bg-gray-50 max-w-md mx-auto shadow-2xl overflow-hidden relative">
      <div className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </div>

      <nav className="absolute bottom-0 w-full bg-white border-t border-gray-200 flex justify-around items-center h-16 px-2 z-50">
        <NavLink
          to="/"
          className={({ isActive }) =>
            cn('flex flex-col items-center justify-center w-16 text-xs gap-1', isActive ? 'text-blue-600' : 'text-gray-500')
          }
        >
          <Home size={24} />
          <span>Home</span>
        </NavLink>

        <NavLink
          to="/starting"
          className={({ isActive }) =>
            cn('flex flex-col items-center justify-center w-16 text-xs gap-1 relative -top-4', isActive ? 'text-blue-600' : 'text-gray-500')
          }
        >
          <div className="bg-blue-600 rounded-full p-3 shadow-lg text-white mb-1">
            <Play size={28} fill="currentColor" />
          </div>
          <span className="font-medium">Starting</span>
        </NavLink>

        <NavLink
          to="/records"
          className={({ isActive }) =>
            cn('flex flex-col items-center justify-center w-16 text-xs gap-1', isActive ? 'text-blue-600' : 'text-gray-500')
          }
        >
          <FileText size={24} />
          <span>Records</span>
        </NavLink>
      </nav>
    </div>
  );
}
