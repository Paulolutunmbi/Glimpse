import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import Navbar from '../components/Navbar';
import { messageService, searchService } from '../services/apiService';
import { useUser } from '../context/UserContext.jsx';
import { socket } from '../socket';
import Avatar from '../components/Avatar';

const formatTime = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const getDayKey = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toDateString();
};

const formatDayLabel = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const messageDay = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const diffDays = Math.round((startOfToday - messageDay) / 86400000);

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays >= 2 && diffDays <= 6) {
    return date.toLocaleDateString([], { weekday: 'long' });
  }

  return date.toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

export default function Messages() {
  const { user, refreshCounts } = useUser();
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const currentUserId = user?.id || user?._id || null;

  const loadConversations = useCallback(async () => {
    try {
      const response = await messageService.getConversations();
      const list = Array.isArray(response?.data) ? response.data : [];
      setConversations(list);
      if (!activeConversation && list.length > 0) {
        setActiveConversation(list[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [activeConversation]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    const handleConversationUpdated = () => {
      loadConversations();
    };

    socket.on('conversation:updated', handleConversationUpdated);
    return () => socket.off('conversation:updated', handleConversationUpdated);
  }, [loadConversations]);

  useEffect(() => {
    if (!activeConversation?._id) return;
    const conversationId = activeConversation._id;
    socket.emit('joinConversation', conversationId);

    const loadMessages = async () => {
      try {
        const response = await messageService.getMessages({ conversationId, limit: 40 });
        const list = Array.isArray(response?.data) ? response.data : [];
        setMessages(list.reverse());
        await messageService.markConversationRead(conversationId);
        refreshCounts();
      } catch (err) {
        console.error(err);
      }
    };

    loadMessages();

    const handleMessageCreated = (payload) => {
      const incoming = payload?.message || payload;
      if (!incoming) return;
      if (payload?.conversationId && payload.conversationId !== conversationId) return;
      setMessages((prev) => [...prev, incoming]);
      refreshCounts();
    };

    socket.on('message:created', handleMessageCreated);

    return () => {
      socket.emit('leaveConversation', conversationId);
      socket.off('message:created', handleMessageCreated);
    };
  }, [activeConversation, refreshCounts]);

  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        const response = await searchService.search({ query, limit: 5 });
        setSearchResults(Array.isArray(response?.users) ? response.users : []);
      } catch (err) {
        console.error(err);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]);

  const handleStartConversation = async (targetId) => {
    try {
      const response = await messageService.createConversation(targetId);
      const conversation = response?.data;
      if (!conversation) return;
      setConversations((prev) => {
        const exists = prev.some((item) => String(item._id) === String(conversation._id));
        if (exists) return prev;
        return [conversation, ...prev];
      });
      setActiveConversation(conversation);
      setQuery('');
      setSearchResults([]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || !activeConversation?._id) return;
    setText('');
    try {
      const response = await messageService.sendMessage({
        conversationId: activeConversation._id,
        text: trimmed,
      });
      const message = response?.data;
      if (message) {
        setMessages((prev) => [...prev, message]);
      }
      loadConversations();
      refreshCounts();
    } catch (err) {
      console.error(err);
    }
  };

  const getOtherParticipant = useCallback(
    (conversation) => {
      if (!conversation?.participants) return null;
      return conversation.participants.find((p) => String(p._id) !== String(currentUserId));
    },
    [currentUserId]
  );

  const activePartner = useMemo(
    () => getOtherParticipant(activeConversation),
    [activeConversation, getOtherParticipant]
  );

  return (
    <div className="min-h-screen bg-background text-on-background font-body-md">
      <Navbar currentUser={user} />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 pb-safe md:flex-row md:px-8">
        <section className="w-full md:w-72">
          <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-4">
            <h2 className="mb-3 text-sm font-semibold text-on-surface">Messages</h2>
            <input
              className="w-full rounded-full border border-outline-variant bg-white px-4 py-2 text-xs"
              placeholder="Start a new message"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            {searchResults.length > 0 ? (
              <div className="mt-3 space-y-2">
                {searchResults.map((result) => (
                  <button
                    key={result._id || result.id}
                    className="flex w-full items-center gap-3 rounded-xl border border-outline-variant/30 bg-white px-3 py-2 text-left text-xs transition-colors hover:bg-surface-container-lowest focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container/30 active:scale-[0.99]"
                    type="button"
                    onClick={() => handleStartConversation(result._id || result.id)}
                  >
                    <Avatar
                      src={result.profile?.avatar || result.profilePicture || result.avatar}
                      name={result.username || result.name}
                      alt={result.username || 'User'}
                      className="h-8 w-8"
                    />
                    <div>
                      <p className="font-semibold text-on-surface">{result.username || result.name}</p>
                      <p className="text-[10px] text-on-surface-variant">{result.fullName || result.name}</p>
                    </div>
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="mt-4 flex flex-col gap-2">
            {loading ? (
              <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-4 text-xs">
                Loading conversations...
              </div>
            ) : null}
            {conversations.map((conversation) => {
              const partner = getOtherParticipant(conversation);
              const isActive = activeConversation?._id === conversation._id;
              return (
                <button
                  key={conversation._id}
                  className={`flex items-center gap-3 rounded-xl border px-3 py-3 text-left transition ${
                    isActive
                      ? 'border-primary-container bg-white shadow-sm'
                      : 'border-outline-variant/30 bg-surface-container-lowest'
                  }`}
                  type="button"
                  onClick={() => setActiveConversation(conversation)}
                >
                  <Avatar
                    src={partner?.profile?.avatar || partner?.profilePicture || partner?.avatar}
                    name={partner?.username || partner?.name}
                    alt={partner?.username || 'User'}
                    className="h-10 w-10"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-on-surface">{partner?.username || 'User'}</p>
                    <p className="text-xs text-on-surface-variant">{conversation.lastMessageText || 'New conversation'}</p>
                  </div>
                  {conversation.unreadCount ? (
                    <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[10px] text-white">
                      {conversation.unreadCount}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </section>

        <section className="flex-1 rounded-2xl border border-outline-variant/30 bg-white px-4 py-4">
          <div className="flex items-center gap-3 border-b border-outline-variant/30 pb-3">
            <Avatar
              src={activePartner?.profile?.avatar || activePartner?.profilePicture || activePartner?.avatar}
              name={activePartner?.username || activePartner?.name}
              alt={activePartner?.username || 'User'}
              className="h-10 w-10"
            />
            <div>
              <p className="text-sm font-semibold text-on-surface">{activePartner?.username || 'Select a chat'}</p>
              <p className="text-xs text-on-surface-variant">{activePartner?.fullName || ''}</p>
            </div>
          </div>

          <div className="mt-4 flex h-[55vh] flex-col gap-3 overflow-y-auto pr-2">
            {messages.map((message, index) => {
              const isMine = String(message.sender?._id || message.sender) === String(currentUserId);
              const currentDayKey = getDayKey(message.createdAt);
              const previousDayKey = index > 0 ? getDayKey(messages[index - 1].createdAt) : null;
              return (
                <Fragment key={message._id}>
                  {currentDayKey && currentDayKey !== previousDayKey ? (
                    <div className="flex justify-center py-1">
                      <span className="rounded-full bg-surface-container-lowest px-3 py-1 text-[11px] font-semibold text-on-surface-variant">
                        {formatDayLabel(message.createdAt)}
                      </span>
                    </div>
                  ) : null}
                  <div
                    className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-2 text-sm ${
                        isMine ? 'bg-rose-500 text-white' : 'bg-surface-container-lowest text-on-surface'
                      }`}
                    >
                      <p>{message.text}</p>
                      <span className="mt-1 block text-[10px] opacity-70">{formatTime(message.createdAt)}</span>
                    </div>
                  </div>
                </Fragment>
              );
            })}
          </div>

          <div className="mt-4 flex items-center gap-2">
            <input
              className="flex-1 rounded-full border border-outline-variant px-4 py-2 text-sm transition-colors focus:border-primary-container focus:outline-none focus:ring-2 focus:ring-primary-container/20"
              placeholder="Write a message"
              value={text}
              onChange={(event) => setText(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  handleSend();
                }
              }}
              disabled={!activeConversation}
            />
            <button
              className="rounded-full bg-primary-container px-4 py-2 text-sm text-white transition-colors hover:bg-primary active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
              type="button"
              onClick={handleSend}
              disabled={!activeConversation}
            >
              Send
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
