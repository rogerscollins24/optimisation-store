import { Link } from 'react-router-dom';
import { HeadphonesIcon, Gift, ArrowDownToLine, ArrowUpFromLine, FileText, Award, HelpCircle, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { BrandHomeIcon } from '../components/BrandIcons';

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
    {
      level: 1,
      amount: '100 USDT',
      commission: '0.5%',
      comboProfit: '3%',
      tasks: 40,
      bg: 'bg-[#426b82]',
      badge: 'from-amber-300 to-yellow-500',
    },
    {
      level: 2,
      amount: '500 USDT',
      commission: '1%',
      comboProfit: '6%',
      tasks: 45,
      bg: 'bg-[#155fd7]',
      badge: 'from-slate-200 to-indigo-200',
    },
    {
      level: 3,
      amount: '2000 USDT',
      commission: '1.5%',
      comboProfit: '9%',
      tasks: 50,
      bg: 'bg-[#f2a622]',
      badge: 'from-yellow-300 to-orange-500',
    },
    {
      level: 4,
      amount: '5000 USDT',
      commission: '2%',
      comboProfit: '12%',
      tasks: 55,
      bg: 'bg-[#7a1fb0]',
      badge: 'from-fuchsia-300 to-violet-500',
    },
  ];

  return (
    <div className="canvas-texture flex min-h-full flex-col pb-6">
      <div className="px-4 pt-5 md:px-8 md:pt-6">
        <div className="mb-5 flex items-center justify-between rounded-2xl bg-white/80 px-4 py-4 shadow-sm backdrop-blur-sm">
          <div>
            <div className="flex items-center gap-2">
              <BrandHomeIcon size={24} className="text-slate-900" />
              <h1 className="text-xl font-bold leading-tight text-slate-900 md:text-2xl">Shopping Optimized</h1>
            </div>
            <p className="mt-1 text-sm font-medium text-slate-600">👋 Welcome back, {user?.username ?? 'Guest'}!</p>
          </div>
          <Link to="/profile">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 md:h-14 md:w-14">
              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username ?? 'ShoppingOptimized'}`} alt="Avatar" className="h-10 w-10 rounded-full md:h-12 md:w-12" />
            </div>
          </Link>
        </div>

        <div className="overflow-hidden rounded-[28px] shadow-lg">
          <video
            autoPlay
            muted
            loop
            playsInline
            poster="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80"
            className="h-44 w-full object-cover md:h-60"
          >
            <source src="https://videos.pexels.com/video-files/7565438/7565438-hd_1920_1080_25fps.mp4" type="video/mp4" />
          </video>
        </div>

        <div className="mt-4 rounded-[26px] bg-[#2f2f31] px-3 py-4 text-white shadow-md md:px-4 md:py-5">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white/90">
            <span>Menu</span>
            <span className="text-cyan-400">List</span>
          </div>
          <div className="grid grid-cols-4 gap-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7">
            {menuItems.map((item, index) => {
              const content = (
                <>
                  <div className={`mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-[#3d3d40] shadow-inner ${item.bg}`}>
                    <item.icon className={item.color} size={20} strokeWidth={1.8} />
                  </div>
                  <span className="block text-center text-[11px] font-semibold text-cyan-400 md:text-xs">{item.label}</span>
                </>
              );

              return item.to ? (
                <Link key={index} to={item.to} className="rounded-xl bg-[#38383b] p-3 transition-transform duration-200 hover:-translate-y-0.5">
                  {content}
                </Link>
              ) : (
                <div key={index} className="cursor-pointer rounded-xl bg-[#38383b] p-3 transition-transform duration-200 hover:-translate-y-0.5">
                  {content}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="px-4 pt-5 md:px-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800 md:text-2xl">VIP Levels</h2>
          <button type="button" className="inline-flex items-center gap-1 text-sm font-semibold text-sky-500">
            View More <ChevronRight size={16} />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {vipLevels.map((vip) => (
            <div key={vip.level} className={`rounded-2xl px-4 py-3.5 text-white shadow-md ${vip.bg}`}>
              <div className="mb-2 flex items-center gap-2">
                <div className={`flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br ${vip.badge} text-[10px] font-bold text-white shadow-inner`}>
                  VIP{vip.level}
                </div>
                <h3 className="text-xl font-bold leading-none">VIP{vip.level}</h3>
              </div>
              <ul className="space-y-1 text-[13px] leading-5 text-white/95">
                <li>• Receive {vip.tasks} optimization tasks per set.</li>
                <li>• Each task earns {vip.commission} profit.</li>
                <li>• Combined profit reaches {vip.comboProfit}.</li>
                <li>• Activate with {vip.amount}.</li>
                <li>• Up to 3 sets can be completed daily.</li>
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
