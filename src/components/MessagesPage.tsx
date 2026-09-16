import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  UserCheck,
  ShieldAlert,
  Clock,
  CheckCheck,
  Search,
} from 'lucide-react';
import { Conversation, Message } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { BackButton } from './BackButton';

interface MessagesPageProps {
  onBack?: () => void;
  onNavigate?: (view: string) => void;
}

export const MessagesPage: React.FC<MessagesPageProps> = ({ onBack, onNavigate }) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadConversations = async () => {
    setLoading(true);
    try {
      const res = await api.getConversations();
      setConversations(res.conversations);
      if (res.conversations.length > 0 && !activeConvId) {
        setActiveConvId(res.conversations[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, [user?.id]);

  useEffect(() => {
    if (!activeConvId) return;
    api
      .getMessages(activeConvId)
      .then(res => {
        setMessages(res.messages);
        setErrorMessage(null);
      })
      .catch(err => {
        console.error(err);
      });
  }, [activeConvId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !activeConvId) return;

    setSending(true);
    setErrorMessage(null);
    try {
      const res = await api.sendMessage(activeConvId, messageInput.trim());
      setMessages(prev => [...prev, res.message]);
      setMessageInput('');
      loadConversations();
    } catch (err: any) {
      setErrorMessage(
        err.message ||
          'Messaging policy: You can only message tutors or students with an active booking relationship.'
      );
    } finally {
      setSending(false);
    }
  };

  const activeConversation = conversations.find(c => c.id === activeConvId);
  const activePartnerName = activeConversation
    ? user?.role === 'STUDENT'
      ? activeConversation.tutorName
      : activeConversation.studentName
    : '';

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Navigation Back Option */}
        <div className="flex items-center justify-between">
          <BackButton
            onClick={
              onBack ||
              (() =>
                onNavigate?.(
                  user?.role === 'TUTOR' ? 'tutor-dashboard' : 'student-dashboard'
                ))
            }
            label={user?.role === 'TUTOR' ? 'Back to Faculty Dashboard' : 'Back to Dashboard'}
          />
          <span className="text-xs text-slate-500">
            Active Threads: <strong>{conversations.length}</strong>
          </span>
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
            Protected Messages
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Direct communication between enrolled students and verified instructors.
          </p>
        </div>

        {/* Messaging Safe Policy Banner */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-center gap-3 text-xs text-blue-900">
          <ShieldAlert className="w-5 h-5 text-blue-600 flex-shrink-0" />
          <span>
            <strong>Safety & Escrow Policy:</strong> For student and instructor protection,
            messaging is reserved for verified pairs with active or scheduled session bookings. Keep
            all lesson coordination on platform.
          </span>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[550px]">
          {/* Conversation Sidebar (4 cols) */}
          <div className="md:col-span-4 border-r border-slate-200 flex flex-col">
            <div className="p-4 border-b border-slate-100">
              <span className="font-extrabold text-slate-900 text-xs uppercase tracking-wider block">
                Conversations
              </span>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {loading ? (
                <div className="p-6 text-center text-xs text-slate-400">Loading chats...</div>
              ) : conversations.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  No active conversations found. Book a session to connect with a tutor.
                </div>
              ) : (
                conversations.map(c => {
                  const partnerName = user?.role === 'STUDENT' ? c.tutorName : c.studentName;
                  const unread = user?.role === 'STUDENT' ? c.unreadCountStudent : c.unreadCountTutor;
                  const avatar = `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80`;

                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setActiveConvId(c.id)}
                      className={`w-full p-4 text-left flex items-start gap-3 transition-colors ${
                        activeConvId === c.id
                          ? 'bg-blue-50/70 border-l-4 border-blue-600'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <img
                        src={avatar}
                        alt={partnerName}
                        className="w-10 h-10 rounded-full object-cover border border-slate-200"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-xs text-slate-900 truncate">{partnerName}</h4>
                          {unread > 0 && (
                            <span className="px-1.5 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold">
                              {unread}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {c.lastMessage}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Active Chat Thread (8 cols) */}
          <div className="md:col-span-8 flex flex-col justify-between">
            {activeConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <div className="flex items-center gap-3">
                    <img
                      src={`https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80`}
                      alt={activePartnerName}
                      className="w-9 h-9 rounded-full object-cover"
                    />
                    <div>
                      <h3 className="font-bold text-xs text-slate-900">{activePartnerName}</h3>
                      <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                        Verified Learning Connection • {activeConversation.subject}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Error Banner if any */}
                {errorMessage && (
                  <div className="p-3 bg-red-50 border-b border-red-100 text-red-800 text-xs">
                    {errorMessage}
                  </div>
                )}

                {/* Messages List */}
                <div className="flex-1 p-5 overflow-y-auto space-y-4 max-h-[420px]">
                  {messages.map(m => {
                    const isMe = m.senderId === user?.id;
                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-md p-3.5 rounded-2xl text-xs leading-relaxed ${
                            isMe
                              ? 'bg-blue-600 text-white rounded-br-none shadow-sm'
                              : 'bg-slate-100 text-slate-800 rounded-bl-none'
                          }`}
                        >
                          <p>{m.content}</p>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1 px-1">
                          <span>
                            {new Date(m.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          {isMe && <CheckCheck className="w-3 h-3 text-blue-500" />}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Message Input Form */}
                <form
                  onSubmit={handleSendMessage}
                  className="p-3.5 border-t border-slate-100 flex items-center gap-2 bg-white"
                >
                  <input
                    type="text"
                    value={messageInput}
                    onChange={e => setMessageInput(e.target.value)}
                    placeholder="Type a message regarding your lesson..."
                    className="flex-1 py-2.5 px-4 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={sending || !messageInput.trim()}
                    className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl shadow-sm transition-all"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center p-8 text-slate-400 text-xs">
                Select a conversation from the sidebar to view messages.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
