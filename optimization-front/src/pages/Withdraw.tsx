import { useState } from 'react';
import { ChevronLeft, Lock } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Withdraw() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [amount, setAmount] = useState('');
  const [password, setPassword] = useState('');

  const balance = user?.balance ?? 0;

  const handleWithdraw = async () => {
    const numAmount = parseFloat(amount);
    if (Number.isNaN(numAmount) || numAmount <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    if (numAmount > balance) {
      alert('Insufficient balance');
      return;
    }
    if (!password) {
      alert('Please enter your withdrawal password');
      return;
    }
    if (password !== (user?.withdraw_password ?? '')) {
      alert('Invalid withdrawal password');
      return;
    }

    const response = await fetch(`/api/users/${user?.id}/balance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: numAmount, type: 'subtract', reason: 'client withdrawal' }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Withdrawal failed' }));
      alert(error.detail || 'Withdrawal failed');
      return;
    }

    await refreshUser();
    alert('Withdrawal submitted successfully');
    navigate('/profile');
  };

  return (
    <div className="flex flex-col min-h-full bg-gray-50 pb-6">
      <div className="flex items-center p-4 bg-white shadow-sm sticky top-0 z-10">
        <Link to="/profile" className="text-gray-600 hover:text-gray-900 mr-4">
          <ChevronLeft size={24} />
        </Link>
        <h1 className="text-lg font-bold text-gray-800">Withdraw</h1>
      </div>

      <div className="p-4">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
          <div className="flex justify-between items-center mb-6">
            <p className="text-sm text-gray-500">Available Balance</p>
            <p className="text-xl font-bold text-blue-600">{balance.toFixed(2)} <span className="text-sm font-normal text-gray-500">USDT</span></p>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Withdrawal Amount</label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter withdrawal amount"
                className="w-full pl-4 pr-16 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-lg font-medium"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">USDT</span>
            </div>
          </div>

          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">Withdrawal Password</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <Lock size={20} />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-lg font-medium"
              />
            </div>
          </div>

          <button onClick={handleWithdraw} className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 transition-colors shadow-md">
            Submit
          </button>
        </div>

        <div className="bg-orange-50 rounded-2xl p-6 border border-orange-100">
          <h3 className="font-bold text-orange-800 mb-2">Withdrawal Rules</h3>
          <ul className="list-disc list-inside text-sm text-orange-700 space-y-2 opacity-80">
            <li>Minimum withdrawal amount is 10 USDT.</li>
            <li>Withdrawal processing time is 1-24 hours.</li>
            <li>Please ensure your wallet address is bound correctly.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
