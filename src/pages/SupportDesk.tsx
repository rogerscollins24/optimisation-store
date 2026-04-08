import { useEffect, useMemo, useRef, useState } from 'react';
import { CheckCircle2, Loader2, RefreshCcw, Search, Send } from 'lucide-react';
import SupportSocket from '../lib/socket';
import {
  adminAssignClientSupportOwner,
  adminAssignSupportTicket,
  adminGetSupportTicket,
  adminGetSupportUnreadCount,
  adminListSupportTickets,
  adminListUsers,
  adminMarkAllSupportMessagesRead,
  adminPostSupportMessage,
  adminUpdateSupportTicketStatus,
  type AdminUser,
  type SupportMessage,
  type SupportTicket,
} from '../lib/adminApi';
import { useAdminAuth } from '../context/AdminAuthContext';

function notifyUnread(count: number) {
  window.dispatchEvent(new CustomEvent('support-unread-updated', { detail: { count } }));
}

export default function SupportDesk() {
  const { token, role } = useAdminAuth();
  const [subAdmins, setSubAdmins] = useState<AdminUser[]>([]);

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const socketRef = useRef<SupportSocket | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const activeTicket = useMemo(() => tickets.find((ticket) => ticket.id === activeId) ?? null, [tickets, activeId]);

  const visibleTickets = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tickets;
    return tickets.filter((ticket) => {
      const text = `${ticket.subject} ${ticket.user_username || ''} ${ticket.user_email || ''}`.toLowerCase();
      return text.includes(q);
    });
  }, [tickets, query]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const isSuperAdmin = role === 'super_admin';

  const loadTickets = async (activeToken: string) => {
    setLoading(true);
    try {
      const data = await adminListSupportTickets(activeToken, {
        status: statusFilter || undefined,
        limit: 100,
      });
      setTickets(data);
      if (data.length > 0 && activeId == null) {
        setActiveId(data[0].id);
        setMessages(data[0].messages ?? []);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    void loadTickets(token);

    const timer = window.setInterval(() => {
      void loadTickets(token);
      void adminGetSupportUnreadCount(token).then((count) => notifyUnread(count)).catch(() => undefined);
    }, 10000);

    return () => window.clearInterval(timer);
  }, [token, statusFilter, activeId]);

  useEffect(() => {
    if (!token || !isSuperAdmin) {
      setSubAdmins([]);
      return;
    }

    const loadAdmins = async () => {
      const users = await adminListUsers(token, 'sub_admin');
      setSubAdmins(users.filter((user) => user.role === 'sub_admin'));
    };

    void loadAdmins();
  }, [token, isSuperAdmin]);

  useEffect(() => {
    if (!token || !activeId) {
      setMessages([]);
      return;
    }

    const loadTicket = async () => {
      const ticket = await adminGetSupportTicket(token, activeId);
      setMessages(ticket.messages ?? []);
    };
    void loadTicket();

    if (socketRef.current) socketRef.current.disconnect();
    const socket = new SupportSocket(token);
    socketRef.current = socket;

    socket.onConnect(() => setIsConnected(true));
    socket.onMessage((payload) => {
      setMessages((prev) => {
        if (prev.some((msg) => msg.id === payload.id)) return prev;
        return [...prev, payload];
      });
      if (!payload.is_admin_reply) {
        void adminGetSupportUnreadCount(token).then((count) => notifyUnread(count)).catch(() => undefined);
      }
    });

    socket.connect(activeId).catch(() => setIsConnected(false));

    return () => {
      socket.disconnect();
      setIsConnected(false);
    };
  }, [token, activeId]);

  useEffect(() => {
    if (!token) return;
    const mark = async () => {
      await adminMarkAllSupportMessagesRead(token).catch(() => undefined);
      notifyUnread(0);
    };
    void mark();
  }, [token]);

  const handleSend = async () => {
    if (!token || !activeId || !draft.trim()) return;

    const message = draft.trim();
    setDraft('');

    if (socketRef.current?.isConnected()) {
      socketRef.current.send(message);
      return;
    }

    const ticket = await adminPostSupportMessage(token, activeId, message);
    setMessages(ticket.messages ?? []);
  };

  const handleStatus = async (status: string) => {
    if (!token || !activeId) return;
    await adminUpdateSupportTicketStatus(token, activeId, status);
    await loadTickets(token);
  };

  const handleAssignment = async (assignedToValue: string) => {
    if (!token || !activeId || !isSuperAdmin) return;
    const parsed = Number(assignedToValue);
    const nextAssignee = assignedToValue && !Number.isNaN(parsed) ? parsed : null;
    await adminAssignSupportTicket(token, activeId, nextAssignee);
    if (activeTicket?.user_id) {
      await adminAssignClientSupportOwner(token, activeTicket.user_id, nextAssignee);
    }
    await loadTickets(token);
  };

  if (!token) {
    return <div className="rounded-xl bg-white p-6 text-slate-600 shadow-sm">Please login to access support.</div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">Tickets</h2>
          <button
            onClick={() => token && void loadTickets(token)}
            className="rounded-lg border border-slate-200 p-2 hover:bg-slate-50"
          >
            <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="mt-3 space-y-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search tickets"
              className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2 text-sm"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="">All statuses</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        <div className="mt-4 space-y-2 max-h-[62vh] overflow-y-auto pr-1">
          {visibleTickets.map((ticket) => (
            <button
              key={ticket.id}
              onClick={() => {
                setActiveId(ticket.id);
                setMessages(ticket.messages ?? []);
              }}
              className={`w-full rounded-xl border p-3 text-left ${activeId === ticket.id ? 'border-[#0F766E]/40 bg-[#0F766E]/5' : 'border-slate-200 hover:bg-slate-50'}`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-sm text-slate-800 truncate">{ticket.subject}</p>
                <span className="text-[11px] rounded-full border border-slate-200 px-2 py-0.5 text-slate-600">{ticket.status}</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">{ticket.user_username || ticket.user_email || `User #${ticket.user_id || 'N/A'}`}</p>
              {ticket.assigned_admin_username ? (
                <p className="mt-1 text-[11px] text-slate-500">Support owner: {ticket.assigned_admin_username}</p>
              ) : null}
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col min-h-[62vh]">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Conversation</p>
            <h3 className="text-lg font-semibold text-slate-900">{activeTicket?.subject || 'Select a ticket'}</h3>
          </div>

          {activeTicket ? (
            <div className="flex items-center gap-2">
              {isSuperAdmin ? (
                <select
                  value={activeTicket.assigned_to_admin_id ?? ''}
                  onChange={(event) => void handleAssignment(event.target.value)}
                  className="rounded-lg border border-slate-200 px-2 py-1 text-xs"
                >
                  <option value="">Unassigned</option>
                  {subAdmins.map((admin) => (
                    <option key={admin.id} value={admin.id}>
                      {admin.username}
                    </option>
                  ))}
                </select>
              ) : null}

              <select
                value={activeTicket.status}
                onChange={(event) => void handleStatus(event.target.value)}
                className="rounded-lg border border-slate-200 px-2 py-1 text-xs"
              >
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          ) : null}
        </div>

        <div className="flex-1 overflow-y-auto py-4 space-y-3 bg-slate-50 rounded-xl px-3 mt-3">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.is_admin_reply ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[78%] rounded-2xl px-4 py-2 text-sm ${msg.is_admin_reply ? 'bg-[#0F766E] text-white' : 'bg-white border border-slate-200 text-slate-700'}`}>
                <p>{msg.content}</p>
                <p className={`text-[11px] mt-1 ${msg.is_admin_reply ? 'text-white/70' : 'text-slate-400'}`}>
                  {new Date(msg.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-slate-100 mt-3 pt-3">
          <div className="text-xs text-slate-400 mb-2 inline-flex items-center gap-1">
            <CheckCircle2 className={`w-3 h-3 ${isConnected ? 'text-emerald-500' : 'text-slate-300'}`} />
            {isConnected ? 'Live connected' : 'Live disconnected'}
          </div>

          <div className="flex gap-2">
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Write a reply"
              className="flex-1 min-h-[54px] rounded-xl border border-slate-200 px-3 py-2 text-sm"
            />
            <button
              onClick={() => void handleSend()}
              disabled={!activeId || !draft.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-[#0F766E] px-4 py-2 text-white font-semibold disabled:opacity-60"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Send
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
