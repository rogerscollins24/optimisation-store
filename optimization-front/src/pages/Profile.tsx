import { useEffect, useState } from 'react';
import { Bell, ArrowDownToLine, ArrowUpFromLine, User, Link as LinkIcon, HeadphonesIcon, LogOut, ChevronRight, type LucideIcon } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { fetchVipLevels, findVipLevelConfig, getDefaultVipLevels, type VipLevelConfig } from '../lib/vipApi';

type ProfileMenuItem = {
  icon: LucideIcon;
  label: string;
  iconColor: string;
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
        { icon: ArrowDownToLine, label: t('deposit'), to: '/deposit', iconColor: '#16a34a' },
        { icon: ArrowUpFromLine, label: t('withdrawal'), to: '/withdraw', iconColor: '#ea580c' },
      ],
    },
    {
      title: t('myDetails'),
      items: [
        { icon: User, label: t('personalInformation'), to: '/profile/personal', iconColor: '#b45309' },
        { icon: LinkIcon, label: t('bindWalletAddress'), to: '/profile/wallet', iconColor: '#7c3aed' },
      ],
    },
    {
      title: t('otherSection'),
      items: [
        {
          icon: HeadphonesIcon,
          label: t('contactUs'),
          to: '/support',
          iconColor: '#0d9488',
          badge: supportUnreadCount > 0 ? `${supportUnreadCount}` : null,
        },
        {
          icon: Bell,
          label: t('notificationsTitle'),
          to: '/notifications',
          iconColor: '#ca8a04',
          badge: notificationCount > 0 ? `${notificationCount}` : null,
        },
        {
          icon: LogOut,
          label: t('logout'),
          iconColor: '#dc2626',
          action: () => {
            logout();
            navigate('/login');
          },
        },
      ],
    },
  ];

  return (
    <div className="flex min-h-full flex-col pb-6" style={{ backgroundColor: '#ece7dd' }}>
      {/* Top bar */}
      <div
        className="sticky top-0 z-10 flex items-center justify-between px-4 py-4 md:px-6"
        style={{ background: 'rgba(236,231,221,0.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(180,83,9,0.1)' }}
      >
        <Link to="/" className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-stone-200/70" style={{ color: '#6b6560' }}>
          ←
        </Link>
        <h1 className="text-base font-bold text-stone-800" style={{ fontFamily: '"Syne", ui-sans-serif' }}>
          {t('profile')}
        </h1>
        <Link to="/notifications" className="relative flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-stone-200/70" style={{ color: '#6b6560' }}>
          {topBadgeCount > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 min-w-4 rounded-full bg-rose-500 px-1 py-0.5 text-[9px] font-bold text-white">
              {topBadgeCount > 99 ? '99+' : topBadgeCount}
            </span>
          ) : null}
          <Bell size={20} />
        </Link>
      </div>

      <div className="grid gap-5 p-4 md:p-6 lg:grid-cols-[1fr_1.2fr]">
        {/* Hero card */}
        <div
          className="relative overflow-hidden rounded-2xl p-6 text-white"
          style={{
            background: 'linear-gradient(150deg, #2d2720 0%, #1a1410 60%, #0f0c08 100%)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.32)',
          }}
        >
          {/* Decorative circles */}
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-25"
               style={{ background: 'radial-gradient(circle, #d97706 0%, transparent 70%)' }} />
          <div className="pointer-events-none absolute -bottom-8 -left-8 h-28 w-28 rounded-full opacity-15"
               style={{ background: 'radial-gradient(circle, #b45309 0%, transparent 70%)' }} />

          {/* Avatar + username */}
          <div className="relative z-10 mb-5 flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full"
                 style={{ border: '2px solid rgba(180,83,9,0.4)', background: 'rgba(180,83,9,0.12)' }}>
              <img
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username ?? 'ShoppingOptimized'}`}
                alt={t('avatarAlt')}
                className="h-14 w-14 rounded-full"
              />
            </div>
            <div>
              <h2 className="mb-1.5 text-xl font-bold" style={{ fontFamily: '"Syne", ui-sans-serif' }}>
                {user?.username ?? t('guest')}
              </h2>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="rounded-full px-2.5 py-0.5 text-xs font-bold"
                      style={{ background: 'linear-gradient(135deg, #d97706, #b45309)', color: '#fff' }}>
                  {t('vipBadge', { level: vipLevel })}
                </span>
                <span className="text-xs" style={{ color: '#8a7d70' }}>
                  {t('invitationCode')}: {user?.invite_code || t('notAvailable')}
                </span>
              </div>
            </div>
          </div>

          {/* Contact info */}
          <div className="relative z-10 mb-5 space-y-1 text-sm" style={{ color: '#8a7d70' }}>
            <p>{user?.email || t('noEmailAddedYet')}</p>
            <p>{user?.phone || t('noPhoneAddedYet')}</p>
            <p>{t('wallet')}: {user?.wallet_address || t('notBoundYet')}</p>
          </div>

          {/* Credit score */}
          <div className="relative z-10 mb-5">
            <div className="mb-2 flex justify-between text-xs font-semibold">
              <span style={{ color: '#8a7d70' }}>{t('creditScore')}</span>
              <span style={{ color: '#d97706' }}>{creditScore}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <div
                className="h-1.5 rounded-full transition-all duration-700"
                style={{ width: `${creditScore}%`, background: 'linear-gradient(90deg, #d97706, #f59e0b)' }}
              />
            </div>
          </div>

          {/* Stats row */}
          <div className="relative z-10 grid grid-cols-3 gap-2.5">
            <div className="rounded-xl p-3"
                 style={{ background: balance >= 0 ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', border: `1px solid ${balance >= 0 ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#8a7d70', fontFamily: '"Syne", ui-sans-serif' }}>{t('totalBalance')}</p>
              <p className="text-base font-bold" style={{ color: balance >= 0 ? '#6ee7b7' : '#fca5a5' }}>
                {balance.toFixed(2)} <span className="text-[10px] font-normal opacity-70">USDT</span>
              </p>
            </div>
            <div className="rounded-xl p-3"
                 style={{ background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.18)' }}>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#8a7d70', fontFamily: '"Syne", ui-sans-serif' }}>{t('commissionToday')}</p>
              <p className="text-base font-bold text-violet-300">
                {commissionToday.toFixed(2)} <span className="text-[10px] font-normal opacity-70">USDT</span>
              </p>
            </div>
            <div className="rounded-xl p-3"
                 style={{ background: 'rgba(180,83,9,0.1)', border: '1px solid rgba(180,83,9,0.2)' }}>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#8a7d70', fontFamily: '"Syne", ui-sans-serif' }}>{t('remainingTasks')}</p>
              <p className="text-base font-bold" style={{ color: '#fbbf24' }}>
                {remainingTasks} <span className="text-[10px] font-normal opacity-70">/ {totalTasks}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Menu sections */}
        <div className="space-y-5">
          {menuSections.map((section, idx) => (
            <div key={idx}>
              <h3 className="ml-1 mb-2.5 text-[10px] font-bold uppercase tracking-widest text-stone-500"
                  style={{ fontFamily: '"Syne", ui-sans-serif' }}>
                {section.title}
              </h3>
              <div className="overflow-hidden rounded-2xl" style={{ background: '#faf8f4', border: '1px solid #ddd8d0', boxShadow: '0 1px 8px rgba(28,26,23,0.06)' }}>
                {section.items.map((item, itemIdx) => {
                  const content = (
                    <div className="flex items-center gap-3.5 px-4 py-3.5 transition-colors hover:bg-stone-50/80">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                           style={{ background: `${item.iconColor}14` }}>
                        <item.icon size={17} style={{ color: item.iconColor }} />
                      </div>
                      <span className="flex-1 text-sm font-semibold text-stone-700">{item.label}</span>
                      {item.badge ? (
                        <span className="rounded-full px-2 py-0.5 text-[11px] font-bold text-white"
                              style={{ background: '#ef4444' }}>
                          {item.badge}
                        </span>
                      ) : null}
                      <ChevronRight size={16} className="text-stone-300 shrink-0" />
                    </div>
                  );

                  return (
                    <div key={itemIdx} style={itemIdx !== section.items.length - 1 ? { borderBottom: '1px solid #f0ece5' } : {}}>
                      {item.to ? (
                        <Link to={item.to} className="block">{content}</Link>
                      ) : (
                        <button type="button" onClick={item.action} className="block w-full cursor-pointer text-left">{content}</button>
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
