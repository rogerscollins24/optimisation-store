import { Outlet, NavLink } from 'react-router-dom';
import { FileText } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useTranslation } from 'react-i18next';
import { BrandHomeIcon, ShipWheelIcon } from './BrandIcons';
import { useAuth } from '../context/AuthContext';
import LanguageSwitcher from './LanguageSwitcher';

export function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export default function Layout() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const isActivated = user?.status === 'Active';

  return (
    <div className="flex min-h-screen flex-col" style={{ backgroundColor: '#ece7dd' }}>
      <div className="flex-1 overflow-y-auto pb-24">
        <div className="mx-auto w-full max-w-7xl">
          {!isActivated && (
            <div className="mx-4 mt-3 rounded-2xl border border-amber-300/60 bg-amber-50/90 px-4 py-3 text-sm font-semibold text-amber-800 shadow-sm">
              ⚠ Account not activated — contact support to get started
            </div>
          )}
          <Outlet />
        </div>
      </div>

      <LanguageSwitcher />

      <nav className="fixed bottom-0 left-0 z-50 w-full" style={{ background: 'linear-gradient(to top, #1e1c18 0%, #28251f 100%)', boxShadow: '0 -1px 0 rgba(255,255,255,0.06), 0 -8px 32px rgba(0,0,0,0.28)' }}>
        <div className="mx-auto flex h-17 w-full max-w-7xl items-center justify-around px-2">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              cn('flex w-16 flex-col items-center justify-center gap-1 transition-all duration-200',
                isActive ? 'text-amber-400' : 'text-stone-500 hover:text-stone-300')
            }
          >
            {({ isActive }) => (
              <>
                <BrandHomeIcon size={22} />
                <span className="text-[10px] font-semibold tracking-wider uppercase font-display">{t('home')}</span>
                {isActive && <span className="absolute bottom-0 h-0.75 w-10 rounded-full bg-amber-400 opacity-80" />}
            className={({ isActive }) =>
              cn('relative -top-6 flex w-20 flex-col items-center justify-center gap-1 transition-all duration-200',
                isActive ? 'text-amber-400' : 'text-stone-400 hover:text-stone-200')
            }
          >
            {({ isActive }) => (
              <>
                <div className={cn(
                  'mb-1 rounded-full p-3 transition-all duration-200',
                  isActive
                    ? 'bg-amber-500 shadow-[0_8px_28px_rgba(180,83,9,0.55)] ring-4 ring-amber-500/20'
                    : 'bg-[#38352e] shadow-[0_8px_24px_rgba(0,0,0,0.5)] ring-4 ring-white/5 hover:bg-[#45423a]'
                )}>
                  <ShipWheelIcon size={38} className={isActive ? 'text-white' : 'text-stone-300'} />
                </div>
                <span className="text-[10px] font-semibold tracking-wider uppercase font-display">{t('starting')}</span>
              </>
            )}
          </NavLink>

          <NavLink
            to="/records"
            className={({ isActive }) =>
              cn('flex w-16 flex-col items-center justify-center gap-1 transition-all duration-200',
                isActive ? 'text-amber-400' : 'text-stone-500 hover:text-stone-300')
            }
          >
            {({ isActive }) => (
              <>
                <FileText size={22} />
                <span className="text-[10px] font-semibold tracking-wider uppercase font-display">{t('records')}</span>
                {isActive && <span className="absolute bottom-0 h-0.75 w-10 rounded-full bg-amber-400 opacity-80" />}
              </>
            )}
          </NavLink>
        </div>
      </nav>
    </div>
  );
}
