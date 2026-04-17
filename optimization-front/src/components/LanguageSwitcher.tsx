import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { useLanguage, type LanguageCode } from '../context/LanguageContext';

interface Props {
  className?: string;
  dropdownDirection?: 'up' | 'down';
}

export default function LanguageSwitcher({
  className = 'fixed bottom-21 right-4 z-50',
  dropdownDirection = 'up',
}: Props) {
  const { language, languages, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const currentLanguage = useMemo(
    () => languages.find((item) => item.code === language) ?? languages[0],
    [language, languages],
  );

  const toggle = useCallback(() => setIsOpen((v) => !v), []);

  const handleSelect = useCallback(
    (code: LanguageCode) => {
      setLanguage(code);
      setIsOpen(false);
    },
    [setLanguage],
  );

  useEffect(() => {
    if (!isOpen) return;
    const handler = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  const dropdownPositionClass =
    dropdownDirection === 'down' ? 'top-full mt-2' : 'bottom-full mb-2';

  return (
    <div ref={menuRef} className={className}>
      <button
        type="button"
        onClick={toggle}
        aria-expanded={isOpen}
        aria-label="Select language"
        className="flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-stone-800 shadow-lg transition-colors hover:bg-stone-100"
        style={{ border: '1px solid #ddd8d0', background: '#fff' }}
      >
        <span className="text-xl leading-none">{currentLanguage.flag}</span>
        <span className="text-sm font-bold" style={{ fontFamily: '"Syne", ui-sans-serif' }}>
          {currentLanguage.short}
        </span>
        <ChevronDown
          size={14}
          className={`text-stone-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen ? (
        <div
          className={`absolute right-0 ${dropdownPositionClass} max-h-[60vh] w-64 overflow-y-auto rounded-2xl p-2 shadow-2xl`}
          style={{ background: '#faf8f4', border: '1px solid #ddd8d0' }}
        >
          <div className="space-y-0.5">
            {languages.map((option) => (
              <button
                key={option.code}
                type="button"
                onClick={() => handleSelect(option.code)}
                className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-stone-900 transition-colors hover:bg-stone-100"
                style={language === option.code ? { background: 'rgba(180,83,9,0.08)' } : {}}
              >
                <span className="flex items-center gap-2.5 text-sm font-semibold">
                  <span className="text-lg">{option.flag}</span>
                  <span>{option.label}</span>
                </span>
                {language === option.code ? <Check size={15} style={{ color: '#b45309' }} /> : null}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
