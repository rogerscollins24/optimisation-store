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
    <div className="flex min-h-full flex-col bg-gray-50 dark:bg-zinc-950 pb-6">
      <div className="sticky top-0 z-10 flex items-center rounded-xl bg-white dark:bg-zinc-900 p-4 shadow-sm md:p-5">
        <Link to="/profile" className="mr-4 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
          <ChevronLeft size={24} />
        </Link>
        <h1 className="text-lg font-bold text-gray-800 dark:text-gray-100">{t('withdrawal')}</h1>
      </div>

      <div className="grid gap-6 p-4 md:p-6 lg:grid-cols-[1fr_340px] lg:items-start">
        {!isAccountActive && (
          <div className="rounded-2xl border border-amber-200 dark:border-amber-700/50 bg-amber-50 dark:bg-amber-950/40 p-4 text-sm text-amber-700 dark:text-amber-300 lg:col-span-2">
            {t('accountNotActivated')}
          </div>
        )}
        <div className="mb-0 rounded-2xl border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('availableBalance')}</p>
            <p className={`text-xl font-bold ${balance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {balance.toFixed(2)} <span className="text-sm font-normal text-gray-500 dark:text-gray-400">USDT</span>
            </p>
          </div>

          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">{t('withdrawalAmount')}</label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={t('enterWithdrawalAmount')}
                className="w-full rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 dark:text-gray-100 dark:placeholder:text-gray-500 py-4 pl-4 pr-16 text-lg font-medium outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-blue-500"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 font-medium text-gray-500 dark:text-gray-400">USDT</span>
            </div>
          </div>

          <div className="mb-8">
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">{t('withdrawalPassword')}</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500">
                <Lock size={20} />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('enterPassword')}
                className="w-full rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 dark:text-gray-100 dark:placeholder:text-gray-500 py-4 pl-12 pr-4 text-lg font-medium outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => void handleWithdraw()}
            disabled={submitting || !isAccountActive}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-4 font-bold text-white shadow-md transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? <Loader2 size={18} className="animate-spin" /> : null}
            {submitting ? t('submitting') : t('submitAndOpenSupportChat')}
          </button>
        </div>

        <div className="rounded-2xl border border-orange-100 dark:border-orange-900/50 bg-orange-50 dark:bg-orange-950/30 p-6">
          <h3 className="mb-2 font-bold text-orange-800 dark:text-orange-300">{t('withdrawalRules')}</h3>
          <ul className="list-inside list-disc space-y-2 text-sm text-orange-700 dark:text-orange-400 opacity-80">
            <li>{t('minimumWithdrawalAmount')}</li>
            <li>{t('withdrawalProcessingTime')}</li>
            <li>{t('ensureWalletBound')}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
