import { useState, useEffect, useRef } from 'react';
import API from '../services/api';
import { useAuth } from '../context/useAuth';

export default function ChatHub({ title = 'Communication Hub' }) {
  const { user } = useAuth();
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

  // Load conversations
  const fetchConversations = async () => {
    try {
      const res = await API.get('/messages/conversations');
      if (res.data?.success) {
        setConversations(res.data.data);
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
        setContacts(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching contacts:', err);
    }
  };

  // Load message history with selected user
  const fetchMessages = async (otherUserId) => {
    try {
      const res = await API.get(`/messages/history/${otherUserId}`);
      if (res.data?.success) {
        setMessages(res.data.data);
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
    if (!selectedUser?._id) return;
    setLoadingMessages(true);
    fetchMessages(selectedUser._id);

    const interval = setInterval(() => {
      fetchMessages(selectedUser._id);
      fetchConversations();
    }, 4000);

    return () => clearInterval(interval);
  }, [selectedUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser?._id || sending) return;

    const messageText = newMessage.trim();
    setNewMessage('');
    setSending(true);

    try {
      const res = await API.post('/messages', {
        recipientId: selectedUser._id,
        text: messageText
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

  const filteredConversations = conversations.filter((c) =>
    c.user?.fullName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredContacts = contacts.filter((c) =>
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
              ? 'Direct, secure communication with your child’s teachers'
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
        {/* Left: Conversations List (Hidden on mobile if user selected) */}
        <div
          className={`w-full md:w-80 lg:w-96 border-r border-slate-200 flex flex-col bg-slate-50/50 ${
            selectedUser ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Search bar */}
          <div className="p-3 border-b border-slate-200 bg-white">
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-100 rounded-lg border-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Conversation list */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {loadingConv ? (
              <div className="p-6 text-center text-xs text-slate-400">Loading conversations...</div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-sm font-medium text-slate-600 mb-1">No conversations yet</p>
                <p className="text-xs text-slate-400 mb-4">Start a conversation with a teacher or parent</p>
                <button
                  onClick={() => setShowNewChatModal(true)}
                  className="text-xs bg-indigo-50 text-indigo-600 font-semibold px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition"
                >
                  Start New Chat
                </button>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isSelected = selectedUser?._id === conv.user?._id;
                return (
                  <button
                    key={conv.user?._id}
                    onClick={() => setSelectedUser(conv.user)}
                    className={`w-full text-left p-3.5 flex items-start gap-3 transition ${
                      isSelected ? 'bg-indigo-50/80 border-r-4 border-indigo-600' : 'hover:bg-slate-100/70'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0">
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
                                minute: '2-digit'
                              })
                            : ''}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate">
                        {conv.lastMessage?.text || 'No messages'}
                      </p>
                      <span className="inline-block mt-1 text-[10px] font-medium uppercase px-1.5 py-0.5 rounded bg-slate-200 text-slate-600">
                        {conv.user?.role}
                      </span>
                    </div>
                    {conv.unreadCount > 0 && (
                      <span className="shrink-0 bg-indigo-600 text-white text-[11px] font-bold px-1.5 py-0.5 rounded-full">
                        {conv.unreadCount}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Message Window (Full screen on mobile if user selected) */}
        <div
          className={`flex-1 flex flex-col bg-white ${
            !selectedUser ? 'hidden md:flex items-center justify-center' : 'flex'
          }`}
        >
          {selectedUser ? (
            <>
              {/* Chat Header */}
              <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="md:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 transition"
                  >
                    ←
                  </button>
                  <div className="w-9 h-9 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-sm">
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

              {/* Message List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/30">
                {loadingMessages ? (
                  <div className="text-center py-10 text-xs text-slate-400">Loading conversation...</div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-sm text-slate-500 font-medium">No messages yet</p>
                    <p className="text-xs text-slate-400 mt-1">Send a greeting to start chatting!</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.sender?._id === user?._id || msg.sender === user?._id;
                    return (
                      <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-[80%] md:max-w-[70%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                            isMe
                              ? 'bg-indigo-600 text-white rounded-br-none'
                              : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
                          }`}
                        >
                          <p className="break-words leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                          <div
                            className={`text-[10px] mt-1 text-right flex items-center justify-end gap-1 ${
                              isMe ? 'text-indigo-200' : 'text-slate-400'
                            }`}
                          >
                            <span>
                              {new Date(msg.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                            {isMe && <span>{msg.read ? '✓✓' : '✓'}</span>}
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
            <div className="text-center p-8 text-slate-400">
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
                    key={contact._id}
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
                      <p className="text-xs text-slate-500 capitalize">{contact.role} • {contact.email}</p>
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
