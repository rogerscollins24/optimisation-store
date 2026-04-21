import { useEffect, useState } from 'react';
import { Bell, ArrowDownToLine, ArrowUpFromLine, User, Link as LinkIcon, HeadphonesIcon, LogOut, ChevronRight, ChevronLeft, type LucideIcon } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { fetchVipLevels, findVipLevelConfig, getDefaultVipLevels, type VipLevelConfig } from '../lib/vipApi';

const DISPLAY = '"Bricolage Grotesque", ui-sans-serif';

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
  const { theme } = useTheme();
  const [vipLevels, setVipLevels] = useState<VipLevelConfig[]>(() => getDefaultVipLevels());
  const isDark = theme === 'dark';

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
      if (mounted) setVipLevels(data);
    };
    void load();
    return () => { mounted = false; };
  }, []);

  const menuSections: ProfileMenuSection[] = [
    {
      title: t('myFinancial'),
      items: [
        { icon: ArrowDownToLine, label: t('deposit'),    to: '/deposit',          iconColor: '#16a34a' },
        { icon: ArrowUpFromLine, label: t('withdrawal'), to: '/withdraw',         iconColor: '#ea580c' },
      ],
    },
    {
      title: t('myDetails'),
      items: [
        { icon: User,     label: t('personalInformation'), to: '/profile/personal', iconColor: '#b45309' },
        { icon: LinkIcon, label: t('bindWalletAddress'),   to: '/profile/wallet',   iconColor: '#7c3aed' },
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
          action: () => { logout(); navigate('/login'); },
        },
      ],
    },
  ];

  return (
    <div className="flex min-h-full flex-col pb-6" style={{ backgroundColor: 'transparent' }}>
      <div
        className="sticky top-0 z-10 flex items-center justify-between px-4 py-3.5 md:px-6"
        style={{
          background: isDark ? 'rgba(20,17,13,0.82)' : 'rgba(236,231,221,0.88)',
          backdropFilter: 'blur(14px)',
          borderBottom: isDark ? '1px solid rgba(120,103,82,0.28)' : '1px solid rgba(180,83,9,0.08)',
        }}
      >
        <Link
          to="/"
          className="flex h-9 w-9 items-center justify-center rounded-full text-lg font-medium transition-colors hover:bg-stone-200/60 dark:hover:bg-zinc-700/60"
          style={{ color: isDark ? '#d8cfc2' : '#6b6560', fontFamily: DISPLAY }}
          aria-label="Back to Home"
        >
          <ChevronLeft size={20} />
        </Link>
        <h1 className="text-sm font-bold text-stone-800 dark:text-stone-100 tracking-wide" style={{ fontFamily: DISPLAY }}>
          {t('profile')}
        </h1>
        <Link
          to="/notifications"
          className="relative flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-stone-200/60 dark:hover:bg-zinc-700/60"
          style={{ color: isDark ? '#d8cfc2' : '#6b6560' }}
          aria-label="Notifications"
        >
          {topBadgeCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 min-w-4 rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white leading-3.5 text-center">
              {topBadgeCount > 99 ? '99+' : topBadgeCount}
            </span>
          )}
          <Bell size={18} />
        </Link>
      </div>

      <div className="grid gap-5 p-4 md:p-6 lg:grid-cols-[1fr_1.2fr]">

        {/* Hero card — warm amber-terracotta gradient */}
        <div
          className="fade-up relative overflow-hidden rounded-2xl p-6 text-white"
          style={{
            background: 'linear-gradient(150deg, #b45309 0%, #7c2d12 55%, #4a1607 100%)',
            boxShadow: '0 8px 28px rgba(120,45,18,0.35)',
          }}
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: 'repeating-linear-gradient(0deg,#fff 0px,#fff 1px,transparent 1px,transparent 32px),repeating-linear-gradient(90deg,#fff 0px,#fff 1px,transparent 1px,transparent 32px)',
            }}
          />

          <div className="relative z-10 mb-5 flex items-center gap-4">
            <div
              className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full"
              style={{ border: '2px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.1)' }}
            >
              <img
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username ?? 'ShoppingOptimized'}`}
                alt={t('avatarAlt')}
                className="h-14 w-14 rounded-full"
              />
            </div>
            <div>
              <h2 className="mb-1.5 text-xl font-bold" style={{ fontFamily: DISPLAY }}>
                {user?.username ?? t('guest')}
              </h2>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="rounded-full px-2.5 py-0.5 text-xs font-bold"
                  style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', fontFamily: DISPLAY }}
                >
                  {t('vipBadge', { level: vipLevel })}
                </span>
                <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  {t('invitationCode')}: {user?.invite_code || t('notAvailable')}
                </span>
              </div>
            </div>
          </div>

          <div className="relative z-10 mb-5 space-y-1 text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
            <p>{user?.email || t('noEmailAddedYet')}</p>
            <p>{user?.phone || t('noPhoneAddedYet')}</p>
            <p>{t('wallet')}: <span className="text-white/80">{user?.wallet_address || t('notBoundYet')}</span></p>
          </div>

          <div className="relative z-10 mb-5">
            <div className="mb-2 flex justify-between text-xs font-semibold">
              <span style={{ color: 'rgba(255,255,255,0.6)' }}>{t('creditScore')}</span>
              <span className="text-white">{creditScore}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: 'rgba(255,255,255,0.15)' }}>
              <div
                className="h-1.5 rounded-full transition-all duration-700"
                style={{ width: `${creditScore}%`, background: 'rgba(255,255,255,0.7)' }}
              />
            </div>
          </div>

          <div className="relative z-10 grid grid-cols-3 gap-2">
            {[
              { label: t('totalBalance'),     value: balance.toFixed(2),           unit: 'USDT', highlight: balance < 0 },
              { label: t('commissionToday'),  value: commissionToday.toFixed(2),   unit: 'USDT', highlight: false },
              { label: t('remainingTasks'),   value: `${remainingTasks}`,          unit: `/ ${totalTasks}`, highlight: false },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl p-3"
                style={{ background: 'rgba(0,0,0,0.18)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <p className="mb-1 text-[9px] font-bold uppercase tracking-wider leading-tight" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: DISPLAY }}>
                  {stat.label}
                </p>
                <p className="tabular-nums text-base font-bold leading-none text-white" style={{ fontFamily: DISPLAY }}>
                  {stat.value}
                </p>
                <p className="mt-0.5 text-[10px]" style={{ color: 'rgba(255,255,255,0.45)' }}>{stat.unit}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Menu sections */}
        <div className="space-y-5">
          {menuSections.map((section, idx) => (
            <div key={idx} className="fade-up" style={{ animationDelay: `${idx * 0.05 + 0.1}s` }}>
              <h3
                className="ml-1 mb-2.5 text-[9px] font-bold uppercase tracking-widest"
                style={{ color: '#9c9288', fontFamily: DISPLAY }}
              >
                {section.title}
              </h3>
              <div
                className="overflow-hidden rounded-2xl"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: '0 1px 6px rgba(28,26,23,0.05)' }}
              >
                {section.items.map((item, itemIdx) => {
                  const content = (
                    <div className="flex items-center gap-3.5 px-4 py-3.5 transition-colors hover:bg-stone-50/80 dark:hover:bg-zinc-800/60 active:bg-stone-100/80 dark:active:bg-zinc-700/60">
                      <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                        style={{ background: `${item.iconColor}12` }}
                      >
                        <item.icon size={16} style={{ color: item.iconColor }} />
                      </div>
                      <span className="flex-1 text-sm font-semibold text-stone-700 dark:text-stone-200">{item.label}</span>
                      {item.badge && (
                        <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[10px] font-bold text-white">
                          {item.badge}
                        </span>
                      )}
                      <ChevronRight size={15} className="shrink-0 text-stone-300 dark:text-stone-600" />
                    </div>
                  );

                  return (
                    <div key={itemIdx} style={itemIdx !== section.items.length - 1 ? { borderBottom: '1px solid var(--border-faint)' } : {}}>
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
