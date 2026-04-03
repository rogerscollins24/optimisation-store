import { useEffect, useRef, useState } from 'react';
import { MessageCircle, Send, X } from 'lucide-react';
import SupportSocket from '../lib/socket';
import {
  createSupportTicket,
  listSupportTickets,
  postSupportMessage,
  type SupportMessage,
  type SupportTicket,
} from '../lib/supportApi';

type ChatModalProps = {
  token: string | null;
  presetMessage?: string | null;
  presetSubject?: string | null;
  openSignal?: number;
};

export default function ChatModal({ token, presetMessage, presetSubject, openSignal }: ChatModalProps) {
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
  };

  if (!token) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[110]">
      {isOpen ? (
        <div className="w-[360px] h-[560px] rounded-2xl overflow-hidden shadow-2xl border border-gray-200 bg-white flex flex-col">
          <div className="bg-gradient-to-r from-cyan-500 to-teal-500 text-white px-5 py-4 flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold leading-none">Support Chat</p>
              <p className="text-cyan-100 mt-1 text-sm">{ticket?.status?.replace('_', ' ') || 'New conversation'}</p>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-1 rounded hover:bg-black/10">
              <X size={24} />
            </button>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center text-slate-500">Loading...</div>
          ) : showNewTicket ? (
            <div className="flex-1 p-4 flex flex-col gap-4">
              <p className="font-semibold text-slate-700">Start a support request</p>
              <input
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                placeholder="Subject"
                className="rounded-lg border border-slate-300 px-3 py-2"
              />
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                placeholder="Message"
                className="rounded-lg border border-slate-300 px-3 py-2 min-h-[120px]"
              />
              <button onClick={handleCreateTicket} className="bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg py-2 font-semibold">
                Create Ticket
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
                <div className="text-xs text-slate-400 mb-2">{isConnected ? 'Connected' : 'Reconnecting...'}</div>
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
                    placeholder="Type a message..."
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
          className="h-14 w-14 rounded-full shadow-lg bg-gradient-to-r from-cyan-500 to-teal-500 text-white flex items-center justify-center"
        >
          <MessageCircle size={26} />
        </button>
      )}
    </div>
  );
}
