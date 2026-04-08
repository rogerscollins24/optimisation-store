import { useState } from 'react';
import { ChevronLeft, HeadphonesIcon, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createSupportTicket } from '../lib/supportApi';

export default function Deposit() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [tab, setTab] = useState<'deposit' | 'history'>('deposit');
  const [submitting, setSubmitting] = useState(false);

  const handleDepositRequest = async () => {
    const numAmount = Number(amount);
    if (!user?.access_token) {
      alert('Please log in again');
      return;
    }
    if (!Number.isFinite(numAmount) || numAmount <= 0) {
      alert('Please enter a valid deposit amount');
      return;
    }

    setSubmitting(true);
    try {
      const ticket = await createSupportTicket(
        user.access_token,
        'Deposit Request',
        `Hello Support, I would like to make a deposit of ${numAmount.toFixed(2)} USDT.\nUsername: ${user.username}\nCurrent balance: ${(user.balance ?? 0).toFixed(2)} USDT. Please share the payment steps.`,
      );
      navigate(`/support?ticket=${ticket.id}`);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Unable to create the deposit request');
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
        <h1 className="text-lg font-bold text-gray-800">Deposit</h1>
      </div>

      <div className="mt-4 flex overflow-hidden rounded-xl border border-gray-200 bg-white">
        {(['deposit', 'history'] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTab(item)}
            className={`flex-1 py-3 text-sm font-medium capitalize ${tab === item ? 'border-b-2 border-blue-600 bg-blue-50/50 text-blue-600' : 'text-gray-500'}`}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="p-4 md:p-6">
        {tab === 'deposit' ? (
          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <div className="mb-0 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <p className="mb-2 text-sm text-gray-500">Account Amount</p>
              <p className="mb-6 text-3xl font-bold text-emerald-600">{(user?.balance ?? 0).toFixed(2)} <span className="text-lg font-normal text-gray-500">USDT</span></p>

              <div className="mb-6">
                <label className="mb-2 block text-sm font-medium text-gray-700">Deposit Amount</label>
                <div className="relative">
                  <input
                    type="number"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    placeholder="Enter deposit amount"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 py-4 pl-4 pr-16 text-lg font-medium outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-medium text-gray-500">USDT</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => void handleDepositRequest()}
                disabled={submitting}
                className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-4 font-bold text-white shadow-md transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? <Loader2 size={18} className="animate-spin" /> : null}
                {submitting ? 'Opening support chat...' : 'Submit Deposit Request'}
              </button>
            </div>

            <div className="flex flex-col items-center rounded-2xl border border-blue-100 bg-blue-50 p-6 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <HeadphonesIcon size={32} />
              </div>
              <h3 className="mb-2 font-bold text-gray-800">Manual Deposit Flow</h3>
              <p className="mb-6 text-sm text-gray-600">Submit the amount here and the app will open your support chat with a pre-filled deposit request.</p>
              <button
                type="button"
                onClick={() => void handleDepositRequest()}
                disabled={submitting}
                className="w-full rounded-xl border border-blue-200 bg-white px-6 py-3 font-bold text-blue-600 shadow-sm transition-colors hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-70"
              >
                Contact Customer Service
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center text-gray-500 shadow-sm">
            Deposit history is not available yet.
          </div>
        )}
      </div>
    </div>
  );
}
