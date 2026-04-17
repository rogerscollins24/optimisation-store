import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, HeadphonesIcon, Gift, ArrowDownToLine, ArrowUpFromLine, FileText, Award, HelpCircle, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { BrandHomeIcon } from '../components/BrandIcons';
import { fetchVipLevels, getDefaultVipLevels, type VipLevelConfig } from '../lib/vipApi';

export default function Home() {
  const { user, notificationCount } = useAuth();
  const { t } = useTranslation();
  const [vipLevelConfig, setVipLevelConfig] = useState<VipLevelConfig[]>(() => getDefaultVipLevels());

  const menuItems = useMemo(
    () => [
      { icon: HeadphonesIcon, labelKey: 'service', to: '/support',   color: '#22d3ee', glow: 'rgba(34,211,238,0.18)'  },
      { icon: Gift,           labelKey: 'event',                      color: '#f472b6', glow: 'rgba(244,114,182,0.18)' },
      { icon: ArrowUpFromLine,labelKey: 'withdrawal', to: '/withdraw',color: '#fb923c', glow: 'rgba(251,146,60,0.18)'  },
      { icon: ArrowDownToLine,labelKey: 'deposit', to: '/deposit',    color: '#4ade80', glow: 'rgba(74,222,128,0.18)'  },
      { icon: FileText,       labelKey: 'terms',                      color: '#818cf8', glow: 'rgba(129,140,248,0.18)' },
      { icon: Award,          labelKey: 'certificate',                color: '#fbbf24', glow: 'rgba(251,191,36,0.18)'  },
      { icon: HelpCircle,     labelKey: 'faqs', to: '/faqs',          color: '#c084fc', glow: 'rgba(192,132,252,0.18)' },
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
            ? { bg: 'linear-gradient(160deg,#1a2a3d 0%,#0e1c2e 100%)', accent: '#60a5d4', blob: '#3b82f6', activationBg: 'rgba(96,165,212,0.12)', activationBorder: 'rgba(96,165,212,0.28)', label: 'Steel' }
            : item.level === 2
            ? { bg: 'linear-gradient(160deg,#0c1f50 0%,#071336 100%)', accent: '#5b8ef0', blob: '#6366f1', activationBg: 'rgba(91,142,240,0.12)', activationBorder: 'rgba(91,142,240,0.28)', label: 'Sapphire' }
            : item.level === 3
            ? { bg: 'linear-gradient(160deg,#2c1800 0%,#1a0e00 100%)', accent: '#f0a020', blob: '#d97706', activationBg: 'rgba(240,160,32,0.12)', activationBorder: 'rgba(240,160,32,0.28)', label: 'Gold' }
            : { bg: 'linear-gradient(160deg,#1e0b3e 0%,#110523 100%)', accent: '#b07ef5', blob: '#9333ea', activationBg: 'rgba(176,126,245,0.12)', activationBorder: 'rgba(176,126,245,0.28)', label: 'Diamond' },
      })),
    [vipLevelConfig],
  );

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const data = await fetchVipLevels();
      if (mounted) {
        setVipLevelConfig(data);
      }
    };
    void load();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="canvas-texture flex min-h-full flex-col overflow-x-hidden pb-6">
      <div className="px-4 pt-5 md:px-8 md:pt-6">

        {/* Header card */}
        <div className="relative z-20 mb-5 flex items-center justify-between overflow-visible rounded-2xl px-4 py-4"
             style={{ background: '#faf8f4', border: '1px solid #ddd8d0', boxShadow: '0 2px 16px rgba(28,26,23,0.08)' }}>
          <div>
            <div className="flex items-center gap-2.5">
              <BrandHomeIcon size={22} style={{ color: '#b45309' }} />
              <h1 className="text-xl font-bold leading-tight text-stone-900 md:text-2xl"
                  style={{ fontFamily: '"Syne", ui-sans-serif', fontWeight: 700 }}>
                {t('brandName')}
              </h1>
            </div>
            <p className="mt-1 text-sm font-medium text-stone-500">
              {t('welcomeBack', { name: user?.username ?? t('guest') })}
            </p>
          </div>

          <div className="relative flex items-center gap-2.5">
            <Link
              to="/notifications"
              className="relative flex h-11 w-11 items-center justify-center rounded-full transition-colors hover:bg-stone-100"
              style={{ color: '#b45309', background: 'rgba(180,83,9,0.08)' }}
            >
              {notificationCount > 0 ? (
                <span className="absolute -right-0.5 -top-0.5 min-w-4.5 rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {notificationCount > 99 ? '99+' : notificationCount}
                </span>
              ) : null}
              <Bell size={20} />
            </Link>

            <Link to="/profile">
              <div className="flex h-11 w-11 items-center justify-center rounded-full" style={{ background: 'rgba(180,83,9,0.08)', border: '1.5px solid rgba(180,83,9,0.2)' }}>
                <img
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username ?? 'ShoppingOptimized'}`}
                  alt={t('avatarAlt')}
                  className="h-9 w-9 rounded-full"
                />
              </div>
            </Link>
          </div>
        </div>

        {/* Banner video */}
        <div className="overflow-hidden rounded-3xl shadow-lg">
          <video
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            poster="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80"
            className="h-44 w-full object-cover md:h-60"
          >
            <source src="/videos/banner-dodplZ4U.mp4" type="video/mp4" />
          </video>
        </div>

        {/* Menu grid */}
        <div className="mt-4 rounded-3xl px-3 py-4 md:px-4 md:py-5"
             style={{ background: 'linear-gradient(160deg, #28241e 0%, #1e1b16 100%)', boxShadow: '0 4px 24px rgba(0,0,0,0.22)' }}>
          <div className="mb-3 flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-widest text-stone-500"
                  style={{ fontFamily: '"Syne", ui-sans-serif' }}>{t('menu')}</span>
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#b45309', fontFamily: '"Syne", ui-sans-serif' }}>{t('list')}</span>
          </div>
          <div className="grid grid-cols-4 gap-2.5 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7">
            {menuItems.map((item, index) => {
              const content = (
                <>
                  <div
                    className="mx-auto mb-2.5 flex h-12 w-12 items-center justify-center rounded-full transition-transform duration-200"
                    style={{
                      background: item.glow,
                      boxShadow: `0 0 16px ${item.glow}`,
                      border: `1px solid ${item.color}28`,
                    }}
                  >
                    <item.icon size={20} strokeWidth={1.7} style={{ color: item.color }} />
                  </div>
                  <span className="block text-center text-[10px] font-semibold uppercase tracking-wider"
                        style={{ color: '#7a6f64', fontFamily: '"Syne", ui-sans-serif' }}>
                    {t(item.labelKey)}
                  </span>
                </>
              );

              return item.to ? (
                <Link
                  key={index}
                  to={item.to}
                  className="rounded-xl p-2.5 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/5"
                >
                  {content}
                </Link>
              ) : (
                <div
                  key={index}
                  className="cursor-pointer rounded-xl p-2.5 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/5"
                >
                  {content}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* VIP cards */}
      <div className="px-4 pt-6 md:px-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-stone-800 md:text-xl"
              style={{ fontFamily: '"Syne", ui-sans-serif', fontWeight: 700 }}>
            {t('vipLevels')}
          </h2>
          <button type="button" className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider transition-colors hover:opacity-70"
                  style={{ color: '#b45309', fontFamily: '"Syne", ui-sans-serif' }}>
            {t('viewMore')} <ChevronRight size={14} />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {vipLevels.map((vip) => (
            <div
              key={vip.level}
              className="relative flex flex-col overflow-hidden rounded-2xl text-white"
              style={{ background: vip.style.bg, boxShadow: '0 8px 32px rgba(0,0,0,0.35)', minHeight: 300 }}
            >
              {/* Decorative blob */}
              <div
                className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full opacity-15"
                style={{ background: `radial-gradient(circle, ${vip.style.blob} 0%, transparent 70%)` }}
              />

              {/* Header */}
              <div className="relative z-10 flex items-start justify-between px-5 pt-5">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: vip.style.accent, fontFamily: '"Syne", ui-sans-serif' }}>
                    {vip.style.label}
                  </p>
                  <h3 className="mt-0.5 text-3xl font-extrabold tracking-tight" style={{ fontFamily: '"Syne", ui-sans-serif', fontWeight: 800 }}>
                    VIP {vip.level}
                  </h3>
                </div>
                {/* Level badge */}
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-lg font-bold"
                  style={{ background: 'rgba(255,255,255,0.08)', border: `1px solid ${vip.style.accent}40`, color: vip.style.accent, fontFamily: '"Syne", ui-sans-serif' }}
                >
                  {vip.level}
                </div>
              </div>

              {/* Stat chips */}
              <div className="relative z-10 mt-4 grid grid-cols-3 gap-2 px-5">
                {[
                  { value: String(vip.tasks), label: 'Tasks/set' },
                  { value: vip.commission, label: 'Profit' },
                  { value: vip.comboProfit, label: 'Combo' },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-xl px-2 py-2.5 text-center"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    <p className="text-lg font-bold leading-none" style={{ color: vip.style.accent, fontFamily: '"Syne", ui-sans-serif' }}>
                      {stat.value}
                    </p>
                    <p className="mt-1 text-[9px] uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.38)', fontFamily: '"Syne", ui-sans-serif' }}>
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>

              {/* Daily sets note */}
              <p className="relative z-10 mt-3 px-5 text-[11px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                Up to 3 sets completable per day
              </p>

              {/* Activation CTA */}
              <div className="relative z-10 mt-auto px-5 pb-5 pt-4">
                <div
                  className="flex items-center justify-between rounded-xl px-4 py-3"
                  style={{ background: vip.style.activationBg, border: `1px solid ${vip.style.activationBorder}` }}
                >
                  <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    Activate with
                  </span>
                  <span className="text-base font-bold" style={{ color: vip.style.accent, fontFamily: '"Syne", ui-sans-serif' }}>
                    {vip.amount}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
