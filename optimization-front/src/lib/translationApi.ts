type TranslateBatchResponse = {
  translated_texts: string[];
  target_language: string;
};

const languageAliasMap: Record<string, string> = {
  en: 'en',
  fr: 'fr',
  es: 'es',
  it: 'it',
  pl: 'pl',
  ru: 'ru',
  de: 'de',
  nl: 'nl',
  tr: 'tr',
  pt: 'pt',
};

export function normalizeLanguageCode(language: string): string {
  const normalized = String(language || 'en').toLowerCase().trim();
  if (!normalized) return 'en';
  if (languageAliasMap[normalized]) return languageAliasMap[normalized];
  const shortCode = normalized.split('-')[0];
  return languageAliasMap[shortCode] || shortCode || 'en';
}

export async function translateBatch(texts: string[], targetLanguage: string, sourceLanguage = 'auto'): Promise<string[]> {
  if (!Array.isArray(texts) || texts.length === 0) {
    return [];
  }

  const target = normalizeLanguageCode(targetLanguage);
  const source = normalizeLanguageCode(sourceLanguage === 'auto' ? 'en' : sourceLanguage);

  if (target === 'en') {
    return texts;
  }

  const response = await fetch('/api/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      texts,
      target_language: target,
      source_language: sourceLanguage === 'auto' ? 'auto' : source,
    }),
  });

  if (!response.ok) {
    throw new Error(`Translation request failed (${response.status})`);
  }

  const payload = (await response.json()) as TranslateBatchResponse;
  if (!Array.isArray(payload.translated_texts)) {
    return texts;
  }

  return payload.translated_texts.map((item, index) => {
    if (typeof item !== 'string' || item.trim() === '') {
      return texts[index] ?? '';
    }
    return item;
  });
}
