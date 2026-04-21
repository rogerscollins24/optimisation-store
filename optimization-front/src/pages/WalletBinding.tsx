import { useState } from 'react';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function WalletBinding() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [exchange, setExchange] = useState(user?.exchange ?? '');
  const [walletAddress, setWalletAddress] = useState(user?.wallet_address ?? '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!user?.id || !user.access_token) return;
    if (!walletAddress.trim()) {
      showToast(t('pasteWalletAddress'), 'warning');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/users/${user.id}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.access_token}`,
        },
        body: JSON.stringify({ exchange, wallet_address: walletAddress.trim() }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: t('unableToBindWalletAddress') }));
        throw new Error(error.detail || t('unableToBindWalletAddress'));
      }

      await refreshUser();
      navigate('/profile');
    } catch (error) {
      showToast(error instanceof Error ? error.message : t('unableToBindWalletAddress'), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-full flex-col bg-gray-50 dark:bg-zinc-950 pb-6">
      <div className="sticky top-0 z-10 flex items-center rounded-xl bg-white dark:bg-zinc-900 p-4 shadow-sm md:p-5">
        <Link to="/profile" className="mr-4 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
          <ChevronLeft size={24} />
        </Link>
        <h1 className="text-lg font-bold text-gray-800 dark:text-gray-100">{t('bindWalletAddress')}</h1>
      </div>

      <div className="p-4 md:p-6">
        <div className="mx-auto max-w-2xl rounded-2xl border border-gray-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-sm">
          <div className="grid gap-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">{t('exchangeNetwork')}</label>
              <input value={exchange} onChange={(event) => setExchange(event.target.value)} placeholder={t('exchangePlaceholder')} className="w-full rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 dark:text-gray-100 dark:placeholder:text-gray-500 px-4 py-3 text-gray-800 outline-none focus:border-blue-500" />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">{t('walletAddress')}</label>
              <textarea value={walletAddress} onChange={(event) => setWalletAddress(event.target.value)} placeholder={t('pasteWalletAddress')} className="min-h-[140px] w-full rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 dark:text-gray-100 dark:placeholder:text-gray-500 px-4 py-3 text-gray-800 outline-none focus:border-blue-500" />
            </div>
          </div>

          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 py-3 font-semibold text-white transition-colors hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : null}
            {saving ? t('saving') : t('saveWalletDetails')}
          </button>
        </div>
      </div>
    </div>
  );
}
