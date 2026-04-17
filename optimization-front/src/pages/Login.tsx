import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { BrandHomeIcon } from '../components/BrandIcons';
import LanguageSwitcher from '../components/LanguageSwitcher';

export default function Login() {
  const navigate = useNavigate();
  const { login, signup } = useAuth();
  const { t } = useTranslation();
  const [isSignupMode, setIsSignupMode] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [password, setPassword] = useState('');
  const [captchaNumA, setCaptchaNumA] = useState(() => Math.floor(Math.random() * 9) + 1);
  const [captchaNumB, setCaptchaNumB] = useState(() => Math.floor(Math.random() * 9) + 1);
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const refreshCaptcha = () => {
    setCaptchaNumA(Math.floor(Math.random() * 9) + 1);
    setCaptchaNumB(Math.floor(Math.random() * 9) + 1);
    setCaptchaAnswer('');
  };

  const toggleMode = () => {
    setIsSignupMode((prev) => !prev);
    setError('');
    setSuccess('');
    setReferralCode('');
    setCaptchaAnswer('');
    refreshCaptcha();
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const parsedAnswer = Number(captchaAnswer);
      if (!Number.isFinite(parsedAnswer)) {
        throw new Error('Please enter a valid captcha answer');
      }

      if (isSignupMode) {
        const message = await signup(email, password, captchaNumA, captchaNumB, parsedAnswer, referralCode);
        setSuccess(message);
        setIsSignupMode(false);
        setEmail('');
        setReferralCode('');
        setPassword('');
      } else {
        await login(username, password, captchaNumA, captchaNumB, parsedAnswer);
        navigate('/');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('unableToLogin'));
      refreshCaptcha();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-stretch" style={{ backgroundColor: '#1e1b18' }}>
      <LanguageSwitcher className="fixed top-4 right-4 z-50" dropdownDirection="down" />
      {/* Left panel — brand identity */}
      <div
        className="relative hidden flex-col justify-between overflow-hidden p-12 lg:flex lg:w-[46%]"
        style={{
          background: 'linear-gradient(155deg, #2d2720 0%, #1a1510 60%, #0f0d0b 100%)',
        }}
      >
        {/* Geometric accent — large amber circle */}
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, #d97706 0%, transparent 70%)' }}
        />
        <div
          className="pointer-events-none absolute -bottom-16 -left-16 h-56 w-56 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #b45309 0%, transparent 70%)' }}
        />
        {/* Grid pattern overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, #fff 0px, #fff 1px, transparent 1px, transparent 48px), repeating-linear-gradient(90deg, #fff 0px, #fff 1px, transparent 1px, transparent 48px)',
          }}
        />

        <div className="relative z-10">
          <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: 'rgba(180,83,9,0.18)', border: '1px solid rgba(180,83,9,0.3)' }}>
            <BrandHomeIcon size={28} className="text-amber-400" />
          </div>
          <h1 className="font-display text-5xl font-800 leading-[1.1] tracking-tight text-white"
              style={{ fontFamily: '"Syne", ui-sans-serif', fontWeight: 800 }}>
            {t('brandName')}
          </h1>
          <p className="mt-4 text-base leading-relaxed" style={{ color: '#a09585' }}>
            {t('loginTagline')}
          </p>
        </div>

        <div className="relative z-10 space-y-4">
          {[
            { icon: '◈', label: 'Smart task optimisation' },
            { icon: '◈', label: 'Daily USDT commissions' },
            { icon: '◈', label: 'VIP tier rewards' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3">
              <span className="text-amber-500 text-xs">{item.icon}</span>
              <span className="text-sm font-medium" style={{ color: '#8a7d70' }}>{item.label}</span>
            </div>
          ))}
          <p className="pt-4 text-xs" style={{ color: '#4a4540', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            {t('signInContinue')}
          </p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12" style={{ backgroundColor: '#faf8f4' }}>
        <div className="w-full max-w-md">
          {/* Mobile brand header */}
          <div className="mb-8 lg:hidden">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-600 shadow-lg">
              <BrandHomeIcon size={28} className="text-white" />
            </div>
            <h2 className="text-3xl font-bold text-stone-900" style={{ fontFamily: '"Syne", ui-sans-serif', fontWeight: 700 }}>
              {t('brandName')}
            </h2>
          </div>

          <div className="mb-8">
            <h3 className="text-2xl font-bold text-stone-900" style={{ fontFamily: '"Syne", ui-sans-serif', fontWeight: 700 }}>
              {isSignupMode ? 'Create account' : t('login')}
            </h3>
            <p className="mt-1.5 text-sm text-stone-500">
              {isSignupMode ? 'Referral code is optional.' : t('loginPrompt')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignupMode ? (
              <>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-stone-500">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="w-full rounded-xl border bg-white px-4 py-3 text-stone-900 outline-none transition placeholder:text-stone-400 focus:ring-2"
                    style={{ borderColor: '#ddd8d0', focusRingColor: '#b45309' }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#b45309'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(180,83,9,0.12)'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = '#ddd8d0'; e.currentTarget.style.boxShadow = 'none'; }}
                    placeholder="Enter your email"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-stone-500">Referral Code <span className="normal-case font-normal text-stone-400">(optional)</span></label>
                  <input
                    type="text"
                    value={referralCode}
                    onChange={(event) => setReferralCode(event.target.value)}
                    className="w-full rounded-xl border bg-white px-4 py-3 text-stone-900 outline-none transition placeholder:text-stone-400"
                    style={{ borderColor: '#ddd8d0' }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#b45309'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(180,83,9,0.12)'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = '#ddd8d0'; e.currentTarget.style.boxShadow = 'none'; }}
                    placeholder="Enter referral code"
                  />
                </div>
              </>
            ) : (
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-stone-500">Username or Email</label>
                <input
                  type="text"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  className="w-full rounded-xl border bg-white px-4 py-3 text-stone-900 outline-none transition placeholder:text-stone-400"
                  style={{ borderColor: '#ddd8d0' }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = '#b45309'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(180,83,9,0.12)'; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = '#ddd8d0'; e.currentTarget.style.boxShadow = 'none'; }}
                  placeholder="Enter username or email"
                  required
                />
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-stone-500">{t('password')}</label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border bg-white px-4 py-3 text-stone-900 outline-none transition placeholder:text-stone-400"
                style={{ borderColor: '#ddd8d0' }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#b45309'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(180,83,9,0.12)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = '#ddd8d0'; e.currentTarget.style.boxShadow = 'none'; }}
                placeholder={t('enterPassword')}
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-stone-500">
                Verification: {captchaNumA} + {captchaNumB} = ?
              </label>
              <input
                type="number"
                value={captchaAnswer}
                onChange={(event) => setCaptchaAnswer(event.target.value)}
                className="w-full rounded-xl border bg-white px-4 py-3 text-stone-900 outline-none transition placeholder:text-stone-400"
                style={{ borderColor: '#ddd8d0' }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#b45309'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(180,83,9,0.12)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = '#ddd8d0'; e.currentTarget.style.boxShadow = 'none'; }}
                placeholder="Enter the sum"
                required
              />
            </div>

            {error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {error}
              </div>
            ) : null}
            {success ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                {success}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl py-3.5 text-sm font-bold tracking-wide text-white transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50"
              style={{ background: submitting ? '#d4a76a' : 'linear-gradient(135deg, #b45309 0%, #92400e 100%)', fontFamily: '"Syne", ui-sans-serif', letterSpacing: '0.06em' }}
              onMouseEnter={(e) => { if (!submitting) e.currentTarget.style.background = 'linear-gradient(135deg, #c45a0d 0%, #a04510 100%)'; }}
              onMouseLeave={(e) => { if (!submitting) e.currentTarget.style.background = 'linear-gradient(135deg, #b45309 0%, #92400e 100%)'; }}
            >
              {submitting
                ? (isSignupMode ? 'Submitting…' : t('signingIn'))
                : (isSignupMode ? 'CREATE ACCOUNT' : t('login').toUpperCase())}
            </button>

            <button
              type="button"
              onClick={toggleMode}
              className="w-full rounded-xl border py-3.5 text-sm font-semibold text-stone-600 transition-colors hover:bg-stone-100"
              style={{ borderColor: '#ddd8d0' }}
            >
              {isSignupMode ? '← Back to Login' : 'Create Client Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
