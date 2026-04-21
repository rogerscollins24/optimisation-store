import { ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function Faqs() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-full flex-col bg-[#f3f3f3] dark:bg-zinc-950 pb-6">
      <div className="sticky top-0 z-10 flex items-center justify-between bg-[#2d2d2d] dark:bg-zinc-900 px-4 py-4 text-white shadow-sm md:px-5">
        <Link to="/" className="text-sky-400 hover:text-sky-300" aria-label={t('backToHome')}>
          <ChevronLeft size={30} />
        </Link>
        <h1 className="text-2xl font-bold">{t('faqs')}</h1>
        <div className="w-[30px]" />
      </div>

      <div className="space-y-8 px-5 py-6 text-[18px] leading-[2.1rem] text-[#3c3c3c] dark:text-zinc-300 md:px-6">
        <p>{t('faqP1')}</p>

        <p>{t('faqP2')}</p>

        <p>{t('faqP3')}</p>
      </div>
    </div>
  );
}
