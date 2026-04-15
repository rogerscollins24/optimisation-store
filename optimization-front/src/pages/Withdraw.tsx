import { useState } from 'react';
import { ChevronLeft, Loader2, Lock } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { createSupportTicket } from '../lib/supportApi';

export default function Withdraw() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const { t } = useTranslation();
  const [amount, setAmount] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const balance = user?.balance ?? 0;

  const handleWithdraw = async () => {
    const numAmount = parseFloat(amount);
    if (Number.isNaN(numAmount) || numAmount <= 0) {
      alert(t('pleaseEnterValidAmount'));
      return;
    }
    if (numAmount > balance) {
      alert(t('insufficientBalance'));
      return;
    }
    if (!password) {
      alert(t('pleaseEnterWithdrawalPassword'));
      return;
    }
    if (password !== (user?.withdraw_password ?? '')) {
      alert(t('invalidWithdrawalPassword'));
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
        alert(error.detail || t('withdrawalFailed'));
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
      alert(error instanceof Error ? error.message : t('withdrawalFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-full flex-col bg-gray-50 pb-6">
      <div className="sticky top-0 z-10 flex items-center rounded-xl bg-white p-4 shadow-sm md:p-5">
        <Link to="/profile" className="mr-4 text-gray-600 hover:text-gray-900">
          <ChevronLeft size={24} />
        </Link>
        <h1 className="text-lg font-bold text-gray-800">{t('withdrawal')}</h1>
      </div>

      <div className="grid gap-6 p-4 md:p-6 lg:grid-cols-[1fr_340px] lg:items-start">
        <div className="mb-0 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm text-gray-500">{t('availableBalance')}</p>
            <p className={`text-xl font-bold ${balance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {balance.toFixed(2)} <span className="text-sm font-normal text-gray-500">USDT</span>
            </p>
          </div>

          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-gray-700">{t('withdrawalAmount')}</label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={t('enterWithdrawalAmount')}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-4 pl-4 pr-16 text-lg font-medium outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-blue-500"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 font-medium text-gray-500">USDT</span>
            </div>
          </div>

          <div className="mb-8">
            <label className="mb-2 block text-sm font-medium text-gray-700">{t('withdrawalPassword')}</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <Lock size={20} />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('enterPassword')}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-4 pl-12 pr-4 text-lg font-medium outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => void handleWithdraw()}
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-4 font-bold text-white shadow-md transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? <Loader2 size={18} className="animate-spin" /> : null}
            {submitting ? t('submitting') : t('submitAndOpenSupportChat')}
          </button>
        </div>

        <div className="rounded-2xl border border-orange-100 bg-orange-50 p-6">
          <h3 className="mb-2 font-bold text-orange-800">{t('withdrawalRules')}</h3>
          <ul className="list-inside list-disc space-y-2 text-sm text-orange-700 opacity-80">
            <li>{t('minimumWithdrawalAmount')}</li>
            <li>{t('withdrawalProcessingTime')}</li>
            <li>{t('ensureWalletBound')}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
