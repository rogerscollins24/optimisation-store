import { useEffect, useMemo, useRef, useState } from 'react';
import { MessageCircle, Send, X } from 'lucide-react';
import SupportSocket from '../lib/socket';
import { useTranslation } from 'react-i18next';
import { useDynamicTranslations } from '../hooks/useDynamicTranslations';
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
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [subject, setSubject] = useState('');
  const [loading, setLoading] = useState(false);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const dynamicTexts = useMemo(() => {
    const texts: string[] = [];
    if (ticket?.subject) texts.push(ticket.subject);
    if (ticket?.status) texts.push(String(ticket.status).replace(/_/g, ' '));
    messages.forEach((msg) => {
      const content = String(msg.content || '').trim();
      if (content) texts.push(content);
    });
    return texts;
  }, [messages, ticket?.status, ticket?.subject]);

  const { translateText } = useDynamicTranslations(dynamicTexts);

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
      const nextTicket = await createSupportTicket(token, subject.trim(), draft.trim() || t('defaultSupportGreeting'));
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
    <div className="fixed bottom-4 right-3 z-[110] sm:bottom-6 sm:right-6">
      {isOpen ? (
        <div className="flex h-[72vh] max-h-[560px] w-[calc(100vw-1.5rem)] max-w-[360px] flex-col overflow-hidden rounded-2xl border border-[#67563f]/45 bg-[#efe5d6] shadow-2xl sm:h-[560px]">
          <div className="flex items-center justify-between bg-[linear-gradient(120deg,#2b2824_0%,#1b1917_58%,#3a2a18_100%)] px-3.5 py-3 text-white sm:px-5 sm:py-4">
            <div>
              <p className="text-xl font-bold leading-none sm:text-2xl">{t('supportChat')}</p>
              <p className="mt-1 text-xs text-amber-100/75 sm:text-sm">{ticket?.status ? translateText(String(ticket.status).replace(/_/g, ' ')) : t('newChat')}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setShowNewTicket(true);
                  setSubject('');
                  setDraft('');
                }}
                className="rounded border border-amber-100/35 px-2 py-1 text-[10px] hover:bg-black/10 sm:text-xs"
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
            <div className="flex flex-1 flex-col gap-3 p-3 sm:gap-4 sm:p-4">
              <p className="font-semibold text-[#3f3328]">{t('startSupportRequest')}</p>
              <input
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                placeholder={t('subject')}
                className="client-input rounded-lg px-3 py-2"
              />
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder={t('enterYourMessage')}
                className="client-input min-h-[100px] rounded-lg px-3 py-2 sm:min-h-[120px]"
              />
              <button onClick={handleCreateTicket} className="client-btn-primary rounded-lg py-2 font-semibold">
                {t('createTicket')}
              </button>
            </div>
          ) : (
            <>
              <div className="flex-1 space-y-2.5 overflow-y-auto bg-[#e6d9c5] p-3 sm:space-y-3 sm:p-4">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.is_admin_reply ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[90%] rounded-2xl px-3 py-2.5 text-sm sm:max-w-[80%] sm:px-4 sm:py-3 ${msg.is_admin_reply ? 'border border-[#ccbda7] bg-white text-[#46382c]' : 'bg-[#2d2a25] text-[#f9f1e4]'}`}>
                      <p>{translateText(msg.content)}</p>
                      <p className={`text-[11px] mt-1 ${msg.is_admin_reply ? 'text-slate-400' : 'text-cyan-100'}`}>
                        {new Date(msg.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>

              <div className="border-t border-[#c8b9a2] bg-[#f2e8da] p-2.5 sm:p-3">
                <div className="mb-2 text-xs text-[#7f6f5d]">{isConnected ? t('connected') : t('reconnecting')}</div>
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
                    className="client-input flex-1 rounded-lg px-3 py-2 text-sm"
                  />
                  <button onClick={() => void handleSend()} className="client-btn-primary rounded-lg p-2">
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
          className="relative flex h-12 w-12 items-center justify-center rounded-full border border-amber-500/35 bg-[radial-gradient(circle_at_35%_25%,#bf8a45_0%,#7d5527_64%,#3a2917_100%)] text-white shadow-lg sm:h-14 sm:w-14"
        >
          {supportUnreadCount > 0 ? (
            <span className="absolute -right-1 -top-1 min-w-[20px] rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
              {supportUnreadCount > 99 ? '99+' : supportUnreadCount}
            </span>
          ) : null}
          <MessageCircle size={22} />
        </button>
      )}
    </div>
  );
}
