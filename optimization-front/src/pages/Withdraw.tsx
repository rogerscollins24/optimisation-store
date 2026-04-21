import { useState } from 'react';
import { ChevronLeft, Loader2, Lock } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { createSupportTicket } from '../lib/supportApi';

export default function Withdraw() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [amount, setAmount] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const isAccountActive = user?.status === 'Active';

  const balance = user?.balance ?? 0;

  const handleWithdraw = async () => {
    if (!isAccountActive) {
      navigate('/support');
      return;
    }
    const numAmount = parseFloat(amount);
    if (Number.isNaN(numAmount) || numAmount <= 0) {
      showToast(t('pleaseEnterValidAmount'), 'warning');
      return;
    }
    if (numAmount > balance) {
      showToast(t('insufficientBalance'), 'warning');
      return;
    }
    if (!password) {
      showToast(t('pleaseEnterWithdrawalPassword'), 'warning');
      return;
    }
    if (password !== (user?.withdraw_password ?? '')) {
      showToast(t('invalidWithdrawalPassword'), 'error');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/users/${user?.id}/balance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: numAmount, type: 'subtract', reason: t('clientWithdrawalReason') }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: t('withdrawalFailed') }));
        showToast(error.detail || t('withdrawalFailed'), 'error');
        return;
      }

      await refreshUser();

      let ticketId: number | null = null;
      if (user?.access_token) {
        const ticket = await createSupportTicket(
          user.access_token,
          t('withdrawalRequestSubject'),
          t('withdrawSupportMessage', {
            amount: numAmount.toFixed(2),
            username: user.username,
            exchange: user.exchange || t('notSet'),
            wallet: user.wallet_address || t('notSet'),
          }),
        );
        ticketId = ticket.id;
      }

      if (ticketId) {
        navigate(`/support?ticket=${ticketId}`);
      } else {
        navigate('/profile');
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : t('withdrawalFailed'), 'error');
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
        <h1 className="text-lg font-bold text-[#f5eee4]">{t('withdrawal')}</h1>
      </div>

      <div className="grid gap-4 p-3 sm:gap-6 sm:p-4 md:p-6 lg:grid-cols-[1fr_340px] lg:items-start">
        {!isAccountActive && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700 lg:col-span-2">
            {t('accountNotActivated')}
          </div>
        )}
        <div className="client-card mb-0 rounded-2xl p-6">
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm text-[#6f5f4c]">{t('availableBalance')}</p>
            <p className={`text-xl font-bold ${balance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {balance.toFixed(2)} <span className="text-sm font-normal text-[#6f5f4c]">USDT</span>
            </p>
          </div>

          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-[#4f4134]">{t('withdrawalAmount')}</label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={t('enterWithdrawalAmount')}
                className="client-input w-full rounded-xl py-3 pl-4 pr-16 text-base font-medium sm:py-4 sm:text-lg"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 font-medium text-[#6f5f4c]">USDT</span>
            </div>
          </div>

          <div className="mb-8">
            <label className="mb-2 block text-sm font-medium text-[#4f4134]">{t('withdrawalPassword')}</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#786754]">
                <Lock size={20} />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('enterPassword')}
                className="client-input w-full rounded-xl py-3 pl-12 pr-4 text-base font-medium sm:py-4 sm:text-lg"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => void handleWithdraw()}
            disabled={submitting || !isAccountActive}
            className="client-btn-primary flex w-full items-center justify-center gap-2 rounded-xl py-4 font-bold shadow-md transition-colors disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? <Loader2 size={18} className="animate-spin" /> : null}
            {submitting ? t('submitting') : t('submitAndOpenSupportChat')}
          </button>
        </div>

        <div className="client-card-dark rounded-2xl p-6">
          <h3 className="mb-2 font-bold text-amber-200">{t('withdrawalRules')}</h3>
          <ul className="list-inside list-disc space-y-2 text-sm text-amber-50/85">
            <li>{t('minimumWithdrawalAmount')}</li>
            <li>{t('withdrawalProcessingTime')}</li>
            <li>{t('ensureWalletBound')}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
