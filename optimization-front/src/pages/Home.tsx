import { Link } from 'react-router-dom';
import { HeadphonesIcon, Gift, ArrowDownToLine, ArrowUpFromLine, FileText, Award, HelpCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user } = useAuth();
  const menuItems = [
    { icon: HeadphonesIcon, label: 'Service', color: 'text-blue-500', bg: 'bg-blue-100', to: '/support' },
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
    <div className="flex min-h-full flex-col bg-transparent pb-6">
      <div className="rounded-b-[2rem] bg-blue-600 px-4 pb-16 pt-8 text-white md:px-8 md:pb-20 md:pt-10">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">Welcome back,</h1>
            <p className="text-lg md:text-xl">{user?.username ?? 'Guest'}!</p>
          </div>
          <Link to="/profile">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm md:h-14 md:w-14">
              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username ?? 'Stacks'}`} alt="Avatar" className="h-10 w-10 rounded-full md:h-12 md:w-12" />
            </div>
          </Link>
        </div>
      </div>

      <div className="-mt-10 px-4 md:px-8">
        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
          <img 
            src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80" 
            alt="Banner" 
            className="h-40 w-full object-cover md:h-56"
          />
        </div>

        <div className="mb-8 grid grid-cols-4 gap-x-2 gap-y-6 rounded-xl bg-white p-4 shadow-sm sm:grid-cols-5 md:grid-cols-6 md:gap-4 md:p-6 lg:grid-cols-7">
          {menuItems.map((item, index) => {
            const content = (
              <>
                <div className={`mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full md:h-14 md:w-14 ${item.bg}`}>
                  <item.icon className={item.color} size={24} />
                </div>
                <span className="block text-center text-xs text-gray-600 md:text-sm">{item.label}</span>
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

        <h2 className="mb-4 text-lg font-bold text-gray-800 md:mb-6 md:text-2xl">VIP Levels</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4 xl:grid-cols-4">
          {vipLevels.map((vip) => (
            <div key={vip.level} className="flex items-center justify-between rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
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
