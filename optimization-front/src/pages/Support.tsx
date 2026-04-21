import { useEffect, useMemo, useRef, useState } from 'react';
import { MessageSquarePlus, SendHorizonal, Sparkles } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useDynamicTranslations } from '../hooks/useDynamicTranslations';
import SupportSocket from '../lib/socket';
import { formatLocalizedDateTime } from '../lib/dateFormatting';
import { getStatusTranslationKey, humanizeStatus } from '../lib/statusLabels';
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

export default function Support() {
  const location = useLocation();
  const { user, refreshBadges } = useAuth();
  const { t, i18n } = useTranslation();
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
      if (ticket.status && !getStatusTranslationKey(ticket.status)) {
        texts.push(humanizeStatus(ticket.status));
      }
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
  const locale = i18n.resolvedLanguage || i18n.language || 'en';

  const getStatusLabel = (status?: string) => {
    const statusKey = getStatusTranslationKey(status);
    if (statusKey) {
      return t(statusKey);
    }
    return translateText(humanizeStatus(status));
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
    return <div className="client-card rounded-[28px] p-6 text-[#4f4032] shadow-sm">{t('pleaseLoginToAccessSupport')}</div>;
  }

  return (
    <div className="client-page min-h-full rounded-[24px] p-2.5 sm:rounded-[30px] sm:p-3 md:p-4">
      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <section className="client-card rounded-[22px] p-3.5 backdrop-blur-sm sm:rounded-[28px] sm:p-4">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#896a41]">{t('support')}</p>
              <h2 className="text-xl font-bold text-[#3b3025] sm:text-2xl">{t('tickets')}</h2>
            </div>
            <button
              onClick={() => {
                setShowNewChat(true);
                setActiveId(null);
                setMessages([]);
              }}
              className="client-btn-primary inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-xs font-semibold shadow-md transition-transform hover:-translate-y-0.5 sm:px-4 sm:text-sm"
            >
              <MessageSquarePlus size={16} />
              {t('newChat')}
            </button>
          </div>

          <div className="max-h-[38vh] space-y-2 overflow-y-auto pr-1 sm:max-h-[68vh]">
            {tickets.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#b9a68c] bg-white/70 px-4 py-6 text-sm text-[#73614d]">
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
                      ? 'border-amber-500/40 bg-[#f6ead6] shadow-sm'
                      : 'border-[#d9c8b1] bg-white/80 hover:border-[#baa589] hover:bg-white'
                  }`}
                >
                  <p className="truncate text-sm font-semibold text-[#3b3025]">{translateText(getTicketTitle(ticket, ticketNumberTemplate, unknownConversationTitle))}</p>
                  <div className="mt-1 flex items-center justify-between text-xs text-[#70604f]">
                    <span>{t('ticketNumber', { id: ticket.id })}</span>
                    <span className="rounded-full bg-[#efe1cc] px-2 py-0.5 text-[10px] font-medium text-[#705840]">
                      {getStatusLabel(ticket.status)}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </section>

        <section className="client-card flex min-h-[60vh] flex-col rounded-[24px] p-3 backdrop-blur-[2px] sm:min-h-[68vh] sm:rounded-[30px] sm:p-4">
          <div className="client-card-dark mb-3 rounded-[20px] px-3 py-2.5 shadow-lg sm:mb-4 sm:rounded-[24px] sm:px-4 sm:py-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-base font-bold sm:text-lg">{showNewChat ? t('startNewChat') : translateText(getTicketTitle(activeTicket, ticketNumberTemplate, unknownConversationTitle))}</p>
                <p className="text-xs text-amber-100/75">{showNewChat ? t('writeIssueAndSupportWillReply') : getStatusLabel(activeTicket?.status)}</p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-amber-100 sm:px-3 sm:text-[11px]">
                <Sparkles size={12} />
                {t('liveSupport')}
              </span>
            </div>
          </div>

          {showNewChat ? (
            <div className="grid flex-1 gap-4 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="client-card rounded-[24px] p-5 shadow-sm backdrop-blur-sm">
                <h3 className="mb-4 text-lg font-bold text-[#3f3227]">{t('createTicket')}</h3>
                <div className="space-y-3">
                  <input
                    value={newSubject}
                    onChange={(event) => setNewSubject(event.target.value)}
                    placeholder={t('subject')}
                    className="client-input w-full rounded-2xl px-4 py-3 text-sm"
                  />
                  <textarea
                    value={newMessage}
                    onChange={(event) => setNewMessage(event.target.value)}
                    placeholder={t('describeYourIssue')}
                    className="client-input min-h-[140px] w-full rounded-2xl px-4 py-3 text-sm sm:min-h-[180px]"
                  />
                  <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
                    <button
                      onClick={() => void handleCreateChat()}
                      disabled={!newSubject.trim()}
                      className="client-btn-primary rounded-2xl px-4 py-2.5 text-sm font-semibold shadow-md transition disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {t('createTicket')}
                    </button>
                    <button
                      onClick={() => setShowNewChat(false)}
                      className="client-btn-secondary rounded-2xl px-4 py-2.5 text-sm font-semibold"
                    >
                      {t('cancel')}
                    </button>
                  </div>
                </div>
              </div>

              <div className="client-card-dark rounded-[24px] p-5 shadow-sm">
                <h3 className="text-lg font-bold">{t('needHelpFast')}</h3>
                <p className="mt-3 text-sm text-amber-100/75">{t('supportConversationHint')}</p>
                <div className="mt-5 rounded-2xl bg-white/10 p-4 text-sm text-amber-50/95">
                  {t('supportTip')}
                </div>
              </div>
            </div>
          ) : activeTicket ? (
            <>
              <div className="flex-1 space-y-3 overflow-y-auto rounded-[20px] bg-[#ece0cd]/85 p-3.5 backdrop-blur-[2px] sm:rounded-[24px] sm:p-4 md:p-6">
                {messages.length === 0 ? (
                  <div className="rounded-2xl bg-white/70 px-4 py-6 text-sm text-[#6f5f4c] shadow-sm">
                    {t('noMessagesYet')}
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.is_admin_reply ? 'justify-start' : 'justify-end'}`}>
                      <div
                        className={`max-w-[90%] rounded-[18px] px-3 py-2.5 text-sm shadow-sm sm:max-w-[80%] sm:rounded-[20px] sm:px-4 sm:py-3 ${
                          msg.is_admin_reply
                            ? 'border border-[#d5c3a9] bg-white text-[#413327]'
                            : 'bg-[#2a2723] text-[#f9f2e7]'
                        }`}
                      >
                        <p>{translateText(msg.content)}</p>
                        <p className={`mt-1 text-[11px] ${msg.is_admin_reply ? 'text-[#8a7864]' : 'text-amber-100/70'}`}>
                          {formatLocalizedDateTime(msg.created_at, locale)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={bottomRef} />
              </div>

              <div className="mt-3 flex flex-col gap-2 rounded-[20px] bg-[#d9c7ae]/80 p-2.5 shadow-inner sm:mt-4 sm:flex-row sm:rounded-[24px] sm:p-3">
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
                  className="client-input flex-1 rounded-2xl px-3 py-2.5 sm:px-4 sm:py-3"
                />
                <button
                  onClick={() => void handleSend()}
                  className="client-btn-primary inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 font-semibold shadow-md transition hover:brightness-105 sm:py-3"
                >
                  <SendHorizonal size={16} />
                  {t('send')}
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center rounded-[24px] bg-[#ece0cd]/85 p-6 text-center text-[#5f4f3e]">
              <div>
                <p className="text-lg font-bold">{t('noTicketSelected')}</p>
                <p className="mt-2 text-sm text-[#766552]">{t('chooseTicketOrStartChat')}</p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
