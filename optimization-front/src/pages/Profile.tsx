import { Bell, ArrowDownToLine, ArrowUpFromLine, User, Link as LinkIcon, HeadphonesIcon, LogOut, ChevronLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const taskTotalsByVip: Record<number, number> = {
  1: 40,
  2: 45,
  3: 50,
  4: 55,
};

export default function Profile() {
  const navigate = useNavigate();
  const { user, logout, notificationCount, supportUnreadCount } = useAuth();

  const balance = user?.balance ?? 0;
  const commissionToday = user?.commission_today ?? 0;
  const vipLevel = user?.vip_level ?? 1;
  const creditScore = user?.credit_score ?? 100;
  const totalTasks = user?.tasks_per_set ?? taskTotalsByVip[vipLevel] ?? 60;
  const remainingTasks = user?.remaining_tasks ?? Math.max(totalTasks - (user?.tasks_completed_in_set ?? 0), 0);
  const topBadgeCount = notificationCount + supportUnreadCount;

  const menuSections = [
    {
      title: 'My Financial',
      items: [
        { icon: ArrowDownToLine, label: 'Deposit', to: '/deposit', color: 'text-green-500', bg: 'bg-green-100' },
        { icon: ArrowUpFromLine, label: 'Withdraw', to: '/withdraw', color: 'text-orange-500', bg: 'bg-orange-100' },
      ],
    },
    {
      title: 'My Details',
      items: [
        { icon: User, label: 'Personal Information', to: '/profile/personal', color: 'text-blue-500', bg: 'bg-blue-100' },
        { icon: LinkIcon, label: 'Bind Wallet Address', to: '/profile/wallet', color: 'text-purple-500', bg: 'bg-purple-100' },
      ],
    },
    {
      title: 'Other',
      items: [
        { icon: HeadphonesIcon, label: 'Contact Us', to: '/support', color: 'text-teal-500', bg: 'bg-teal-100', badge: supportUnreadCount > 0 ? `${supportUnreadCount} new` : null },
        { icon: Bell, label: 'Notifications', to: '/notifications', color: 'text-yellow-500', bg: 'bg-yellow-100', badge: notificationCount > 0 ? `${notificationCount}` : null },
        { icon: LogOut, label: 'Logout', color: 'text-red-500', bg: 'bg-red-100', action: () => { logout(); navigate('/login'); } },
      ],
    },
  ];

  return (
    <div className="flex min-h-full flex-col bg-gray-50 pb-6">
      <div className="sticky top-0 z-10 flex items-center justify-between rounded-xl bg-white p-4 shadow-sm md:p-5">
        <Link to="/" className="text-gray-600 hover:text-gray-900">
          <ChevronLeft size={24} />
        </Link>
        <h1 className="text-lg font-bold text-gray-800">Profile</h1>
        <Link to="/notifications" className="relative text-gray-600 hover:text-gray-900">
          {topBadgeCount > 0 ? (
            <span className="absolute -right-2 -top-2 min-w-[18px] rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
              {topBadgeCount > 99 ? '99+' : topBadgeCount}
            </span>
          ) : null}
          <Bell size={24} />
        </Link>
      </div>

      <div className="grid gap-6 p-4 md:p-6 lg:grid-cols-[1fr_1.2fr]">
        <div className="relative mb-0 overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-6 text-white shadow-lg">
          <div className="absolute right-0 top-0 h-32 w-32 -mr-16 -mt-16 rounded-full bg-white/10 blur-2xl"></div>
          <div className="absolute bottom-0 left-0 h-24 w-24 -mb-12 -ml-12 rounded-full bg-white/10 blur-xl"></div>

          <div className="relative z-10 mb-6 flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-white/30 bg-white/20 backdrop-blur-sm">
              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username ?? 'ShoppingOptimized'}`} alt="Avatar" className="h-14 w-14 rounded-full" />
            </div>
            <div>
              <h2 className="mb-1 text-xl font-bold">{user?.username ?? 'Guest'}</h2>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="rounded-full bg-yellow-400 px-2 py-0.5 text-xs font-bold text-yellow-900">VIP {vipLevel}</span>
                <span className="opacity-80">Invitation Code: {user?.invite_code || 'N/A'}</span>
              </div>
            </div>
          </div>

          <div className="relative z-10 mb-6 text-sm text-blue-50">
            <p>{user?.email || 'No email added yet'}</p>
            <p className="mt-1">{user?.phone || 'No phone added yet'}</p>
            <p className="mt-1">Wallet: {user?.wallet_address || 'Not bound yet'}</p>
          </div>

          <div className="relative z-10 mb-6">
            <div className="mb-2 flex justify-between text-sm">
              <span className="opacity-80">Credit Score</span>
              <span className="font-bold">{creditScore}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/20">
              <div className="h-2 rounded-full bg-green-400 transition-all duration-500" style={{ width: `${creditScore}%` }}></div>
            </div>
          </div>

          <div className="relative z-10 grid gap-3 md:grid-cols-3">
            <div className={`rounded-xl border p-3 backdrop-blur-sm ${balance >= 0 ? 'border-emerald-200/30 bg-emerald-500/20' : 'border-rose-200/30 bg-rose-500/20'}`}>
              <p className="mb-1 text-xs opacity-80">Total Balance</p>
              <p className={`text-lg font-bold ${balance >= 0 ? 'text-emerald-100' : 'text-rose-100'}`}>{balance.toFixed(2)} <span className="text-xs font-normal">USDT</span></p>
            </div>
            <div className="rounded-xl border border-violet-200/30 bg-violet-500/20 p-3 backdrop-blur-sm">
              <p className="mb-1 text-xs opacity-80">Commission Today</p>
              <p className="text-lg font-bold text-violet-50">{commissionToday.toFixed(2)} <span className="text-xs font-normal">USDT</span></p>
            </div>
            <div className="rounded-xl border border-cyan-200/30 bg-cyan-500/20 p-3 backdrop-blur-sm">
              <p className="mb-1 text-xs opacity-80">Remaining Tasks</p>
              <p className="text-lg font-bold text-cyan-50">{remainingTasks} <span className="text-xs font-normal">/ {totalTasks}</span></p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {menuSections.map((section, idx) => (
            <div key={idx}>
              <h3 className="ml-2 mb-3 text-sm font-bold uppercase tracking-wider text-gray-500">{section.title}</h3>
              <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                {section.items.map((item, itemIdx) => {
                  const content = (
                    <div className="flex items-center gap-3 p-4 transition-colors hover:bg-gray-50">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-full ${item.bg}`}>
                        <item.icon className={item.color} size={20} />
                      </div>
                      <span className="flex-1 font-medium text-gray-700">{item.label}</span>
                      {item.badge ? (
                        <span className="rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-600">{item.badge}</span>
                      ) : null}
                      <ChevronLeft className="rotate-180 text-gray-400" size={20} />
                    </div>
                  );

                  return (
                    <div key={itemIdx} className={itemIdx !== section.items.length - 1 ? 'border-b border-gray-50' : ''}>
                      {item.to ? (
                        <Link to={item.to} className="block">
                          {content}
                        </Link>
                      ) : (
                        <button type="button" onClick={item.action} className="block w-full cursor-pointer text-left">
                          {content}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
