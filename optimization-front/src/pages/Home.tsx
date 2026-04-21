import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, HeadphonesIcon, Gift, ArrowDownToLine, ArrowUpFromLine, FileText, Award, HelpCircle, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { BrandHomeIcon } from '../components/BrandIcons';
import { useTheme } from '../context/ThemeContext';
import { fetchVipLevels, getDefaultVipLevels, type VipLevelConfig } from '../lib/vipApi';

const DISPLAY = '"Bricolage Grotesque", ui-sans-serif';

export default function Home() {
  const { user, notificationCount } = useAuth();
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const [vipLevelConfig, setVipLevelConfig] = useState<VipLevelConfig[]>(() => getDefaultVipLevels());
  const isDark = theme === 'dark';

  const menuItems = useMemo(
    () => [
      { icon: HeadphonesIcon, labelKey: 'service',    iconColor: 'text-cyan-300',    iconShell: 'border-cyan-400/45 bg-cyan-500/12 shadow-[0_0_22px_rgba(34,211,238,0.35)]',    to: '/support'  },
      { icon: Gift,           labelKey: 'event',      iconColor: 'text-fuchsia-300', iconShell: 'border-fuchsia-400/45 bg-fuchsia-500/12 shadow-[0_0_22px_rgba(232,121,249,0.35)]' },
      { icon: ArrowUpFromLine,labelKey: 'withdrawal', iconColor: 'text-amber-300',   iconShell: 'border-amber-400/45 bg-amber-500/12 shadow-[0_0_22px_rgba(251,191,36,0.35)]',   to: '/withdraw' },
      { icon: ArrowDownToLine,labelKey: 'deposit',    iconColor: 'text-emerald-300', iconShell: 'border-emerald-400/45 bg-emerald-500/12 shadow-[0_0_22px_rgba(52,211,153,0.35)]', to: '/deposit' },
      { icon: FileText,       labelKey: 'terms',      iconColor: 'text-indigo-300',  iconShell: 'border-indigo-400/45 bg-indigo-500/12 shadow-[0_0_22px_rgba(129,140,248,0.35)]' },
      { icon: Award,          labelKey: 'certificate',iconColor: 'text-yellow-300',  iconShell: 'border-yellow-400/45 bg-yellow-500/12 shadow-[0_0_22px_rgba(250,204,21,0.35)]' },
      { icon: HelpCircle,     labelKey: 'faqs',       iconColor: 'text-violet-300',  iconShell: 'border-violet-400/45 bg-violet-500/12 shadow-[0_0_22px_rgba(167,139,250,0.35)]', to: '/faqs' },
    ],
    [],
  );

  const vipLevels = useMemo(
    () =>
      vipLevelConfig.map((item) => ({
        level: item.level,
        amount: `${item.activation_amount} USDT`,
        commission: `${item.commission_rate}%`,
        comboProfit: `${item.combo_rate}%`,
        tasks: item.tasks_per_set,
        style:
          item.level === 1
            ? { accent: '#4878a0', label: t('vipTierSteel') }
            : item.level === 2
            ? { accent: '#2c5fa8', label: t('vipTierSapphire') }
            : item.level === 3
            ? { accent: '#a06820', label: t('vipTierGold') }
            : { accent: '#6b38b0', label: t('vipTierDiamond') },
      })),
    [i18n.resolvedLanguage, i18n.language, t, vipLevelConfig],
  );

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const data = await fetchVipLevels();
      if (mounted) setVipLevelConfig(data);
    };
    void load();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="canvas-texture flex min-h-full flex-col overflow-x-hidden pb-8">
      <div className="px-4 pt-5 md:px-8 md:pt-6">

        {/* Header card */}
        <div
          className="fade-up relative z-20 mb-5 overflow-hidden rounded-[28px] px-4 py-4 md:px-5"
          style={{
            background: isDark
              ? 'linear-gradient(145deg, rgba(37,31,24,0.96) 0%, rgba(25,22,18,0.98) 100%)'
              : 'linear-gradient(145deg, rgba(250,248,244,0.98) 0%, rgba(243,237,228,0.98) 100%)',
            border: isDark ? '1px solid rgba(120,103,82,0.36)' : '1px solid rgba(196,178,154,0.38)',
            boxShadow: isDark ? '0 16px 36px rgba(0,0,0,0.32)' : '0 16px 36px rgba(28,26,23,0.08)',
          }}
        >
          <div className="absolute inset-x-6 top-0 h-px" style={{ background: isDark ? 'linear-gradient(90deg, transparent 0%, rgba(212,188,148,0.2) 50%, transparent 100%)' : 'linear-gradient(90deg, transparent 0%, rgba(180,83,9,0.28) 50%, transparent 100%)' }} />
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="mb-2 inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.26em]"
                style={{ background: isDark ? 'rgba(212,188,148,0.12)' : 'rgba(180,83,9,0.08)', color: isDark ? '#d4bc94' : '#8a4b12', fontFamily: DISPLAY }}>
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: '#b45309' }} />
                {t('vipBadge', { level: user?.vip_level ?? 1 })}
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl" style={{ background: isDark ? 'rgba(212,188,148,0.1)' : 'rgba(180,83,9,0.1)', border: isDark ? '1px solid rgba(212,188,148,0.14)' : '1px solid rgba(180,83,9,0.16)' }}>
                  <BrandHomeIcon size={20} style={{ color: '#b45309' }} />
                </div>
                <div className="min-w-0">
                  <h1 className="truncate text-xl font-bold leading-tight text-stone-900 dark:text-stone-100 md:text-2xl" style={{ fontFamily: DISPLAY, fontWeight: 700 }}>
                    {t('brandName')}
                  </h1>
                  <p className="mt-0.5 truncate text-sm font-medium" style={{ color: isDark ? '#b8afa4' : '#6b6560' }}>
                    {t('welcomeBack', { name: user?.username ?? t('guest') })}
                  </p>
                </div>
              </div>
            </div>

            <div className="relative flex shrink-0 items-center gap-2 pt-1">
              <Link
                to="/notifications"
                className="relative flex h-10 w-10 items-center justify-center rounded-full transition-colors"
                style={{ color: isDark ? '#d4bc94' : '#b45309', background: isDark ? 'rgba(212,188,148,0.12)' : 'rgba(180,83,9,0.08)' }}
                aria-label="Notifications"
              >
                {notificationCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 min-w-4 rounded-full bg-rose-500 px-1.5 py-0.5 text-[9px] font-bold text-white leading-none flex items-center justify-center">
                    {notificationCount > 99 ? '99+' : notificationCount}
                  </span>
                )}
                <Bell size={18} />
              </Link>

              <Link to="/profile" aria-label="Profile">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full"
                  style={{ background: isDark ? 'rgba(212,188,148,0.12)' : 'rgba(180,83,9,0.08)', border: isDark ? '1.5px solid rgba(212,188,148,0.2)' : '1.5px solid rgba(180,83,9,0.2)' }}
                >
                  <img
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username ?? 'ShoppingOptimized'}`}
                    alt={t('avatarAlt')}
                    className="h-8 w-8 rounded-full"
                  />
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Banner video */}
        <div className="fade-up fade-up-1 overflow-hidden rounded-3xl shadow-md">
          <video autoPlay muted loop playsInline preload="auto"
            poster="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80"
            className="h-44 w-full object-cover md:h-60">
            <source src="/videos/banner-dodplZ4U.mp4" type="video/mp4" />
          </video>
        </div>

        {/* Menu grid */}
        <div
          className="fade-up fade-up-2 mt-4 rounded-[30px] px-3 py-4 md:px-4 md:py-5"
          style={{ background: 'linear-gradient(160deg, #2c261f 0%, #1a1712 100%)', boxShadow: '0 16px 30px rgba(0,0,0,0.22)' }}
        >
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest" style={{ color: '#6b5f50', fontFamily: DISPLAY }}>
            {t('quickActions')}
          </p>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7">
            {menuItems.map((item, index) => {
              const content = (
                <>
                  <div className={`mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-full border backdrop-blur-sm transition-all duration-200 group-hover:scale-105 ${item.iconShell}`}>
                    <item.icon className={item.iconColor} size={19} strokeWidth={1.6} />
                  </div>
                  <span
                    className="block text-center text-[9px] font-semibold uppercase tracking-wider leading-tight"
                    style={{ color: '#6b5f50', fontFamily: DISPLAY }}
                  >
                    {t(item.labelKey)}
                  </span>
                </>
              );

              return item.to ? (
                <Link key={index} to={item.to}
                  className="group rounded-xl p-2 transition-all duration-150 hover:-translate-y-0.5 hover:bg-white/5 active:scale-95">
                  {content}
                </Link>
              ) : (
                <div key={index}
                  className="group cursor-pointer rounded-xl p-2 transition-all duration-150 hover:-translate-y-0.5 hover:bg-white/5 active:scale-95">
                  {content}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* VIP cards */}
      <div className="px-4 pt-7 md:px-8">
        <div className="fade-up fade-up-3 mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-stone-800 dark:text-stone-100 md:text-xl" style={{ fontFamily: DISPLAY, fontWeight: 700 }}>
            {t('vipLevels')}
          </h2>
          <button type="button"
            className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider transition-opacity hover:opacity-60"
            style={{ color: isDark ? '#d4bc94' : '#b45309', fontFamily: DISPLAY }}>
            {t('viewMore')} <ChevronRight size={13} />
          </button>
        </div>

        <div className="fade-up fade-up-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {vipLevels.map((vip) => (
            <div
              key={vip.level}
              className="flex flex-col overflow-hidden rounded-2xl transition-shadow duration-200 hover:shadow-md"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: isDark ? '0 10px 24px rgba(0,0,0,0.28)' : '0 2px 10px rgba(28,26,23,0.06)' }}
            >
              <div className="h-0.75 w-full" style={{ background: vip.style.accent }} />

              <div className="flex flex-col flex-1 px-5 pt-4 pb-5">
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: vip.style.accent, fontFamily: DISPLAY }}>
                      {vip.style.label}
                    </p>
                    <h3
                      className="mt-0.5 leading-none text-stone-900 dark:text-stone-100"
                      style={{ fontFamily: DISPLAY, fontWeight: 800, fontSize: 'clamp(2rem, 5vw, 2.5rem)' }}
                    >
                      {vip.level}
                    </h3>
                  </div>
                  <span
                    className="mt-1 rounded-lg px-2 py-1 text-[10px] font-bold uppercase tracking-wider"
                    style={{ background: `${vip.style.accent}14`, color: vip.style.accent, fontFamily: DISPLAY }}
                  >
                    VIP
                  </span>
                </div>

                <div className="mb-4 grid grid-cols-3 gap-3">
                  {[
                    { value: String(vip.tasks), label: t('vipTasksPerSet') },
                    { value: vip.commission,    label: t('vipProfit')     },
                    { value: vip.comboProfit,   label: t('vipCombo')      },
                  ].map((stat) => (
                    <div key={stat.label}>
                      <p className="text-xl font-bold leading-none text-stone-900 dark:text-stone-100 tabular-nums" style={{ fontFamily: DISPLAY }}>
                        {stat.value}
                      </p>
                      <p className="mt-1 text-[9px] font-semibold uppercase tracking-wider" style={{ color: isDark ? '#9e9385' : '#9c9288', fontFamily: DISPLAY }}>
                        {stat.label}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mb-3" style={{ borderTop: isDark ? '1px solid rgba(120,103,82,0.28)' : '1px solid #ede8e0' }} />

                <div className="mt-auto flex items-center justify-between">
                  <span className="text-xs font-medium" style={{ color: isDark ? '#9e9385' : '#9c9288' }}>{t('activateWith')}</span>
                  <span className="text-sm font-bold tabular-nums" style={{ color: vip.style.accent, fontFamily: DISPLAY }}>
                    {vip.amount}
                  </span>
                </div>

                <p className="mt-2 text-[10px]" style={{ color: isDark ? '#867a6c' : '#bdb5ab' }}>{t('vipDailyShort')}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
