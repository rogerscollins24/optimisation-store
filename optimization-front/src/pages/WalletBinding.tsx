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
    <div className="client-page flex min-h-full flex-col pb-6">
      <div className="client-header sticky top-0 z-10 flex items-center rounded-xl p-4 shadow-sm md:p-5">
        <Link to="/profile" className="mr-4 text-zinc-300 hover:text-white">
          <ChevronLeft size={24} />
        </Link>
        <h1 className="text-lg font-bold text-[#f6efe5]">{t('bindWalletAddress')}</h1>
      </div>

      <div className="p-4 md:p-6">
        <div className="client-card mx-auto max-w-2xl rounded-2xl p-6">
          <div className="grid gap-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-[#4f4133]">{t('exchangeNetwork')}</label>
              <input value={exchange} onChange={(event) => setExchange(event.target.value)} placeholder={t('exchangePlaceholder')} className="client-input w-full rounded-xl px-4 py-3" />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#4f4133]">{t('walletAddress')}</label>
              <textarea value={walletAddress} onChange={(event) => setWalletAddress(event.target.value)} placeholder={t('pasteWalletAddress')} className="client-input min-h-[140px] w-full rounded-xl px-4 py-3" />
            </div>
          </div>

          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className="client-btn-primary mt-6 flex w-full items-center justify-center gap-2 rounded-xl py-3 font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-70"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : null}
            {saving ? t('saving') : t('saveWalletDetails')}
          </button>
        </div>
      </div>
    </div>
  );
}
