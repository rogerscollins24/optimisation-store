import { Bell, Wallet, ArrowDownToLine, ArrowUpFromLine, User, Link as LinkIcon, HeadphonesIcon, LogOut, ChevronLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const balance = user?.balance ?? 0;
  const commissionToday = user?.commission_today ?? 0;
  const vipLevel = user?.vip_level ?? 1;
  const creditScore = user?.credit_score ?? 100;

  const menuSections = [
    {
      title: 'My Financial',
      items: [
        { icon: ArrowDownToLine, label: 'Deposit', to: '/deposit', color: 'text-green-500', bg: 'bg-green-100' },
        { icon: ArrowUpFromLine, label: 'Withdraw', to: '/withdraw', color: 'text-orange-500', bg: 'bg-orange-100' },
      ]
    },
    {
      title: 'My Details',
      items: [
        { icon: User, label: 'Personal Information', color: 'text-blue-500', bg: 'bg-blue-100' },
        { icon: LinkIcon, label: 'Bind Wallet Address', color: 'text-purple-500', bg: 'bg-purple-100' },
      ]
    },
    {
      title: 'Other',
      items: [
        { icon: HeadphonesIcon, label: 'Contact Us', color: 'text-teal-500', bg: 'bg-teal-100' },
        { icon: Bell, label: 'Notifications', color: 'text-yellow-500', bg: 'bg-yellow-100' },
        { icon: LogOut, label: 'Logout', color: 'text-red-500', bg: 'bg-red-100', action: () => { logout(); navigate('/login'); } },
      ]
    }
  ];

  return (
    <div className="flex flex-col min-h-full bg-gray-50 pb-6">
      <div className="flex justify-between items-center p-4 bg-white shadow-sm sticky top-0 z-10">
        <Link to="/" className="text-gray-600 hover:text-gray-900">
          <ChevronLeft size={24} />
        </Link>
        <h1 className="text-lg font-bold text-gray-800">Profile</h1>
        <Bell className="text-gray-600" size={24} />
      </div>

      <div className="p-4">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12 blur-xl"></div>

          <div className="flex items-center gap-4 mb-6 relative z-10">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30 overflow-hidden">
              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username ?? 'Stacks'}`} alt="Avatar" className="w-14 h-14 rounded-full" />
            </div>
            <div>
              <h2 className="text-xl font-bold mb-1">{user?.username ?? 'Guest'}</h2>
              <div className="flex items-center gap-2 text-sm">
                <span className="bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded-full font-bold text-xs">VIP {vipLevel}</span>
                <span className="opacity-80">Invitation Code: {user?.invite_code || 'N/A'}</span>
              </div>
            </div>
          </div>

          <div className="mb-6 relative z-10">
            <div className="flex justify-between text-sm mb-2">
              <span className="opacity-80">Credit Score</span>
              <span className="font-bold">{creditScore}%</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
              <div className="bg-green-400 h-2 rounded-full transition-all duration-500" style={{ width: `${creditScore}%` }}></div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 relative z-10">
            <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm border border-white/20">
              <p className="text-xs opacity-80 mb-1">Total Balance</p>
              <p className="text-lg font-bold">{balance.toFixed(2)} <span className="text-xs font-normal">USDT</span></p>
            </div>
            <div className="bg-white/10 p-3 rounded-xl backdrop-blur-sm border border-white/20">
              <p className="text-xs opacity-80 mb-1">Commission Today</p>
              <p className="text-lg font-bold">{commissionToday.toFixed(2)} <span className="text-xs font-normal">USDT</span></p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {menuSections.map((section, idx) => (
            <div key={idx}>
              <h3 className="text-sm font-bold text-gray-500 mb-3 ml-2 uppercase tracking-wider">{section.title}</h3>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {section.items.map((item, itemIdx) => {
                  const content = (
                    <div className="flex items-center p-4 hover:bg-gray-50 transition-colors">
                      <div className={`w-10 h-10 rounded-full ${item.bg} flex items-center justify-center mr-4`}>
                        <item.icon className={item.color} size={20} />
                      </div>
                      <span className="flex-1 font-medium text-gray-700">{item.label}</span>
                      <ChevronLeft className="text-gray-400 rotate-180" size={20} />
                    </div>
                  );

                  return (
                    <div key={itemIdx} className={itemIdx !== section.items.length - 1 ? 'border-b border-gray-50' : ''}>
                      {item.to ? (
                        <Link to={item.to} className="block">
                          {content}
                        </Link>
                      ) : (
                        <button type="button" onClick={item.action} className="cursor-pointer block w-full text-left">
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
