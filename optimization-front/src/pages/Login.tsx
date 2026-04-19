import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { BrandHomeIcon } from '../components/BrandIcons';

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
    <div className="client-page flex min-h-screen items-center justify-center px-3 py-5 sm:px-4 sm:py-8">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-[#79684f]/25 bg-[#f8f1e4]/90 shadow-2xl lg:grid-cols-2">
        <div className="hidden flex-col justify-between bg-[linear-gradient(130deg,#2f2b25_0%,#1d1b18_45%,#342615_100%)] p-10 text-[#f6f0e6] lg:flex">
          <div>
            <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 text-2xl font-bold">
              <BrandHomeIcon size={36} className="text-white" />
            </div>
            <h1 className="text-4xl font-bold leading-tight">{t('brandName')}</h1>
            <p className="mt-3 text-sm text-amber-100/90">{t('loginTagline')}</p>
          </div>
          <p className="text-sm text-amber-100/80">{t('signInContinue')}</p>
        </div>

        <div className="p-5 sm:p-8 md:p-10">
          <div className="mb-8 text-center lg:text-left">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[linear-gradient(120deg,#a46a29_0%,#be8d47_100%)] text-2xl font-bold text-white shadow-lg lg:mx-0 lg:hidden">
              <BrandHomeIcon size={38} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold leading-tight text-[#2e261e] sm:text-3xl">{t('brandName')}</h2>
            <p className="mt-2 text-sm text-[#74624d]">
              {isSignupMode ? 'Create your client account. Referral code is optional.' : t('loginPrompt')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignupMode ? (
              <>
                <div>
                  <label className="mb-2 block text-sm font-medium text-[#4f4235]">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="client-input w-full rounded-2xl px-4 py-3"
                    placeholder="Enter your email"
                    required
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-[#4f4235]">Referral Code (Optional)</label>
                  <input
                    type="text"
                    value={referralCode}
                    onChange={(event) => setReferralCode(event.target.value)}
                    className="client-input w-full rounded-2xl px-4 py-3"
                    placeholder="Enter referral code"
                  />
                </div>
              </>
            ) : (
              <div>
                <label className="mb-2 block text-sm font-medium text-[#4f4235]">Username or Email</label>
                <input
                  type="text"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  className="client-input w-full rounded-2xl px-4 py-3"
                  placeholder="Enter username or email"
                  required
                />
              </div>
            )}
            <div>
              <label className="mb-2 block text-sm font-medium text-[#4f4235]">{t('password')}</label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="client-input w-full rounded-2xl px-4 py-3"
                placeholder={t('enterPassword')}
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-[#4f4235]">Captcha: {captchaNumA} + {captchaNumB} = ?</label>
              <input
                type="number"
                value={captchaAnswer}
                onChange={(event) => setCaptchaAnswer(event.target.value)}
                className="client-input w-full rounded-2xl px-4 py-3"
                placeholder="Enter answer"
                required
              />
            </div>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            {success ? <p className="text-sm text-emerald-600">{success}</p> : null}

            <button
              type="submit"
              disabled={submitting}
              className="client-btn-primary w-full rounded-2xl py-3 font-semibold transition disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (isSignupMode ? 'Submitting...' : t('signingIn')) : (isSignupMode ? 'Sign Up' : t('login'))}
            </button>

            <button
              type="button"
              onClick={toggleMode}
              className="client-btn-secondary w-full rounded-2xl py-3 font-semibold transition hover:bg-white/90"
            >
              {isSignupMode ? 'Back to Login' : 'Create Client Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
