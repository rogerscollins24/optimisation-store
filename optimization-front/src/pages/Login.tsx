import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BrandHomeIcon } from '../components/BrandIcons';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to login');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-blue-600 via-blue-500 to-cyan-400 px-4 py-8">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-white/60 bg-white/95 shadow-2xl lg:grid-cols-2">
        <div className="hidden flex-col justify-between bg-gradient-to-br from-slate-900 to-blue-900 p-10 text-white lg:flex">
          <div>
            <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 text-2xl font-bold">
              <BrandHomeIcon size={28} className="text-white" />
            </div>
            <h1 className="text-4xl font-bold leading-tight">Shopping Optimized</h1>
            <p className="mt-3 text-sm text-blue-100">A responsive optimization workspace for web and mobile.</p>
          </div>
          <p className="text-sm text-blue-100">Sign in to continue optimizing tasks and tracking records.</p>
        </div>

        <div className="p-8 md:p-10">
          <div className="mb-8 text-center lg:text-left">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-2xl font-bold text-white shadow-lg lg:mx-0 lg:hidden">
              <BrandHomeIcon size={30} className="text-white" />
            </div>
            <h2 className="text-3xl font-bold leading-tight text-slate-900">Shopping Optimized</h2>
            <p className="mt-2 text-sm text-slate-500">Login to continue optimizing tasks</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Username</label>
              <input
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                placeholder="Enter username"
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Password</label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                placeholder="Enter password"
                required
              />
            </div>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-2xl bg-blue-600 py-3 font-semibold text-white shadow-lg transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
            >
              {submitting ? 'Signing in...' : 'Login'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
