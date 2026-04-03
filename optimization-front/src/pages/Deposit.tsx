import { useState } from 'react';
import { ChevronLeft, HeadphonesIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Deposit() {
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [tab, setTab] = useState<'deposit' | 'history'>('deposit');

  return (
    <div className="flex min-h-full flex-col bg-gray-50 pb-6">
      <div className="sticky top-0 z-10 flex items-center rounded-xl bg-white p-4 shadow-sm md:p-5">
        <Link to="/profile" className="text-gray-600 hover:text-gray-900 mr-4">
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
            className={`flex-1 py-3 text-sm font-medium capitalize ${tab === item ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-gray-500'}`}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="p-4 md:p-6">
        {tab === 'deposit' ? (
          <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
            <div className="mb-0 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <p className="text-sm text-gray-500 mb-2">Account Amount</p>
              <p className="text-3xl font-bold text-gray-800 mb-6">{(user?.balance ?? 0).toFixed(2)} <span className="text-lg font-normal text-gray-500">USDT</span></p>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Deposit Amount</label>
                <div className="relative">
                  <input
                    type="number"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    placeholder="Enter deposit amount"
                    className="w-full pl-4 pr-16 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-lg font-medium"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">USDT</span>
                </div>
              </div>

              <button className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 transition-colors shadow-md mb-4">
                Contact Customer Service
              </button>
            </div>

            <div className="flex flex-col items-center rounded-2xl border border-blue-100 bg-blue-50 p-6 text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 text-blue-600">
                <HeadphonesIcon size={32} />
              </div>
              <h3 className="font-bold text-gray-800 mb-2">Manual Deposit Flow</h3>
              <p className="text-sm text-gray-600 mb-6">Use the entered amount when you contact customer service to receive payment instructions.</p>
              <button className="bg-white text-blue-600 font-bold py-3 px-6 rounded-xl border border-blue-200 hover:bg-blue-50 transition-colors shadow-sm w-full">
                Contact Customer Service
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center text-gray-500">
            Deposit history is not available yet.
          </div>
        )}
      </div>
    </div>
  );
}
