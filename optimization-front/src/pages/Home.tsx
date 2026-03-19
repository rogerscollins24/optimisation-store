import { Link } from 'react-router-dom';
import { Bell, HeadphonesIcon, Gift, ArrowDownToLine, ArrowUpFromLine, FileText, Award, HelpCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user } = useAuth();
  const menuItems = [
    { icon: HeadphonesIcon, label: 'Service', color: 'text-blue-500', bg: 'bg-blue-100' },
    { icon: Gift, label: 'Event', color: 'text-pink-500', bg: 'bg-pink-100' },
    { icon: ArrowUpFromLine, label: 'Withdrawal', color: 'text-orange-500', bg: 'bg-orange-100', to: '/withdraw' },
    { icon: ArrowDownToLine, label: 'Deposit', color: 'text-green-500', bg: 'bg-green-100', to: '/deposit' },
    { icon: FileText, label: 'T & C', color: 'text-purple-500', bg: 'bg-purple-100' },
    { icon: Award, label: 'Certificate', color: 'text-yellow-500', bg: 'bg-yellow-100' },
    { icon: HelpCircle, label: 'FAQs', color: 'text-teal-500', bg: 'bg-teal-100' },
  ];

  const vipLevels = [
    { level: 1, amount: '100.00', commission: '0.50%', tasks: 40 },
    { level: 2, amount: '500.00', commission: '0.55%', tasks: 45 },
    { level: 3, amount: '1500.00', commission: '0.60%', tasks: 50 },
    { level: 4, amount: '3000.00', commission: '0.65%', tasks: 55 },
  ];

  return (
    <div className="flex flex-col min-h-full bg-gray-50 pb-6">
      <div className="bg-blue-600 px-4 pt-8 pb-16 rounded-b-[2rem] text-white">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Welcome back,</h1>
            <p className="text-lg">{user?.username ?? 'Guest'}!</p>
          </div>
          <Link to="/profile">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username ?? 'Stacks'}`} alt="Avatar" className="w-10 h-10 rounded-full" />
            </div>
          </Link>
        </div>
      </div>

      <div className="px-4 -mt-10">
        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
          <img 
            src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80" 
            alt="Banner" 
            className="w-full h-40 object-cover"
          />
        </div>

        <div className="grid grid-cols-4 gap-y-6 gap-x-2 mb-8 bg-white p-4 rounded-xl shadow-sm">
          {menuItems.map((item, index) => {
            const content = (
              <>
                <div className={`w-12 h-12 rounded-full ${item.bg} flex items-center justify-center mb-2 mx-auto`}>
                  <item.icon className={item.color} size={24} />
                </div>
                <span className="text-xs text-gray-600 text-center block">{item.label}</span>
              </>
            );

            return item.to ? (
              <Link key={index} to={item.to} className="block">
                {content}
              </Link>
            ) : (
              <div key={index} className="cursor-pointer">
                {content}
              </div>
            );
          })}
        </div>

        <h2 className="text-lg font-bold mb-4 text-gray-800">VIP Levels</h2>
        <div className="space-y-3">
          {vipLevels.map((vip) => (
            <div key={vip.level} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-inner">
                  V{vip.level}
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">VIP {vip.level}</h3>
                  <p className="text-xs text-gray-500">Amount: {vip.amount} USDT</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-blue-600">{vip.commission} Comm.</p>
                <p className="text-xs text-gray-500">{vip.tasks} Tasks/Day</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
