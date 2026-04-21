import { useState } from 'react';
import { ChevronLeft, HeadphonesIcon, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { createSupportTicket } from '../lib/supportApi';

export default function Deposit() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [amount, setAmount] = useState('');
  const [tab, setTab] = useState<'deposit' | 'history'>('deposit');
  const [submitting, setSubmitting] = useState(false);
  const isAccountActive = user?.status === 'Active';

  const handleDepositRequest = async () => {
    if (!isAccountActive) {
      navigate('/support');
      return;
    }
    const numAmount = Number(amount);
    if (!user?.access_token) {
      showToast(t('pleaseLoginAgain'), 'error');
      return;
    }
    if (!Number.isFinite(numAmount) || numAmount <= 0) {
      showToast(t('pleaseEnterValidDepositAmount'), 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const ticket = await createSupportTicket(
        user.access_token,
        t('depositRequestSubject'),
        t('depositSupportMessage', {
          amount: numAmount.toFixed(2),
          username: user.username,
          balance: (user.balance ?? 0).toFixed(2),
        }),
      );
      navigate(`/support?ticket=${ticket.id}`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : t('unableToCreateDepositRequest'), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="client-page flex min-h-full flex-col pb-6">
      <div className="client-header sticky top-0 z-10 flex items-center rounded-xl p-3 sm:p-4 shadow-sm md:p-5">
        <Link to="/profile" className="mr-4 text-zinc-300 hover:text-white">
          <ChevronLeft size={24} />
        </Link>
        <h1 className="text-lg font-bold text-[#f5eee4]">{t('deposit')}</h1>
      </div>

      <div className="client-tab mt-3 flex overflow-hidden rounded-xl sm:mt-4">
        {(['deposit', 'history'] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTab(item)}
            className={`flex-1 py-2.5 text-xs font-medium capitalize sm:py-3 sm:text-sm ${tab === item ? 'client-tab-active' : 'text-[#6e5d49]'}`}
          >
            {t(item)}
          </button>
        ))}
      </div>

      <div className="p-3 sm:p-4 md:p-6">
        {!isAccountActive && (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
            {t('accountNotActivated')}
          </div>
        )}
        {tab === 'deposit' ? (
          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <div className="client-card mb-0 rounded-2xl p-6">
              <p className="mb-2 text-sm text-[#6f5f4c]">{t('accountAmount')}</p>
              <p className="mb-6 text-3xl font-bold text-emerald-700">{(user?.balance ?? 0).toFixed(2)} <span className="text-lg font-normal text-[#6f5f4c]">USDT</span></p>

              <div className="mb-6">
                <label className="mb-2 block text-sm font-medium text-[#514335]">{t('depositAmount')}</label>
                <div className="relative">
                  <input
                    type="number"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    placeholder={t('enterDepositAmount')}
                    className="client-input w-full rounded-xl py-4 pl-4 pr-16 text-lg font-medium"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-medium text-[#6f5f4c]">USDT</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => void handleDepositRequest()}
                disabled={submitting || !isAccountActive}
                className="client-btn-primary mb-4 flex w-full items-center justify-center gap-2 rounded-xl py-4 font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? <Loader2 size={18} className="animate-spin" /> : null}
                {submitting ? t('openingSupportChat') : t('submitDepositRequest')}
              </button>
            </div>

            <div className="client-card-dark flex flex-col items-center rounded-2xl p-6 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                <HeadphonesIcon size={32} />
              </div>
              <h3 className="mb-2 font-bold text-[#f5eee2]">{t('manualDepositFlow')}</h3>
              <p className="mb-6 text-sm text-amber-50/75">{t('manualDepositFlowDesc')}</p>
              <button
                type="button"
                onClick={() => void handleDepositRequest()}
                disabled={submitting || !isAccountActive}
                className="client-btn-secondary w-full rounded-xl px-6 py-3 font-bold shadow-sm transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-70"
              >
                {t('contactCustomerService')}
              </button>
            </div>
          </div>
        ) : (
          <div className="client-card rounded-2xl p-8 text-center text-[#6b5b47]">
            {t('depositHistoryUnavailable')}
          </div>
        )}
      </div>
    </div>
  );
}
