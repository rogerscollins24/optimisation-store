import { Outlet, NavLink } from 'react-router-dom';
import { FileText } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useLanguage } from '../context/LanguageContext';
import { BrandHomeIcon, ShipWheelIcon } from './BrandIcons';

export function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export default function Layout() {
  const { t } = useLanguage();

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
              cn('flex w-16 flex-col items-center justify-center gap-1 text-xs', isActive ? 'text-sky-600' : 'text-gray-500')
            }
          >
            <BrandHomeIcon size={24} />
            <span>{t('home')}</span>
          </NavLink>

          <NavLink
            to="/starting"
            className={({ isActive }) =>
              cn('relative -top-5 flex w-24 flex-col items-center justify-center gap-1 text-xs', isActive ? 'text-blue-600' : 'text-gray-500')
            }
          >
            <div className="mb-1 rounded-full bg-white p-2.5 shadow-[0_12px_24px_rgba(59,130,246,0.24)] ring-4 ring-sky-100">
              <ShipWheelIcon size={42} />
            </div>
            <span className="font-medium">{t('starting')}</span>
          </NavLink>

          <NavLink
            to="/records"
            className={({ isActive }) =>
              cn('flex w-16 flex-col items-center justify-center gap-1 text-xs', isActive ? 'text-blue-600' : 'text-gray-500')
            }
          >
            <FileText size={24} />
            <span>{t('records')}</span>
          </NavLink>
        </div>
      </nav>
    </div>
  );
}
