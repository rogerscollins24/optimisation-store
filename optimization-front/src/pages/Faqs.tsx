import { ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function Faqs() {
  const { t } = useTranslation();

  return (
    <div className="client-page flex min-h-full flex-col pb-6">
      <div className="client-header sticky top-0 z-10 flex items-center justify-between px-3 py-3.5 shadow-sm sm:px-4 sm:py-4 md:px-5">
        <Link to="/" className="text-amber-300 hover:text-amber-200" aria-label={t('backToHome')}>
          <ChevronLeft size={30} />
        </Link>
        <h1 className="text-xl font-bold text-[#f6efe5] sm:text-2xl">{t('faqs')}</h1>
        <div className="w-[30px]" />
      </div>

      <div className="client-card mx-3 mt-3 space-y-6 rounded-2xl px-4 py-4 text-base leading-7 text-[#3f3226] sm:mx-4 sm:mt-4 sm:space-y-8 sm:px-5 sm:py-6 sm:text-[18px] sm:leading-[2.1rem] md:mx-6 md:px-6">
        <p>{t('faqP1')}</p>

        <p>{t('faqP2')}</p>

        <p>{t('faqP3')}</p>
      </div>
    </div>
  );
}
