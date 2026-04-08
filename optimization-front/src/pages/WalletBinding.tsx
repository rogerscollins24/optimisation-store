import { useState } from 'react';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function WalletBinding() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const { t } = useLanguage();
  const [exchange, setExchange] = useState(user?.exchange ?? '');
  const [walletAddress, setWalletAddress] = useState(user?.wallet_address ?? '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!user?.id || !user.access_token) return;
    if (!walletAddress.trim()) {
      alert('Please enter a wallet address');
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
      alert(error instanceof Error ? error.message : t('unableToBindWalletAddress'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-full flex-col bg-gray-50 pb-6">
      <div className="sticky top-0 z-10 flex items-center rounded-xl bg-white p-4 shadow-sm md:p-5">
        <Link to="/profile" className="mr-4 text-gray-600 hover:text-gray-900">
          <ChevronLeft size={24} />
        </Link>
        <h1 className="text-lg font-bold text-gray-800">{t('bindWalletAddress')}</h1>
      </div>

      <div className="p-4 md:p-6">
        <div className="mx-auto max-w-2xl rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="grid gap-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">{t('exchangeNetwork')}</label>
              <input value={exchange} onChange={(event) => setExchange(event.target.value)} placeholder="e.g. Binance, TRC20, ERC20" className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-800 outline-none focus:border-blue-500" />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">{t('walletAddress')}</label>
              <textarea value={walletAddress} onChange={(event) => setWalletAddress(event.target.value)} placeholder={t('pasteWalletAddress')} className="min-h-[140px] w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-800 outline-none focus:border-blue-500" />
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
