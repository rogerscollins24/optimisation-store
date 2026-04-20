import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { FileText } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useTranslation } from 'react-i18next';
import { BrandHomeIcon, ShipWheelIcon } from './BrandIcons';
import { useAuth } from '../context/AuthContext';

export function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export default function Layout() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isActivated = user?.status === 'Active';
  const isBalanceNegative = (user?.balance ?? 0) < 0;
  const isSupportOrDepositPage = location.pathname.startsWith('/deposit') || location.pathname.startsWith('/support');
  const shouldShowNegativeBalancePopup = isActivated && isBalanceNegative && !isSupportOrDepositPage;
  const requiredDeposit = Math.abs(user?.balance ?? 0);

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-[#f4f0e8] via-[#ece7dd] to-[#e7e1d6]">
      {shouldShowNegativeBalancePopup && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-rose-200 bg-[#f8efe4] p-5 shadow-2xl sm:p-6">
            <h2 className="text-lg font-bold text-[#3a2f24]">{t('insufficientBalanceDeposit')}</h2>
            <p className="mt-2 text-sm text-[#6f5e4b]">{t('requiredDeposit')}: USDT {requiredDeposit.toFixed(2)}</p>
            <p className="mt-1 text-sm text-[#6f5e4b]">Deposit funds to continue, or contact support for assistance.</p>

            <div className="mt-5 flex flex-col gap-2.5">
              <button
                onClick={() => navigate('/deposit')}
                className="client-btn-primary w-full rounded-xl py-2.5 text-sm font-semibold"
              >
                {t('goToDeposit')}
              </button>
              <button
                onClick={() => navigate('/support')}
                className="w-full rounded-xl border border-amber-300 bg-amber-50 py-2.5 text-sm font-semibold text-amber-800 transition hover:bg-amber-100"
              >
                {t('contactSupportChat')}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto pb-20 sm:pb-24">
        <div className="mx-auto w-full max-w-7xl px-3 py-3 sm:px-4 sm:py-4 md:px-8 md:py-6">
          {!isActivated && (
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
              account not activated contact support
            </div>
          )}
          <Outlet />
        </div>
      </div>

      <nav className="fixed bottom-0 left-0 z-50 w-full border-t border-zinc-700/80 bg-[linear-gradient(90deg,#161616_0%,#1f1d1b_48%,#151515_100%)] shadow-[0_-10px_24px_rgba(0,0,0,0.35)] backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-around px-1 sm:h-20 sm:px-2">
          <NavLink
            to="/"
            className={({ isActive }) =>
              cn('flex w-16 flex-col items-center justify-center gap-1 text-[10px] uppercase tracking-[0.08em] sm:w-20 sm:text-[11px] sm:tracking-[0.1em]', isActive ? 'text-amber-300' : 'text-zinc-400')
            }
          >
            <BrandHomeIcon size={24} />
            <span className="font-semibold">{t('home')}</span>
          </NavLink>

          <NavLink
            to="/starting"
            className={({ isActive }) =>
              cn('relative -top-5 flex w-20 flex-col items-center justify-center gap-1 text-[10px] uppercase tracking-[0.08em] sm:-top-7 sm:w-24 sm:text-[11px] sm:tracking-[0.1em]', isActive ? 'text-zinc-100' : 'text-zinc-300')
            }
          >
            <div className="mb-1 rounded-full border border-amber-500/35 bg-[radial-gradient(circle_at_30%_25%,#74512a_0%,#362515_75%)] p-1.5 shadow-[0_14px_30px_rgba(35,27,20,0.55)] ring-2 ring-black/20 sm:p-2.5 sm:ring-4">
              <ShipWheelIcon size={34} />
            </div>
            <span className="font-semibold">{t('starting')}</span>
          </NavLink>

          <NavLink
            to="/records"
            className={({ isActive }) =>
              cn('flex w-16 flex-col items-center justify-center gap-1 text-[10px] uppercase tracking-[0.08em] sm:w-20 sm:text-[11px] sm:tracking-[0.1em]', isActive ? 'text-amber-300' : 'text-zinc-400')
            }
          >
            <FileText size={20} />
            <span className="font-semibold">{t('records')}</span>
          </NavLink>
        </div>
      </nav>
    </div>
  );
}
