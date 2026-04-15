import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { normalizeLanguageCode, translateBatch } from '../lib/translationApi';

const STORAGE_PREFIX = 'dynamic-translation-cache-v1:';
const memoryCache = new Map<string, Map<string, string>>();

function getMemoryMap(language: string): Map<string, string> {
  const existing = memoryCache.get(language);
  if (existing) {
    return existing;
  }
  const created = new Map<string, string>();
  memoryCache.set(language, created);
  return created;
}

function getStorageKey(language: string): string {
  return `${STORAGE_PREFIX}${language}`;
}

function loadPersisted(language: string): Record<string, string> {
  try {
    const raw = localStorage.getItem(getStorageKey(language));
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, string>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function savePersisted(language: string, entries: Record<string, string>): void {
  try {
    localStorage.setItem(getStorageKey(language), JSON.stringify(entries));
  } catch {
    // Ignore localStorage write failures.
  }
}

export function useDynamicTranslations(sourceTexts: string[]) {
  const { i18n } = useTranslation();
  const language = normalizeLanguageCode(i18n.resolvedLanguage || i18n.language || 'en');

  const normalizedTexts = useMemo(
    () => Array.from(new Set(sourceTexts.map((item) => String(item || '').trim()).filter(Boolean))),
    [sourceTexts],
  );

  const [translations, setTranslations] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    if (normalizedTexts.length === 0) {
      setTranslations(new Map());
      return;
    }

    if (language === 'en') {
      setTranslations(new Map(normalizedTexts.map((text) => [text, text])));
      return;
    }

    const memory = getMemoryMap(language);
    const persisted = loadPersisted(language);
    Object.entries(persisted).forEach(([key, value]) => {
      if (!memory.has(key)) {
        memory.set(key, value);
      }
    });

    const snapshot = new Map<string, string>();
    normalizedTexts.forEach((text) => {
      if (memory.has(text)) {
        snapshot.set(text, memory.get(text) || text);
      }
    });
    setTranslations(snapshot);

    const missing = normalizedTexts.filter((text) => !memory.has(text));
    if (missing.length === 0) {
      return;
    }

    let cancelled = false;
    void translateBatch(missing, language, 'auto')
      .then((result) => {
        if (cancelled) return;

        const persistedUpdate = loadPersisted(language);
        missing.forEach((original, index) => {
          const translated = result[index] || original;
          memory.set(original, translated);
          persistedUpdate[original] = translated;
        });
        savePersisted(language, persistedUpdate);

        setTranslations((previous) => {
          const next = new Map(previous);
          missing.forEach((original) => {
            next.set(original, memory.get(original) || original);
          });
          return next;
        });
      })
      .catch(() => {
        if (cancelled) return;
        setTranslations((previous) => {
          const next = new Map(previous);
          missing.forEach((original) => next.set(original, original));
          return next;
        });
      });

    return () => {
      cancelled = true;
    };
  }, [language, normalizedTexts]);

  const translateText = (text: string): string => {
    const normalized = String(text || '').trim();
    if (!normalized) return text;
    return translations.get(normalized) || text;
  };

  return { translateText };
}
