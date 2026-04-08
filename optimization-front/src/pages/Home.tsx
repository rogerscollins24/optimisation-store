import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bell, Check, HeadphonesIcon, Gift, ArrowDownToLine, ArrowUpFromLine, FileText, Award, HelpCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { BrandHomeIcon } from '../components/BrandIcons';

export default function Home() {
  const { user, notificationCount } = useAuth();
  const { language, languages, setLanguage, t } = useLanguage();
  const [isLanguageOpen, setIsLanguageOpen] = useState(false);
  const currentLanguage = languages.find((item) => item.code === language) ?? languages[0];
  const menuItems = [
    { icon: HeadphonesIcon, labelKey: 'service', color: 'text-blue-500', bg: 'bg-blue-100', to: '/support' },
    { icon: Gift, labelKey: 'event', color: 'text-pink-500', bg: 'bg-pink-100' },
    { icon: ArrowUpFromLine, labelKey: 'withdrawal', color: 'text-orange-500', bg: 'bg-orange-100', to: '/withdraw' },
    { icon: ArrowDownToLine, labelKey: 'deposit', color: 'text-green-500', bg: 'bg-green-100', to: '/deposit' },
    { icon: FileText, labelKey: 'terms', color: 'text-purple-500', bg: 'bg-purple-100' },
    { icon: Award, labelKey: 'certificate', color: 'text-yellow-500', bg: 'bg-yellow-100' },
    { icon: HelpCircle, labelKey: 'faqs', color: 'text-teal-500', bg: 'bg-teal-100', to: '/faqs' },
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
            <p className="mt-1 text-sm font-medium text-slate-600">{t('welcomeBack', { name: user?.username ?? t('guest') })}</p>
          </div>

          <div className="relative flex items-center gap-3">
            <Link to="/notifications" className="relative flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-sky-500 md:h-14 md:w-14">
              {notificationCount > 0 ? (
                <span className="absolute -right-1 -top-1 min-w-[18px] rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {notificationCount > 99 ? '99+' : notificationCount}
                </span>
              ) : null}
              <Bell size={22} />
            </Link>

            <div className="relative">
              <button
                type="button"
                onClick={() => setIsLanguageOpen((current) => !current)}
                className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-3 text-slate-800 shadow-sm"
              >
                <span className="text-xl leading-none">{currentLanguage.flag}</span>
                <span className="text-lg font-bold">{currentLanguage.short}</span>
                <ChevronDown size={18} className={`transition-transform ${isLanguageOpen ? 'rotate-180' : ''}`} />
              </button>

              {isLanguageOpen ? (
                <div className="absolute right-0 top-[calc(100%+10px)] z-30 w-72 rounded-[24px] border border-slate-200 bg-white p-3 shadow-2xl">
                  <div className="space-y-1">
                    {languages.map((option) => (
                      <button
                        key={option.code}
                        type="button"
                        onClick={() => {
                          setLanguage(option.code);
                          setIsLanguageOpen(false);
                        }}
                        className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-slate-900 transition-colors ${language === option.code ? 'bg-slate-100' : 'hover:bg-slate-50'}`}
                      >
                        <span className="flex items-center gap-3 text-lg font-semibold">
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
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 md:h-14 md:w-14">
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username ?? 'ShoppingOptimized'}`} alt="Avatar" className="h-10 w-10 rounded-full md:h-12 md:w-12" />
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

        <div className="mt-4 rounded-[26px] bg-[#2f2f31] px-3 py-4 text-white shadow-md md:px-4 md:py-5">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white/90">
            <span>{t('menu')}</span>
            <span className="text-cyan-400">{t('list')}</span>
          </div>
          <div className="grid grid-cols-4 gap-3 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7">
            {menuItems.map((item, index) => {
              const content = (
                <>
                  <div className={`mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-[#3d3d40] shadow-inner ${item.bg}`}>
                    <item.icon className={item.color} size={20} strokeWidth={1.8} />
                  </div>
                  <span className="block text-center text-[11px] font-semibold text-cyan-400 md:text-xs">{t(item.labelKey)}</span>
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
          <h2 className="text-lg font-bold text-slate-800 md:text-2xl">{t('vipLevels')}</h2>
          <button type="button" className="inline-flex items-center gap-1 text-sm font-semibold text-sky-500">
            {t('viewMore')} <ChevronRight size={16} />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {vipLevels.map((vip) => (
            <div key={vip.level} className={`min-h-[330px] rounded-[24px] px-5 py-6 text-white shadow-md ${vip.bg}`}>
              <div className="mb-5 flex flex-col items-center text-center">
                <div className={`mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br ${vip.badge} shadow-inner ring-4 ring-white/20`}>
                  <Award size={28} className="text-white" />
                </div>
                <h3 className="text-3xl font-bold tracking-tight">VIP{vip.level}</h3>
              </div>
              <ul className="space-y-2 text-base leading-8 text-white/95">
                <li>• {t('vipReceive', { tasks: vip.tasks })}</li>
                <li>• {t('vipEach', { commission: vip.commission })}</li>
                <li>• {t('vipCombined', { comboProfit: vip.comboProfit })}</li>
                <li>• {t('vipActivate', { amount: vip.amount })}</li>
                <li>• {t('vipDaily')}</li>
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
