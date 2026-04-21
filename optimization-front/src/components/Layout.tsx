import { useEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { FileText } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useTranslation } from 'react-i18next';
import { BrandHomeIcon, ShipWheelIcon } from './BrandIcons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import LanguageSwitcher from './LanguageSwitcher';
import DarkModeToggle from './DarkModeToggle';

const DISPLAY = '"Bricolage Grotesque", ui-sans-serif';

export function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export default function Layout() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const isDark = theme === 'dark';
  const [showInactivePopup, setShowInactivePopup] = useState(false);
  const isActivated = user?.status === 'Active';

  useEffect(() => {
    setShowInactivePopup(!isActivated);
  }, [isActivated]);

  return (
    <div className="flex min-h-screen flex-col" style={{ backgroundColor: 'transparent' }}>
      {showInactivePopup && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-amber-200 bg-[#f8efe4] p-5 shadow-2xl sm:p-6">
            <h2 className="text-lg font-bold text-[#3a2f24]">{t('accountNotActivated')}</h2>

            <div className="mt-5 flex flex-col gap-2.5">
              <button
                onClick={() => {
                  setShowInactivePopup(false);
                  navigate('/support');
                }}
                className="client-btn-primary w-full rounded-xl py-2.5 text-sm font-semibold"
              >
                {t('contactUs')}
              </button>
              <button
                onClick={() => setShowInactivePopup(false)}
                className="w-full rounded-xl border border-amber-300 bg-amber-50 py-2.5 text-sm font-semibold text-amber-800 transition hover:bg-amber-100"
              >
                {t('cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto pb-20 sm:pb-24">
        <div className="mx-auto w-full max-w-7xl px-3 py-3 sm:px-4 sm:py-4 md:px-8 md:py-6">
          <Outlet />
        </div>
      </div>

      <LanguageSwitcher />
      <DarkModeToggle />

      <nav
        className="fixed bottom-0 left-0 z-50 w-full"
        style={{
          background: isDark
            ? 'linear-gradient(to top, #0f0d0a 0%, #1a1812 100%)'
            : 'linear-gradient(to top, #1e1c18 0%, #28251f 100%)',
          boxShadow: '0 -1px 0 rgba(255,255,255,0.06), 0 -8px 32px rgba(0,0,0,0.28)',
        }}
      >
        <div className="mx-auto flex h-17 w-full max-w-7xl items-center justify-around px-2">

          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              cn('relative flex min-h-11 w-16 flex-col items-center justify-center gap-1 transition-all duration-200',
                isActive ? 'text-amber-400' : 'text-stone-500 hover:text-stone-300')
            }
          >
            {({ isActive }) => (
              <>
                <BrandHomeIcon size={22} />
                <span className="text-[9px] font-bold uppercase tracking-wider" style={{ fontFamily: DISPLAY }}>{t('home')}</span>
                {isActive && <span className="absolute bottom-0 h-0.75 w-8 rounded-full bg-amber-400" />}
              </>
            )}
          </NavLink>

          <NavLink
            to="/starting"
            className={({ isActive }) =>
              cn('relative -top-5 flex min-h-11 w-24 flex-col items-center justify-center gap-1 transition-all duration-200',
                isActive ? 'text-amber-400' : 'text-stone-400 hover:text-stone-200')
            }
          >
            {({ isActive }) => (
              <>
                <div className={cn(
                  'mb-1 rounded-full p-3 transition-all duration-200',
                  isActive
                    ? 'bg-amber-500 ring-4 ring-amber-500/20'
                    : 'bg-[#38352e] ring-4 ring-white/5 hover:bg-[#45423a]',
                )}
                  style={isActive ? { boxShadow: '0 6px 24px rgba(180,83,9,0.5)' } : { boxShadow: '0 6px 20px rgba(0,0,0,0.45)' }}
                >
                  <ShipWheelIcon size={38} className={isActive ? 'text-white' : 'text-stone-300'} />
                </div>
                <span className="text-[9px] font-bold uppercase tracking-wider" style={{ fontFamily: DISPLAY }}>{t('starting')}</span>
              </>
            )}
          </NavLink>

          <NavLink
            to="/records"
            className={({ isActive }) =>
              cn('relative flex min-h-11 w-16 flex-col items-center justify-center gap-1 transition-all duration-200',
                isActive ? 'text-amber-400' : 'text-stone-500 hover:text-stone-300')
            }
          >
            {({ isActive }) => (
              <>
                <FileText size={22} />
                <span className="text-[9px] font-bold uppercase tracking-wider" style={{ fontFamily: DISPLAY }}>{t('records')}</span>
                {isActive && <span className="absolute bottom-0 h-0.75 w-8 rounded-full bg-amber-400" />}
              </>
            )}
          </NavLink>

        </div>
      </nav>
    </div>
  );
}
