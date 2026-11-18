import { useState, useEffect, useRef } from 'react';
import API from '../services/api';
import { useAuth } from '../context/useAuth';

export default function ChatHub({ title = 'Communication Hub' }) {
  const { user } = useAuth();
  const currentUserId = (user?.id || user?._id)?.toString();

  const [conversations, setConversations] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingConv, setLoadingConv] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Helper to extract user ID safely
  const getUserId = (u) => (u?._id || u?.id)?.toString();

  // Load conversations
  const fetchConversations = async () => {
    try {
      const res = await API.get('/messages/conversations');
      if (res.data?.success) {
        setConversations(Array.isArray(res.data.data) ? res.data.data : []);
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
    } finally {
      setLoadingConv(false);
    }
  };

  // Load available contacts
  const fetchContacts = async () => {
    try {
      const res = await API.get('/messages/contacts');
      if (res.data?.success) {
        setContacts(Array.isArray(res.data.data) ? res.data.data : []);
      }
    } catch (err) {
      console.error('Error fetching contacts:', err);
    }
  };

  // Load message history with selected user
  const fetchMessages = async (otherUserId) => {
    if (!otherUserId) return;
    try {
      const res = await API.get(`/messages/history/${otherUserId}`);
      if (res.data?.success) {
        setMessages(Array.isArray(res.data.data) ? res.data.data : []);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => {
    fetchConversations();
    fetchContacts();
  }, []);

  // Poll for messages when a chat is open
  useEffect(() => {
    const otherId = getUserId(selectedUser);
    if (!otherId) return;

    setLoadingMessages(true);
    fetchMessages(otherId);

    const interval = setInterval(() => {
      fetchMessages(otherId);
      fetchConversations();
    }, 3000);

    return () => clearInterval(interval);
  }, [selectedUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const otherId = getUserId(selectedUser);
    if (!newMessage.trim() || !otherId || sending) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      const res = await API.post('/messages', {
        recipientId: otherId,
        text: messageText,
      });

      if (res.data?.success) {
        setMessages((prev) => [...prev, res.data.data]);
        fetchConversations();
      }
    } catch (err) {
      console.error('Error sending message:', err);
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const filteredConversations = (conversations || []).filter((c) =>
    c.user?.fullName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredContacts = (contacts || []).filter((c) =>
    c.fullName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[calc(100vh-140px)] min-h-[500px]">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <span>💬</span> {title}
          </h2>
          <p className="text-xs text-slate-500">
            {user?.role === 'parent'
              ? "Direct, secure communication with your child's teachers"
              : 'Direct communication with enrolled student parents'}
          </p>
        </div>
        <button
          onClick={() => setShowNewChatModal(true)}
          className="text-xs md:text-sm bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-xl transition shadow-sm flex items-center gap-1.5"
        >
          <span>+</span> New Chat
        </button>
      </div>

      {/* Main Chat Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Conversations List */}
        <div
          className={`w-full md:w-80 lg:w-96 border-r border-slate-200 flex flex-col bg-slate-50/50 ${
            selectedUser ? 'hidden md:flex' : 'flex'
          }`}
        >
          <div className="p-3 border-b border-slate-200 bg-white">
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-100 rounded-lg border-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {loadingConv ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading conversations...</div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                <p>No active conversations yet.</p>
                <p className="mt-1">Click "+ New Chat" to start messaging.</p>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const convUserId = getUserId(conv.user);
                const isSelected = getUserId(selectedUser) === convUserId;
                const lastMsgSenderId = (
                  conv.lastMessage?.sender?._id ||
                  conv.lastMessage?.sender?.id ||
                  conv.lastMessage?.sender
                )?.toString();
                const isLastMsgMine = currentUserId && lastMsgSenderId === currentUserId;

                return (
                  <button
                    key={convUserId || Math.random()}
                    onClick={() => setSelectedUser(conv.user)}
                    className={`w-full text-left p-3.5 transition flex items-start gap-3 ${
                      isSelected ? 'bg-indigo-50/90 border-l-4 border-indigo-600' : 'hover:bg-slate-100/70'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center text-sm shadow-sm flex-shrink-0">
                      {conv.user?.fullName?.charAt(0) || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <p className="text-sm font-semibold text-slate-800 truncate">
                          {conv.user?.fullName}
                        </p>
                        <span className="text-[10px] text-slate-400">
                          {conv.lastMessage?.createdAt
                            ? new Date(conv.lastMessage.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : ''}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-slate-500 truncate mt-1">
                        {isLastMsgMine && (
                          <span
                            className={`font-semibold text-[10px] px-1.5 py-0.5 rounded ${
                              conv.lastMessage?.read
                                ? 'bg-emerald-100 text-emerald-800 font-bold'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                            title={conv.lastMessage?.read ? 'ተነቧል (Read)' : 'ደርሷል (Delivered)'}
                          >
                            {conv.lastMessage?.read ? '✓✓ ተነቧል' : '✓ ደርሷል'}
                          </span>
                        )}
                        <span className="truncate">{conv.lastMessage?.text || 'No messages'}</span>
                      </div>

                      <span className="inline-block mt-1 text-[10px] font-medium uppercase px-1.5 py-0.5 rounded bg-slate-200 text-slate-600">
                        {conv.user?.role}
                      </span>
                    </div>

                    {conv.unreadCount > 0 && (
                      <span className="shrink-0 bg-emerald-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow-sm animate-pulse">
                        {conv.unreadCount} አዲስ
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Message Window */}
        <div className={`flex-1 flex flex-col bg-slate-50 ${!selectedUser ? 'hidden md:flex' : 'flex'}`}>
          {selectedUser ? (
            <>
              {/* Chat Active Header */}
              <div className="px-5 py-3 border-b border-slate-200 bg-white flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="md:hidden p-1.5 rounded-lg text-slate-600 hover:bg-slate-100"
                  >
                    ←
                  </button>
                  <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-sm">
                    {selectedUser.fullName?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">{selectedUser.fullName}</h3>
                    <p className="text-[11px] text-slate-500 capitalize">
                      {selectedUser.role} • {selectedUser.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages Scroll Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loadingMessages ? (
                  <div className="text-center py-8 text-xs text-slate-400">Loading chat history...</div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <p className="text-xs">No messages yet with {selectedUser.fullName}.</p>
                    <p className="text-[11px] mt-1 text-indigo-600">Send a greeting to start chatting!</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const senderId = (msg.sender?._id || msg.sender?.id || msg.sender)?.toString();
                    const isMe = Boolean(currentUserId && senderId === currentUserId);

                    return (
                      <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-3 text-sm shadow-sm transition ${
                            isMe
                              ? 'bg-indigo-600 text-white rounded-br-none'
                              : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
                          }`}
                        >
                          <p className="break-words leading-relaxed whitespace-pre-wrap">{msg.text}</p>

                          {/* Message Footer: Timestamp and Read/Delivered status for sender only */}
                          <div
                            className={`mt-2 pt-1 border-t flex items-center justify-between gap-3 ${
                              isMe ? 'border-indigo-500/50 text-indigo-100' : 'border-slate-100 text-slate-400'
                            }`}
                          >
                            <span className="text-[10px]">
                              {new Date(msg.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>

                            {/* Status: ONLY for sender (isMe). Recipient has no ticks/badges! */}
                            {isMe && (
                              msg.read ? (
                                <span
                                  className="inline-flex items-center gap-1 font-bold text-[10px] px-2 py-0.5 rounded-full shadow-xs bg-emerald-500 text-white"
                                  title={
                                    msg.readAt
                                      ? `ተነቧል በ ${new Date(msg.readAt).toLocaleTimeString([], {
                                          hour: '2-digit',
                                          minute: '2-digit',
                                        })}`
                                      : 'ተነቧል (Read)'
                                  }
                                >
                                  <span>✓✓</span>
                                  <span>ተነቧል</span>
                                </span>
                              ) : (
                                <span
                                  className="inline-flex items-center gap-1 font-semibold text-[10px] px-2 py-0.5 rounded-full bg-indigo-700/60 text-indigo-100 border border-indigo-400/30"
                                  title="ደርሷል ግን እስካሁን አልተነበበም (Delivered)"
                                >
                                  <span className="font-bold">✓</span>
                                  <span>ደርሷል</span>
                                </span>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Field */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-200 bg-white flex gap-2">
                <input
                  type="text"
                  placeholder={`Write a message to ${selectedUser.fullName}...`}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 px-4 py-2.5 text-sm bg-slate-100 rounded-xl border border-transparent focus:outline-none focus:bg-white focus:border-indigo-500"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sending}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-xl font-medium text-sm transition shadow-sm"
                >
                  {sending ? '...' : 'Send'}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center p-8 text-slate-400 my-auto">
              <span className="text-4xl block mb-2">💬</span>
              <p className="text-sm font-semibold text-slate-600">Select a conversation or start a new chat</p>
              <p className="text-xs mt-1">Communicate securely regarding student progress, assignments & updates.</p>
            </div>
          )}
        </div>
      </div>

      {/* New Chat Modal */}
      {showNewChatModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-800">
                Start Chat with a {user?.role === 'parent' ? 'Teacher' : 'Parent'}
              </h3>
              <button
                onClick={() => setShowNewChatModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg"
              >
                ✕
              </button>
            </div>

            <div className="mb-4">
              <input
                type="text"
                placeholder="Search by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-100 rounded-lg border-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
              {filteredContacts.length === 0 ? (
                <p className="py-6 text-center text-xs text-slate-400">No contacts found</p>
              ) : (
                filteredContacts.map((contact) => (
                  <button
                    key={getUserId(contact) || Math.random()}
                    onClick={() => {
                      setSelectedUser(contact);
                      setShowNewChatModal(false);
                    }}
                    className="w-full text-left p-3 hover:bg-indigo-50 rounded-xl transition flex items-center gap-3"
                  >
                    <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-sm">
                      {contact.fullName?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{contact.fullName}</p>
                      <p className="text-xs text-slate-500 capitalize">
                        {contact.role} • {contact.email}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
