export type SupportMessage = {
  id: number;
  content: string;
  is_admin_reply: boolean;
  read_by_admin: boolean;
  read_by_user: boolean;
  created_at: string;
  sender_id?: number | null;
};

export type SupportTicket = {
  id: number;
  user_id?: number | null;
  assigned_to_admin_id?: number | null;
  subject: string;
  status: string;
  created_at: string;
  updated_at: string;
  user_username?: string | null;
  user_email?: string | null;
  assigned_admin_username?: string | null;
  messages: SupportMessage[];
};

function authHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload?.detail || `Request failed (${response.status})`);
  }
  return response.json() as Promise<T>;
}

export async function createSupportTicket(token: string, subject: string, message: string): Promise<SupportTicket> {
  const response = await fetch('/api/support/tickets', {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ subject, message }),
  });
  return parseResponse<SupportTicket>(response);
}

export async function listSupportTickets(
  token: string,
  params?: { status?: string; limit?: number; skip?: number },
): Promise<SupportTicket[]> {
  const qs = new URLSearchParams();
  if (params?.status) qs.set('status', params.status);
  if (typeof params?.limit === 'number') qs.set('limit', String(params.limit));
  if (typeof params?.skip === 'number') qs.set('skip', String(params.skip));

  const response = await fetch(`/api/support/tickets${qs.toString() ? `?${qs.toString()}` : ''}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return parseResponse<SupportTicket[]>(response);
}

export async function getSupportTicket(token: string, ticketId: number): Promise<SupportTicket> {
  const response = await fetch(`/api/support/tickets/${ticketId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return parseResponse<SupportTicket>(response);
}

export async function postSupportMessage(token: string, ticketId: number, content: string): Promise<SupportTicket> {
  const response = await fetch(`/api/support/tickets/${ticketId}/messages`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ content }),
  });
  return parseResponse<SupportTicket>(response);
}

export async function getClientSupportUnreadCount(token: string): Promise<number> {
  const response = await fetch('/api/support/client-unread-count', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const payload = await parseResponse<{ unread?: number }>(response);
  return Number(payload?.unread || 0);
}

export async function markSupportTicketRead(token: string, ticketId: number): Promise<number> {
  const response = await fetch(`/api/support/tickets/${ticketId}/mark-read`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  const payload = await parseResponse<{ updated?: number }>(response);
  return Number(payload?.updated || 0);
}
