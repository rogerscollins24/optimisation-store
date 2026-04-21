import { useState } from 'react';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function PersonalInformation() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [gender, setGender] = useState(user?.gender ?? '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!user?.id || !user.access_token) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/users/${user.id}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.access_token}`,
        },
        body: JSON.stringify({ email, phone, gender }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: t('unableToSavePersonalInformation') }));
        throw new Error(error.detail || t('unableToSavePersonalInformation'));
      }

      await refreshUser();
      navigate('/profile');
    } catch (error) {
      showToast(error instanceof Error ? error.message : t('unableToSavePersonalInformation'), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="client-page flex min-h-full flex-col pb-6">
      <div className="client-header sticky top-0 z-10 flex items-center rounded-xl p-4 md:p-5">
        <Link to="/profile" className="mr-4 text-zinc-300 hover:text-white">
          <ChevronLeft size={24} />
        </Link>
        <h1 className="text-lg font-bold text-[#f6efe5]">{t('personalInformation')}</h1>
      </div>

      <div className="p-4 md:p-6">
        <div className="client-card mx-auto max-w-2xl rounded-2xl p-6">
          <div className="grid gap-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-[#4e4033]">{t('usernameLabel')}</label>
              <input value={user?.username ?? ''} readOnly className="client-input w-full rounded-xl px-4 py-3 text-[#766652]" />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#4e4033]">{t('email')}</label>
              <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder={t('enterYourEmail')} className="client-input w-full rounded-xl px-4 py-3" />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#4e4033]">{t('phone')}</label>
              <input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder={t('enterYourPhoneNumber')} className="client-input w-full rounded-xl px-4 py-3" />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#4e4033]">{t('gender')}</label>
              <select value={gender} onChange={(event) => setGender(event.target.value)} className="client-input w-full rounded-xl px-4 py-3">
                <option value="">{t('selectGender')}</option>
                <option value="Male">{t('male')}</option>
                <option value="Female">{t('female')}</option>
                <option value="Other">{t('other')}</option>
              </select>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className="client-btn-primary mt-6 flex w-full items-center justify-center gap-2 rounded-xl py-3 font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-70"
          >
            {saving ? <Loader2 size={18} className="animate-spin" /> : null}
            {saving ? t('saving') : t('savePersonalInformation')}
          </button>
        </div>
      </div>
    </div>
  );
}
