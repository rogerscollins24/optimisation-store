import { useEffect, useRef, useState } from 'react';
import { MessageCircle, Send, X } from 'lucide-react';
import SupportSocket from '../lib/socket';
import { useLanguage } from '../context/LanguageContext';
import {
  createSupportTicket,
  listSupportTickets,
  markSupportTicketRead,
  postSupportMessage,
  type SupportMessage,
  type SupportTicket,
} from '../lib/supportApi';
import { useAuth } from '../context/AuthContext';

type ChatModalProps = {
  token: string | null;
  presetMessage?: string | null;
  presetSubject?: string | null;
  openSignal?: number;
};

export default function ChatModal({ token, presetMessage, presetSubject, openSignal }: ChatModalProps) {
  const { supportUnreadCount, refreshBadges } = useAuth();
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [subject, setSubject] = useState('');
  const [loading, setLoading] = useState(false);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const socketRef = useRef<SupportSocket | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  useEffect(() => {
    if (openSignal === undefined || openSignal < 0) return;
    setIsOpen(true);
    if (presetSubject) setSubject(presetSubject);
    if (presetMessage) setDraft(presetMessage);
  }, [openSignal, presetMessage, presetSubject]);

  useEffect(() => {
    if (!isOpen || !token) return;

    const load = async () => {
      setLoading(true);
      try {
        const tickets = await listSupportTickets(token, { limit: 1 });
        if (tickets.length > 0) {
          const latest = tickets[0];
          setTicket(latest);
          setMessages(latest.messages ?? []);
          setShowNewTicket(false);
          await markSupportTicketRead(token, latest.id).catch(() => 0);
          void refreshBadges();
          connectSocket(token, latest.id);
        } else {
          setShowNewTicket(true);
        }
      } finally {
        setLoading(false);
      }
    };

    void load();

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
      setIsConnected(false);
    };
  }, [isOpen, token]);

  function connectSocket(nextToken: string, ticketId: number) {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    const socket = new SupportSocket(nextToken);
    socketRef.current = socket;

    socket.onConnect(() => setIsConnected(true));
    socket.onMessage((payload) => {
      setMessages((prev) => {
        if (prev.some((msg) => msg.id === payload.id)) return prev;
        return [...prev, payload];
      });
      if (payload.is_admin_reply) {
        void markSupportTicketRead(nextToken, ticketId).catch(() => 0);
      }
      void refreshBadges();
    });

    socket.connect(ticketId).catch(() => setIsConnected(false));
  }

  const handleCreateTicket = async () => {
    if (!token || !subject.trim()) return;
    setLoading(true);
    try {
      const nextTicket = await createSupportTicket(token, subject.trim(), draft.trim() || 'Hello, I need help.');
      setTicket(nextTicket);
      setMessages(nextTicket.messages ?? []);
      setShowNewTicket(false);
      setDraft('');
      void refreshBadges();
      connectSocket(token, nextTicket.id);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!token || !ticket || !draft.trim()) return;

    const message = draft.trim();
    setDraft('');

    if (socketRef.current?.isConnected()) {
      socketRef.current.send(message);
      return;
    }

    const updated = await postSupportMessage(token, ticket.id, message);
    setMessages(updated.messages ?? []);
    void refreshBadges();
  };

  if (!token) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[110]">
      {isOpen ? (
        <div className="w-[360px] h-[560px] rounded-2xl overflow-hidden shadow-2xl border border-gray-200 bg-white flex flex-col">
          <div className="bg-gradient-to-r from-cyan-500 to-teal-500 text-white px-5 py-4 flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold leading-none">{t('support')} Chat</p>
              <p className="text-cyan-100 mt-1 text-sm">{ticket?.status?.replace('_', ' ') || t('newChat')}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setShowNewTicket(true);
                  setSubject('');
                  setDraft('');
                }}
                className="text-xs px-2 py-1 rounded border border-white/50 hover:bg-black/10"
              >
                {t('newChat')}
              </button>
              <button onClick={() => setIsOpen(false)} className="p-1 rounded hover:bg-black/10">
                <X size={24} />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center text-slate-500">{t('loading')}</div>
          ) : showNewTicket ? (
            <div className="flex-1 p-4 flex flex-col gap-4">
              <p className="font-semibold text-slate-700">{t('startSupportRequest')}</p>
              <input
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                placeholder={t('subject')}
                className="rounded-lg border border-slate-300 px-3 py-2"
              />
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder={t('enterYourMessage')}
                className="rounded-lg border border-slate-300 px-3 py-2 min-h-[120px]"
              />
              <button onClick={handleCreateTicket} className="bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg py-2 font-semibold">
                {t('createTicket')}
              </button>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto bg-slate-50 p-4 space-y-3">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.is_admin_reply ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${msg.is_admin_reply ? 'bg-white text-slate-700 border border-slate-200' : 'bg-cyan-500 text-white'}`}>
                      <p>{msg.content}</p>
                      <p className={`text-[11px] mt-1 ${msg.is_admin_reply ? 'text-slate-400' : 'text-cyan-100'}`}>
                        {new Date(msg.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              <div className="border-t border-slate-200 p-3 bg-white">
                <div className="text-xs text-slate-400 mb-2">{isConnected ? t('connected') : t('reconnecting')}</div>
                <div className="flex gap-2">
                  <input
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        void handleSend();
                      }
                    }}
                    placeholder={t('enterYourMessage')}
                    className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                  <button onClick={() => void handleSend()} className="bg-cyan-500 hover:bg-cyan-600 rounded-lg p-2 text-white">
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-lg"
        >
          {supportUnreadCount > 0 ? (
            <span className="absolute -right-1 -top-1 min-w-[20px] rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
              {supportUnreadCount > 99 ? '99+' : supportUnreadCount}
            </span>
          ) : null}
          <MessageCircle size={26} />
        </button>
      )}
    </div>
  );
}
