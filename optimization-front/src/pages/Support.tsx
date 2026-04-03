import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import SupportSocket from '../lib/socket';
import {
  getSupportTicket,
  listSupportTickets,
  postSupportMessage,
  type SupportMessage,
  type SupportTicket,
} from '../lib/supportApi';

export default function Support() {
  const { user } = useAuth();
  const token = user?.access_token ?? null;

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [status, setStatus] = useState('all');

  const socketRef = useRef<SupportSocket | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const activeTicket = useMemo(() => tickets.find((item) => item.id === activeId) ?? null, [tickets, activeId]);

  useEffect(() => {
    if (!token) return;
    const load = async () => {
      const data = await listSupportTickets(token, {
        status: status === 'all' ? undefined : status,
        limit: 100,
      });
      setTickets(data);
      if (!activeId && data.length > 0) {
        setActiveId(data[0].id);
        setMessages(data[0].messages ?? []);
      }
    };

    void load();
    const id = window.setInterval(() => void load(), 6000);
    return () => window.clearInterval(id);
  }, [token, status, activeId]);

  useEffect(() => {
    if (!token || !activeId) return;

    const loadTicket = async () => {
      const ticket = await getSupportTicket(token, activeId);
      setMessages(ticket.messages ?? []);
    };

    void loadTicket();

    if (socketRef.current) socketRef.current.disconnect();
    const socket = new SupportSocket(token);
    socketRef.current = socket;
    socket.onMessage((payload) => {
      setMessages((prev) => {
        if (prev.some((msg) => msg.id === payload.id)) return prev;
        return [...prev, payload];
      });
    });
    socket.connect(activeId).catch(() => undefined);

    return () => socket.disconnect();
  }, [token, activeId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!token || !activeId || !draft.trim()) return;
    const text = draft.trim();
    setDraft('');

    if (socketRef.current?.isConnected()) {
      socketRef.current.send(text);
      return;
    }

    const ticket = await postSupportMessage(token, activeId, text);
    setMessages(ticket.messages ?? []);
  };

  if (!token) {
    return <div className="rounded-xl bg-white p-6 text-slate-600 shadow-sm">Please login to access support.</div>;
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-slate-800">Support Tickets</h2>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="rounded-lg border border-slate-300 px-2 py-1 text-sm"
          >
            <option value="all">All</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        <div className="space-y-2 max-h-[65vh] overflow-y-auto">
          {tickets.map((ticket) => (
            <button
              key={ticket.id}
              onClick={() => {
                setActiveId(ticket.id);
                setMessages(ticket.messages ?? []);
              }}
              className={`w-full text-left rounded-lg border px-3 py-2 ${activeId === ticket.id ? 'border-cyan-400 bg-cyan-50' : 'border-slate-200 bg-white'}`}
            >
              <p className="font-semibold text-sm text-slate-800 truncate">{ticket.subject}</p>
              <p className="text-xs text-slate-500 mt-1">Ticket #{ticket.id}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col min-h-[65vh]">
        <h3 className="font-bold text-slate-800 mb-3">{activeTicket ? activeTicket.subject : 'Select a ticket'}</h3>

        <div className="flex-1 overflow-y-auto bg-slate-50 rounded-lg p-3 space-y-3">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.is_admin_reply ? 'justify-start' : 'justify-end'}`}>
              <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${msg.is_admin_reply ? 'bg-white border border-slate-200 text-slate-700' : 'bg-cyan-500 text-white'}`}>
                <p>{msg.content}</p>
                <p className={`text-[11px] mt-1 ${msg.is_admin_reply ? 'text-slate-400' : 'text-cyan-100'}`}>{new Date(msg.created_at).toLocaleString()}</p>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <div className="mt-3 flex gap-2">
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                void handleSend();
              }
            }}
            placeholder="Type a message"
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2"
          />
          <button onClick={() => void handleSend()} className="rounded-lg bg-cyan-600 px-4 text-white font-semibold">Send</button>
        </div>
      </section>
    </div>
  );
}
