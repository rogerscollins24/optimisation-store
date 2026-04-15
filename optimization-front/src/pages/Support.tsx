import { useEffect, useMemo, useRef, useState } from 'react';
import { MessageSquarePlus, SendHorizonal, Sparkles } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useDynamicTranslations } from '../hooks/useDynamicTranslations';
import SupportSocket from '../lib/socket';
import {
  createSupportTicket,
  getSupportTicket,
  listSupportTickets,
  markSupportTicketRead,
  postSupportMessage,
  type SupportMessage,
  type SupportTicket,
} from '../lib/supportApi';

const getTicketTitle = (
  ticket: Partial<SupportTicket> | null | undefined,
  ticketNumberTemplate: string,
  newConversationTitle: string,
) => {
  const subject = String(ticket?.subject ?? '').trim();
  if (!subject || /^null+$/i.test(subject)) {
    return ticket?.id ? ticketNumberTemplate.replace('{{id}}', String(ticket.id)) : newConversationTitle;
  }
  return subject;
};

const normalizeStatus = (status?: string) => {
  const normalized = String(status ?? 'open').replace(/_/g, ' ').trim();
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

export default function Support() {
  const location = useLocation();
  const { user, refreshBadges } = useAuth();
  const { t } = useTranslation();
  const token = user?.access_token ?? null;

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [newSubject, setNewSubject] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);

  const socketRef = useRef<SupportSocket | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const requestedTicketId = useMemo(() => {
    const value = new URLSearchParams(location.search).get('ticket');
    if (!value) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }, [location.search]);

  const activeTicket = useMemo(() => tickets.find((item) => item.id === activeId) ?? null, [tickets, activeId]);
  const ticketNumberTemplate = t('ticketNumber', { id: '{{id}}' });
  const unknownConversationTitle = t('newConversation');

  const dynamicTexts = useMemo(() => {
    const texts: string[] = [];

    tickets.forEach((ticket) => {
      const subject = String(ticket.subject ?? '').trim();
      if (subject) texts.push(subject);
      texts.push(normalizeStatus(ticket.status));
      ticket.messages?.forEach((msg) => {
        const content = String(msg.content ?? '').trim();
        if (content) texts.push(content);
      });
    });

    messages.forEach((msg) => {
      const content = String(msg.content ?? '').trim();
      if (content) texts.push(content);
    });

    return texts;
  }, [messages, tickets]);

  const { translateText } = useDynamicTranslations(dynamicTexts);

  const getStatusLabel = (status?: string) => {
    const normalized = String(status ?? 'open').toLowerCase().trim();
    const statusKey =
      normalized === 'open'
        ? 'statusOpen'
        : normalized === 'closed'
          ? 'statusClosed'
          : normalized === 'pending'
            ? 'statusPending'
            : normalized === 'resolved'
              ? 'statusResolved'
              : normalized === 'in_progress'
                ? 'statusInProgress'
                : normalized === 'pending_debited'
                  ? 'statusPendingDebited'
                  : '';
    if (statusKey) {
      return t(statusKey);
    }
    return translateText(normalizeStatus(status));
  };

  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    const load = async () => {
      try {
        const data = await listSupportTickets(token, { limit: 100 });
        if (cancelled) return;

        setTickets(data);
        if (!showNewChat) {
          setActiveId((current) => {
            if (requestedTicketId && data.some((ticket) => ticket.id === requestedTicketId)) {
              return requestedTicketId;
            }
            if (current && data.some((ticket) => ticket.id === current)) {
              return current;
            }
            return data[0]?.id ?? null;
          });
        }
      } catch {
        // keep existing UI state if refresh fails
      }
    };

    void load();
    const id = window.setInterval(() => void load(), 6000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [token, showNewChat, requestedTicketId]);

  useEffect(() => {
    if (!token || !activeId || showNewChat) return;

    const loadTicket = async () => {
      const ticket = await getSupportTicket(token, activeId);
      setMessages(ticket.messages ?? []);
      await markSupportTicketRead(token, activeId).catch(() => 0);
      await refreshBadges();
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
      if (payload.is_admin_reply) {
        void markSupportTicketRead(token, activeId).catch(() => 0);
      }
      void refreshBadges();
    });
    socket.connect(activeId).catch(() => undefined);

    return () => socket.disconnect();
  }, [token, activeId, showNewChat, refreshBadges]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, showNewChat]);

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
    void refreshBadges();
  };

  const handleCreateChat = async () => {
    if (!token || !newSubject.trim()) return;
    const ticket = await createSupportTicket(token, newSubject.trim(), newMessage.trim() || t('defaultSupportGreeting'));
    setTickets((prev) => [ticket, ...prev]);
    setActiveId(ticket.id);
    setMessages(ticket.messages ?? []);
    setNewSubject('');
    setNewMessage('');
    setShowNewChat(false);
    void refreshBadges();
  };

  if (!token) {
    return <div className="support-texture rounded-[28px] p-6 text-slate-700 shadow-sm">{t('pleaseLoginToAccessSupport')}</div>;
  }

  return (
    <div className="support-texture min-h-full rounded-[30px] p-3 md:p-4">
      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <section className="rounded-[28px] border border-white/50 bg-white/70 p-4 shadow-[0_12px_30px_rgba(15,23,42,0.12)] backdrop-blur-sm">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-700/75">{t('support')}</p>
              <h2 className="text-2xl font-bold text-slate-800">{t('tickets')}</h2>
            </div>
            <button
              onClick={() => {
                setShowNewChat(true);
                setActiveId(null);
                setMessages([]);
              }}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-sky-600 to-cyan-500 px-4 py-2 text-sm font-semibold text-white shadow-md transition-transform hover:-translate-y-0.5"
            >
              <MessageSquarePlus size={16} />
              {t('newChat')}
            </button>
          </div>

          <div className="max-h-[68vh] space-y-2 overflow-y-auto pr-1">
            {tickets.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 px-4 py-6 text-sm text-slate-500">
                {t('noTicketsYet')}
              </div>
            ) : (
              tickets.map((ticket) => (
                <button
                  key={ticket.id}
                  onClick={() => {
                    setShowNewChat(false);
                    setActiveId(ticket.id);
                    setMessages(ticket.messages ?? []);
                  }}
                  className={`w-full rounded-2xl border px-4 py-3 text-left transition-all duration-200 ${
                    activeId === ticket.id && !showNewChat
                      ? 'border-cyan-400 bg-cyan-50/90 shadow-sm'
                      : 'border-slate-200 bg-white/80 hover:border-slate-300 hover:bg-white'
                  }`}
                >
                  <p className="truncate text-sm font-semibold text-slate-800">{translateText(getTicketTitle(ticket, ticketNumberTemplate, unknownConversationTitle))}</p>
                  <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                    <span>{t('ticketNumber', { id: ticket.id })}</span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                      {getStatusLabel(ticket.status)}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </section>

        <section className="flex min-h-[68vh] flex-col rounded-[30px] border border-white/40 bg-white/14 p-4 shadow-[0_14px_32px_rgba(37,99,235,0.14)] backdrop-blur-[2px]">
          <div className="mb-4 rounded-[24px] bg-gradient-to-r from-[#3f629d] via-[#7090c1] to-[#9fb4d6] px-4 py-3 text-white shadow-lg">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-lg font-bold">{showNewChat ? t('startNewChat') : translateText(getTicketTitle(activeTicket, ticketNumberTemplate, unknownConversationTitle))}</p>
                <p className="text-xs text-blue-100">{showNewChat ? t('writeIssueAndSupportWillReply') : getStatusLabel(activeTicket?.status)}</p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold tracking-wide text-white/95">
                <Sparkles size={12} />
                {t('liveSupport')}
              </span>
            </div>
          </div>

          {showNewChat ? (
            <div className="grid flex-1 gap-4 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-[24px] border border-white/35 bg-[#9fb4d6]/70 p-5 shadow-sm backdrop-blur-sm">
                <h3 className="mb-4 text-lg font-bold text-slate-800">{t('createTicket')}</h3>
                <div className="space-y-3">
                  <input
                    value={newSubject}
                    onChange={(event) => setNewSubject(event.target.value)}
                    placeholder={t('subject')}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-cyan-400 focus:bg-white"
                  />
                  <textarea
                    value={newMessage}
                    onChange={(event) => setNewMessage(event.target.value)}
                    placeholder={t('describeYourIssue')}
                    className="min-h-[180px] w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-cyan-400 focus:bg-white"
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={() => void handleCreateChat()}
                      disabled={!newSubject.trim()}
                      className="rounded-2xl bg-gradient-to-r from-cyan-600 to-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {t('createTicket')}
                    </button>
                    <button
                      onClick={() => setShowNewChat(false)}
                      className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700"
                    >
                      {t('cancel')}
                    </button>
                  </div>
                </div>
              </div>

              <div className="rounded-[24px] border border-white/30 bg-[#6f8fbe]/72 p-5 text-white shadow-sm">
                <h3 className="text-lg font-bold">{t('needHelpFast')}</h3>
                <p className="mt-3 text-sm text-blue-100">{t('supportConversationHint')}</p>
                <div className="mt-5 rounded-2xl bg-white/10 p-4 text-sm text-blue-50">
                  {t('supportTip')}
                </div>
              </div>
            </div>
          ) : activeTicket ? (
            <>
              <div className="flex-1 space-y-3 overflow-y-auto rounded-[24px] bg-[#a9bddf]/72 p-4 backdrop-blur-[2px] md:p-6">
                {messages.length === 0 ? (
                  <div className="rounded-2xl bg-white/70 px-4 py-6 text-sm text-slate-600 shadow-sm">
                    {t('noMessagesYet')}
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.is_admin_reply ? 'justify-start' : 'justify-end'}`}>
                      <div
                        className={`max-w-[80%] rounded-[20px] px-4 py-3 text-sm shadow-sm ${
                          msg.is_admin_reply
                            ? 'border border-slate-200 bg-white text-slate-700'
                            : 'bg-[#173f99] text-white'
                        }`}
                      >
                        <p>{translateText(msg.content)}</p>
                        <p className={`mt-1 text-[11px] ${msg.is_admin_reply ? 'text-slate-400' : 'text-blue-100'}`}>
                          {new Date(msg.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={bottomRef} />
              </div>

              <div className="mt-4 flex gap-2 rounded-[24px] bg-[#6f8fbe]/78 p-3 shadow-inner">
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
                  className="flex-1 rounded-2xl border border-white/20 bg-white/90 px-4 py-3 text-slate-800 outline-none"
                />
                <button
                  onClick={() => void handleSend()}
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-sky-500 px-4 py-3 font-semibold text-white shadow-md transition hover:brightness-105"
                >
                  <SendHorizonal size={16} />
                  {t('send')}
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center rounded-[24px] bg-[#a9bddf]/72 p-6 text-center text-slate-700">
              <div>
                <p className="text-lg font-bold">{t('noTicketSelected')}</p>
                <p className="mt-2 text-sm text-slate-600">{t('chooseTicketOrStartChat')}</p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
