import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Check, HeadphonesIcon, Gift, ArrowDownToLine, ArrowUpFromLine, FileText, Award, HelpCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage, type LanguageCode } from '../context/LanguageContext';
import { useTranslation } from 'react-i18next';
import { BrandHomeIcon } from '../components/BrandIcons';
import { fetchVipLevels, getDefaultVipLevels, type VipLevelConfig } from '../lib/vipApi';

export default function Home() {
  const { user, notificationCount } = useAuth();
  const { language, languages, setLanguage } = useLanguage();
  const { t } = useTranslation();
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const [vipLevelConfig, setVipLevelConfig] = useState<VipLevelConfig[]>(() => getDefaultVipLevels());
  const languageMenuRef = useRef<HTMLDivElement | null>(null);

  const currentLanguage = useMemo(
    () => languages.find((item) => item.code === language) ?? languages[0],
    [language, languages],
  );

  const menuItems = useMemo(
    () => [
      {
        icon: HeadphonesIcon,
        labelKey: 'service',
        iconColor: 'text-cyan-300',
        iconShell: 'border-cyan-400/45 bg-cyan-500/12 shadow-[0_0_22px_rgba(34,211,238,0.35)]',
        to: '/support',
      },
      {
        icon: Gift,
        labelKey: 'event',
        iconColor: 'text-fuchsia-300',
        iconShell: 'border-fuchsia-400/45 bg-fuchsia-500/12 shadow-[0_0_22px_rgba(232,121,249,0.35)]',
      },
      {
        icon: ArrowUpFromLine,
        labelKey: 'withdrawal',
        iconColor: 'text-amber-300',
        iconShell: 'border-amber-400/45 bg-amber-500/12 shadow-[0_0_22px_rgba(251,191,36,0.35)]',
        to: '/withdraw',
      },
      {
        icon: ArrowDownToLine,
        labelKey: 'deposit',
        iconColor: 'text-emerald-300',
        iconShell: 'border-emerald-400/45 bg-emerald-500/12 shadow-[0_0_22px_rgba(52,211,153,0.35)]',
        to: '/deposit',
      },
      {
        icon: FileText,
        labelKey: 'terms',
        iconColor: 'text-indigo-300',
        iconShell: 'border-indigo-400/45 bg-indigo-500/12 shadow-[0_0_22px_rgba(129,140,248,0.35)]',
      },
      {
        icon: Award,
        labelKey: 'certificate',
        iconColor: 'text-yellow-300',
        iconShell: 'border-yellow-400/45 bg-yellow-500/12 shadow-[0_0_22px_rgba(250,204,21,0.35)]',
      },
      {
        icon: HelpCircle,
        labelKey: 'faqs',
        iconColor: 'text-violet-300',
        iconShell: 'border-violet-400/45 bg-violet-500/12 shadow-[0_0_22px_rgba(167,139,250,0.35)]',
        to: '/faqs',
      },
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
        tierName:
          item.level === 1
            ? 'STEEL'
            : item.level === 2
              ? 'SAPPHIRE'
              : item.level === 3
                ? 'GOLD'
                : 'DIAMOND',
        cardBg:
          item.level === 1
            ? 'bg-[radial-gradient(circle_at_80%_20%,rgba(78,172,255,0.25),transparent_44%),linear-gradient(140deg,#10233f_2%,#143462_58%,#0e223f_100%)]'
            : item.level === 2
              ? 'bg-[radial-gradient(circle_at_80%_20%,rgba(119,155,255,0.3),transparent_45%),linear-gradient(140deg,#0b1f67_2%,#10338d_62%,#09174a_100%)]'
              : item.level === 3
                ? 'bg-[radial-gradient(circle_at_80%_20%,rgba(249,167,61,0.28),transparent_44%),linear-gradient(140deg,#3d1c00_2%,#5c2a00_56%,#2b1400_100%)]'
                : 'bg-[radial-gradient(circle_at_80%_20%,rgba(186,115,255,0.28),transparent_45%),linear-gradient(140deg,#2b0b56_2%,#3d1175_55%,#190539_100%)]',
        markerBg:
          item.level === 1
            ? 'border-sky-300/30 bg-sky-400/12 text-sky-300'
            : item.level === 2
              ? 'border-indigo-300/30 bg-indigo-400/12 text-indigo-200'
              : item.level === 3
                ? 'border-amber-300/30 bg-amber-400/12 text-amber-300'
                : 'border-violet-300/30 bg-violet-400/12 text-violet-300',
      })),
    [vipLevelConfig],
  );

  const toggleLanguageMenu = useCallback(() => {
    setIsLanguageOpen((current) => !current);
  }, []);

  const handleLanguageSelect = useCallback(
    (code: LanguageCode) => {
      setLanguage(code);
      setIsLanguageOpen(false);
    },
    [setLanguage],
  );

  useEffect(() => {
    if (!isLanguageOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (languageMenuRef.current && !languageMenuRef.current.contains(event.target as Node)) {
        setIsLanguageOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isLanguageOpen]);

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
      <div className="px-3 pt-4 sm:px-4 sm:pt-5 md:px-8 md:pt-6">
        <div className="relative z-20 mb-4 flex flex-col gap-3 overflow-visible rounded-2xl border border-white/70 bg-white/90 px-3 py-3 shadow-sm sm:mb-5 sm:flex-row sm:items-center sm:justify-between sm:px-4 sm:py-4">
          <div>
            <div className="flex items-center gap-2">
              <BrandHomeIcon size={30} className="text-slate-900" />
              <h1 className="text-lg font-bold leading-tight text-slate-900 sm:text-xl md:text-2xl">{t('brandName')}</h1>
            </div>
            <p className="mt-1 text-xs font-medium text-slate-600 sm:text-sm">{t('welcomeBack', { name: user?.username ?? t('guest') })}</p>
          </div>

          <div className="relative flex items-center gap-2 sm:gap-3">
            <Link to="/notifications" className="relative flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-sky-500 sm:h-12 sm:w-12 md:h-14 md:w-14">
              {notificationCount > 0 ? (
                <span className="absolute -right-1 -top-1 min-w-[18px] rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {notificationCount > 99 ? '99+' : notificationCount}
                </span>
              ) : null}
              <Bell size={22} />
            </Link>

            <div ref={languageMenuRef} className="relative">
              <button
                type="button"
                onClick={toggleLanguageMenu}
                aria-expanded={isLanguageOpen}
                className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-3 text-slate-800 shadow-sm"
              >
                <span className="text-lg leading-none sm:text-xl">{currentLanguage.flag}</span>
                <span className="text-base font-bold sm:text-lg">{currentLanguage.short}</span>
                <ChevronDown size={18} className={`transition-transform ${isLanguageOpen ? 'rotate-180' : ''}`} />
              </button>

              {isLanguageOpen ? (
                <div className="absolute right-0 top-full z-[140] mt-2 max-h-[70vh] w-60 overflow-y-auto rounded-[24px] border border-slate-200 bg-white p-3 shadow-2xl sm:w-72">
                  <div className="space-y-1">
                    {languages.map((option) => (
                      <button
                        key={option.code}
                        type="button"
                        onClick={() => handleLanguageSelect(option.code)}
                        className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-slate-900 transition-colors sm:px-4 sm:py-3 ${language === option.code ? 'bg-slate-100' : 'hover:bg-slate-50'}`}
                      >
                        <span className="flex items-center gap-3 text-base font-semibold sm:text-lg">
                          <span>{option.flag}</span>
                          <span>{option.label}</span>
                        </span>
                        {language === option.code ? <Check size={18} className="text-sky-500" /> : null}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <Link to="/profile">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 sm:h-12 sm:w-12 md:h-14 md:w-14">
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username ?? 'ShoppingOptimized'}`} alt={t('avatarAlt')} className="h-8 w-8 rounded-full sm:h-10 sm:w-10 md:h-12 md:w-12" />
              </div>
            </Link>
          </div>
        </div>

        <div className="overflow-hidden rounded-[28px] shadow-lg">
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

        <div className="mt-4 rounded-[26px] border border-zinc-700/50 bg-[radial-gradient(circle_at_50%_-40%,rgba(145,91,255,0.18),transparent_40%),linear-gradient(90deg,#212121_0%,#161616_45%,#1d1d1d_100%)] px-3 py-4 text-white shadow-[0_16px_36px_rgba(17,17,17,0.45)] md:px-4 md:py-5">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-white/60">
            <span>{t('menu')}</span>
            <span className="text-orange-300">{t('list')}</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 [scrollbar-width:thin] [scrollbar-color:#71717a_transparent] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-zinc-500/80 sm:grid sm:grid-cols-5 sm:gap-3 md:grid-cols-6 lg:grid-cols-7">
            {menuItems.map((item, index) => {
              const content = (
                <>
                  <div className={`mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full border backdrop-blur-sm sm:h-12 sm:w-12 ${item.iconShell}`}>
                    <item.icon className={item.iconColor} size={18} strokeWidth={1.8} />
                  </div>
                  <span className="block text-center text-[10px] font-semibold uppercase tracking-[0.08em] text-zinc-300 sm:text-[11px] md:text-xs">{t(item.labelKey)}</span>
                </>
              );

              return item.to ? (
                <Link key={index} to={item.to} className="w-[86px] shrink-0 rounded-xl p-2 transition-transform duration-200 hover:-translate-y-0.5 sm:w-auto sm:p-3">
                  {content}
                </Link>
              ) : (
                <div key={index} className="w-[86px] shrink-0 cursor-pointer rounded-xl p-2 transition-transform duration-200 hover:-translate-y-0.5 sm:w-auto sm:p-3">
                  {content}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="px-3 pt-4 sm:px-4 sm:pt-5 md:px-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-black tracking-tight text-zinc-900 sm:text-3xl md:text-4xl">{t('vipLevels')}</h2>
          <button type="button" className="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-[0.09em] text-amber-700 sm:text-sm sm:tracking-[0.11em]">
            {t('viewMore')} <ChevronRight size={16} />
          </button>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:grid md:grid-cols-2 md:gap-4 lg:grid-cols-4">
          {vipLevels.map((vip) => (
            <div key={vip.level} className={`min-h-[280px] w-[288px] shrink-0 rounded-[20px] border border-white/15 px-4 py-4 text-white shadow-[0_20px_42px_rgba(9,16,40,0.35)] sm:min-h-[320px] sm:px-5 sm:py-5 md:w-auto md:shrink ${vip.cardBg}`}>
              <div className="mb-5 flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.15em] text-white/70">{vip.tierName}</p>
                  <h3 className="mt-1 text-[2.2rem] font-black leading-none tracking-tight sm:text-[3rem]">VIP {vip.level}</h3>
                </div>
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl border text-2xl font-bold ${vip.markerBg}`}>{vip.level}</span>
              </div>

              <div className="mb-4 grid grid-cols-3 gap-2.5">
                <div className="rounded-xl border border-white/20 bg-black/12 px-2 py-2.5 text-center">
                  <p className="text-2xl font-black leading-none text-white sm:text-3xl">{vip.tasks}</p>
                  <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.08em] text-white/65">Tasks/Set</p>
                </div>
                <div className="rounded-xl border border-white/20 bg-black/12 px-2 py-2.5 text-center">
                  <p className="text-2xl font-black leading-none text-white sm:text-3xl">{vip.commission}</p>
                  <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.08em] text-white/65">Profit</p>
                </div>
                <div className="rounded-xl border border-white/20 bg-black/12 px-2 py-2.5 text-center">
                  <p className="text-2xl font-black leading-none text-white sm:text-3xl">{vip.comboProfit}</p>
                  <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.08em] text-white/65">Combo</p>
                </div>
              </div>

              <p className="mb-6 text-sm text-white/75">Up to 3 sets completable per day</p>

              <button
                type="button"
                className="mt-auto flex w-full items-center justify-between rounded-xl border border-white/25 bg-black/20 px-3 py-2.5 text-left text-sm font-bold text-white transition-colors hover:bg-black/28 sm:px-4 sm:py-3 sm:text-base"
              >
                <span className="text-white/75">Activate with</span>
                <span className="text-xl font-black leading-none sm:text-2xl">{vip.amount}</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
