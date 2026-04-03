export const SUPPORT_TOKEN_KEY = 'admin_support_token';

export type SupportMessage = {
  id: number;
  content: string;
  is_admin_reply: boolean;
  read_by_admin: boolean;
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

export type AdminUser = {
  id: number;
  username: string;
  role?: string;
};

export type SupportLoginResult = {
  token: string;
  role: string;
  username: string;
};

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload?.detail || `Request failed (${response.status})`);
  }
  return response.json() as Promise<T>;
}

function authHeader(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}

function authJsonHeader(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

export async function adminSupportLogin(username: string, password: string): Promise<SupportLoginResult> {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const payload = await parseResponse<any>(response);

  if (!payload?.access_token) {
    throw new Error('Login response is missing access token');
  }

  const role = String(payload?.role || 'merchant');
  if (!['super_admin', 'sub_admin'].includes(role)) {
    throw new Error('This account does not have support desk permissions');
  }

  return {
    token: payload.access_token,
    role,
    username: String(payload?.username || username),
  };
}

export async function adminListSupportTickets(
  token: string,
  params?: { status?: string; limit?: number; skip?: number },
): Promise<SupportTicket[]> {
  const qs = new URLSearchParams();
  if (params?.status) qs.set('status', params.status);
  if (typeof params?.limit === 'number') qs.set('limit', String(params.limit));
  if (typeof params?.skip === 'number') qs.set('skip', String(params.skip));

  const response = await fetch(`/api/support/tickets${qs.toString() ? `?${qs.toString()}` : ''}`, {
    headers: authHeader(token),
  });
  return parseResponse<SupportTicket[]>(response);
}

export async function adminGetSupportTicket(token: string, ticketId: number): Promise<SupportTicket> {
  const response = await fetch(`/api/support/tickets/${ticketId}`, {
    headers: authHeader(token),
  });
  return parseResponse<SupportTicket>(response);
}

export async function adminPostSupportMessage(token: string, ticketId: number, content: string): Promise<SupportTicket> {
  const response = await fetch(`/api/support/tickets/${ticketId}/messages`, {
    method: 'POST',
    headers: authJsonHeader(token),
    body: JSON.stringify({ content }),
  });
  return parseResponse<SupportTicket>(response);
}

export async function adminUpdateSupportTicketStatus(token: string, ticketId: number, status: string): Promise<SupportTicket> {
  const response = await fetch(`/api/support/tickets/${ticketId}/status`, {
    method: 'PUT',
    headers: authJsonHeader(token),
    body: JSON.stringify({ status }),
  });
  return parseResponse<SupportTicket>(response);
}

export async function adminAssignSupportTicket(
  token: string,
  ticketId: number,
  assignedToAdminId: number | null,
): Promise<SupportTicket> {
  const response = await fetch(`/api/support/tickets/${ticketId}/assignment`, {
    method: 'PUT',
    headers: authJsonHeader(token),
    body: JSON.stringify({ assigned_to_admin_id: assignedToAdminId }),
  });
  return parseResponse<SupportTicket>(response);
}

export async function adminListUsers(token: string): Promise<AdminUser[]> {
  const response = await fetch('/api/users', {
    headers: authHeader(token),
  });
  return parseResponse<AdminUser[]>(response);
}

export async function adminGetSupportUnreadCount(token: string): Promise<number> {
  const response = await fetch('/api/support/unread-count', {
    headers: authHeader(token),
  });
  const data = await parseResponse<{ unread?: number }>(response);
  return Number(data?.unread || 0);
}

export async function adminMarkAllSupportMessagesRead(token: string): Promise<number> {
  const response = await fetch('/api/support/mark-all-read', {
    method: 'POST',
    headers: authHeader(token),
  });
  const data = await parseResponse<{ updated?: number }>(response);
  return Number(data?.updated || 0);
}
