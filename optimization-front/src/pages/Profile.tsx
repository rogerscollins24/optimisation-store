import { useEffect, useState } from 'react';
import { Bell, ArrowDownToLine, ArrowUpFromLine, User, Link as LinkIcon, HeadphonesIcon, LogOut, ChevronLeft, type LucideIcon } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { fetchVipLevels, findVipLevelConfig, getDefaultVipLevels, type VipLevelConfig } from '../lib/vipApi';

type ProfileMenuItem = {
  icon: LucideIcon;
  label: string;
  color: string;
  bg: string;
  to?: string;
  action?: () => void;
  badge?: string | null;
};

type ProfileMenuSection = {
  title: string;
  items: ProfileMenuItem[];
};

export default function Profile() {
  const navigate = useNavigate();
  const { user, logout, notificationCount, supportUnreadCount } = useAuth();
  const { t } = useTranslation();
  const [vipLevels, setVipLevels] = useState<VipLevelConfig[]>(() => getDefaultVipLevels());

  const balance = user?.balance ?? 0;
  const commissionToday = user?.commission_today ?? 0;
  const vipLevel = user?.vip_level ?? 1;
  const vipConfig = findVipLevelConfig(vipLevel, vipLevels);
  const creditScore = user?.credit_score ?? 100;
  const totalTasks = user?.tasks_per_set ?? vipConfig.tasks_per_set;
  const remainingTasks = user?.remaining_tasks ?? Math.max(totalTasks - (user?.tasks_completed_in_set ?? 0), 0);
  const topBadgeCount = notificationCount + supportUnreadCount;

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const data = await fetchVipLevels();
      if (mounted) {
        setVipLevels(data);
      }
    };
    void load();
    return () => {
      mounted = false;
    };
  }, []);

  const menuSections: ProfileMenuSection[] = [
    {
      title: t('myFinancial'),
      items: [
        { icon: ArrowDownToLine, label: t('deposit'), to: '/deposit', color: 'text-green-500', bg: 'bg-green-100' },
        { icon: ArrowUpFromLine, label: t('withdrawal'), to: '/withdraw', color: 'text-orange-500', bg: 'bg-orange-100' },
      ],
    },
    {
      title: t('myDetails'),
      items: [
        { icon: User, label: t('personalInformation'), to: '/profile/personal', color: 'text-blue-500', bg: 'bg-blue-100' },
        { icon: LinkIcon, label: t('bindWalletAddress'), to: '/profile/wallet', color: 'text-purple-500', bg: 'bg-purple-100' },
      ],
    },
    {
      title: t('otherSection'),
      items: [
        { icon: HeadphonesIcon, label: t('contactUs'), to: '/support', color: 'text-teal-500', bg: 'bg-teal-100', badge: supportUnreadCount > 0 ? `${supportUnreadCount}` : null },
        { icon: Bell, label: t('notificationsTitle'), to: '/notifications', color: 'text-yellow-500', bg: 'bg-yellow-100', badge: notificationCount > 0 ? `${notificationCount}` : null },
        { icon: LogOut, label: t('logout'), color: 'text-red-500', bg: 'bg-red-100', action: () => { logout(); navigate('/login'); } },
      ],
    },
  ];

  return (
    <div className="client-page flex min-h-full flex-col pb-6">
      <div className="client-header sticky top-0 z-10 flex items-center justify-between rounded-xl p-3 sm:p-4 md:p-5">
        <Link to="/" className="text-zinc-300 hover:text-white">
          <ChevronLeft size={24} />
        </Link>
        <h1 className="text-base font-bold text-[#f7efe4] sm:text-lg">{t('profile')}</h1>
        <Link to="/notifications" className="relative text-zinc-300 hover:text-white">
          {topBadgeCount > 0 ? (
            <span className="absolute -right-2 -top-2 min-w-[18px] rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
              {topBadgeCount > 99 ? '99+' : topBadgeCount}
            </span>
          ) : null}
          <Bell size={24} />
        </Link>
      </div>

      <div className="grid gap-4 p-3 sm:gap-6 sm:p-4 md:p-6 lg:grid-cols-[1fr_1.2fr]">
        <div className="client-card-dark relative mb-0 overflow-hidden rounded-2xl p-6 shadow-lg">
          <div className="absolute right-0 top-0 h-32 w-32 -mr-16 -mt-16 rounded-full bg-white/10 blur-2xl"></div>
          <div className="absolute bottom-0 left-0 h-24 w-24 -mb-12 -ml-12 rounded-full bg-white/10 blur-xl"></div>

          <div className="relative z-10 mb-6 flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-white/30 bg-white/20 backdrop-blur-sm">
              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username ?? 'ShoppingOptimized'}`} alt={t('avatarAlt')} className="h-14 w-14 rounded-full" />
            </div>
            <div>
              <h2 className="mb-1 text-lg font-bold sm:text-xl">{user?.username ?? t('guest')}</h2>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="rounded-full bg-amber-300 px-2 py-0.5 text-xs font-bold text-amber-900">{t('vipBadge', { level: vipLevel })}</span>
                <span className="opacity-80 text-amber-50/85">{t('invitationCode')}: {user?.invite_code || t('notAvailable')}</span>
              </div>
            </div>
          </div>

          <div className="relative z-10 mb-6 text-sm text-amber-50/85">
            <p>{user?.email || t('noEmailAddedYet')}</p>
            <p className="mt-1">{user?.phone || t('noPhoneAddedYet')}</p>
            <p className="mt-1">{t('wallet')}: {user?.wallet_address || t('notBoundYet')}</p>
          </div>

          <div className="relative z-10 mb-6">
            <div className="mb-2 flex justify-between text-sm">
              <span className="opacity-80">{t('creditScore')}</span>
              <span className="font-bold">{creditScore}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/20">
              <div className="h-2 rounded-full bg-green-400 transition-all duration-500" style={{ width: `${creditScore}%` }}></div>
            </div>
          </div>

          <div className="relative z-10 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            <div className={`rounded-xl border p-3 backdrop-blur-sm ${balance >= 0 ? 'border-emerald-200/30 bg-emerald-500/20' : 'border-rose-200/30 bg-rose-500/20'}`}>
              <p className="mb-1 text-xs opacity-80">{t('totalBalance')}</p>
              <p className={`text-lg font-bold ${balance >= 0 ? 'text-emerald-100' : 'text-rose-100'}`}>{balance.toFixed(2)} <span className="text-xs font-normal">USDT</span></p>
            </div>
            <div className="rounded-xl border border-violet-200/30 bg-violet-500/20 p-3 backdrop-blur-sm">
              <p className="mb-1 text-xs opacity-80">{t('commissionToday')}</p>
              <p className="text-lg font-bold text-violet-50">{commissionToday.toFixed(2)} <span className="text-xs font-normal">USDT</span></p>
            </div>
            <div className="rounded-xl border border-cyan-200/30 bg-cyan-500/20 p-3 backdrop-blur-sm">
              <p className="mb-1 text-xs opacity-80">{t('remainingTasks')}</p>
              <p className="text-lg font-bold text-cyan-50">{remainingTasks} <span className="text-xs font-normal">/ {totalTasks}</span></p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {menuSections.map((section, idx) => (
            <div key={idx}>
              <h3 className="ml-2 mb-3 text-sm font-bold uppercase tracking-wider text-[#6e5f4c]">{section.title}</h3>
              <div className="client-card overflow-hidden rounded-2xl">
                {section.items.map((item, itemIdx) => {
                  const content = (
                    <div className="flex items-center gap-3 p-4 transition-colors hover:bg-white/70">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-full ${item.bg}`}>
                        <item.icon className={item.color} size={20} />
                      </div>
                      <span className="flex-1 font-medium text-[#382f26]">{item.label}</span>
                      {item.badge ? (
                        <span className="rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-600">{item.badge}</span>
                      ) : null}
                      <ChevronLeft className="rotate-180 text-[#85735f]" size={20} />
                    </div>
                  );

                  return (
                    <div key={itemIdx} className={itemIdx !== section.items.length - 1 ? 'border-b border-[#d9cdbd]' : ''}>
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
