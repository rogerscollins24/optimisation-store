import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

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
    <div className="min-h-screen bg-gradient-to-b from-blue-600 via-blue-500 to-cyan-400 flex items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-3xl bg-white/95 shadow-2xl p-8 border border-white/60">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-2xl font-bold shadow-lg">
            S
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Stacks</h1>
          <p className="text-sm text-slate-500 mt-2">Login to continue optimizing tasks</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Username</label>
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
            <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
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
            className="w-full rounded-2xl bg-blue-600 py-3 text-white font-semibold shadow-lg transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
          >
            {submitting ? 'Signing in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
