import { normalizeLanguageCode } from './translationApi';

function toDate(value: string | number | Date): Date | null {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function resolveAppLocale(language: string): string {
  return normalizeLanguageCode(language || 'en');
}

export function formatLocalizedDateTime(
  value: string | number | Date,
  language: string,
  options?: Intl.DateTimeFormatOptions,
): string {
  const date = toDate(value);
  if (!date) return '';

  return new Intl.DateTimeFormat(resolveAppLocale(language), options ?? {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export function formatLocalizedTime(
  value: string | number | Date,
  language: string,
  options?: Intl.DateTimeFormatOptions,
): string {
  const date = toDate(value);
  if (!date) return '';

  return new Intl.DateTimeFormat(resolveAppLocale(language), options ?? {
    timeStyle: 'short',
  }).format(date);
}