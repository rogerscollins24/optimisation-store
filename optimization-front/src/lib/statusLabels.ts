export function getStatusTranslationKey(status?: string): string | null {
  const normalized = String(status ?? 'open').toLowerCase().trim();

  if (normalized === 'open') return 'statusOpen';
  if (normalized === 'closed') return 'statusClosed';
  if (normalized === 'pending') return 'statusPending';
  if (normalized === 'resolved') return 'statusResolved';
  if (normalized === 'in_progress') return 'statusInProgress';
  if (normalized === 'pending_debited') return 'statusPendingDebited';

  return null;
}

export function humanizeStatus(status?: string): string {
  const normalized = String(status ?? 'open').replace(/_/g, ' ').trim();
  return normalized ? normalized.charAt(0).toUpperCase() + normalized.slice(1) : 'Open';
}