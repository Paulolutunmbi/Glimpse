import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { messageService, searchService } from '../services/apiService';
import { useUser } from '../context/UserContext.jsx';
import { socket } from '../socket';
import Avatar from '../components/Avatar';
import CreateGroupModal from '../components/CreateGroupModal';

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
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const currentUserId = user?.id || user?._id || null;

  const appendMessage = useCallback((incoming) => {
    if (!incoming) return;
    const incomingId = incoming?._id || incoming?.id;
    setMessages((prev) => {
      if (!incomingId) return [...prev, incoming];
      if (prev.some((item) => String(item._id || item.id) === String(incomingId))) return prev;
      return [...prev, incoming];
    });
  }, []);

  const loadConversations = useCallback(async () => {
    try {
      const response = await messageService.getConversations();
      const list = Array.isArray(response?.data) ? response.data : [];
      setConversations(list);
      setActiveConversation((current) => current || (list.length > 0 ? list[0] : null));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    const handleConversationUpdated = () => {
      loadConversations();
    };

    socket.on('conversation:updated', handleConversationUpdated);
    socket.on('group:updated', handleConversationUpdated);
    return () => {
      socket.off('conversation:updated', handleConversationUpdated);
      socket.off('group:updated', handleConversationUpdated);
    };
  }, [loadConversations]);

  useEffect(() => {
    if (!activeConversation?._id) return;
    const conversationId = activeConversation._id;
    if (activeConversation.isGroup) {
      socket.emit('joinGroupChat', conversationId);
    } else {
      socket.emit('joinConversation', conversationId);
    }

    const loadMessages = async () => {
      try {
        const response = await messageService.getMessages({ conversationId, limit: 40 });
        const list = Array.isArray(response?.data) ? response.data : [];
        const seen = new Set();
        const deduped = [];
        list.reverse().forEach((msg) => {
          const msgId = msg?._id || msg?.id;
          if (!msgId) {
            deduped.push(msg);
            return;
          }
          const key = String(msgId);
          if (seen.has(key)) return;
          seen.add(key);
          deduped.push(msg);
        });
        setMessages(deduped);
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
      appendMessage(incoming);
      refreshCounts();
    };

    socket.on('message:created', handleMessageCreated);

    return () => {
      if (activeConversation.isGroup) {
        socket.emit('leaveGroupChat', conversationId);
      } else {
        socket.emit('leaveConversation', conversationId);
      }
      socket.off('message:created', handleMessageCreated);
    };
  }, [activeConversation, appendMessage, refreshCounts]);

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

  const handleOpenGroup = (groupId) => {
    navigate(`/messages/group/${groupId}`);
  };

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || !activeConversation?._id || isSending) return;
    setIsSending(true);
    setSendError('');
    setText('');
    try {
      const response = await messageService.sendMessage({
        conversationId: activeConversation._id,
        text: trimmed,
      });
      const message = response?.data;
      if (message) {
        appendMessage(message);
      }
      loadConversations();
      refreshCounts();
    } catch (err) {
      console.error(err);
      setSendError(err?.response?.data?.error || 'Failed to send message.');
      setText(trimmed);
    } finally {
      setIsSending(false);
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
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 pb-[calc(env(safe-area-inset-bottom)+6rem)] md:flex-row md:px-8 md:pb-safe min-h-[calc(100dvh-4rem)]">
        <section className={`w-full md:w-72 flex flex-col h-[calc(100dvh-6rem)] min-h-0 ${activeConversation ? 'hidden md:flex' : 'flex'}`}>
          <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-4 flex-shrink-0">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-on-surface">Messages</h2>
              <button
                onClick={() => setShowCreateGroup(true)}
                className="p-1.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                title="Create Group Chat"
              >
                <span className="material-symbols-outlined text-[18px]">group_add</span>
              </button>
            </div>
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

          <div className="mt-4 flex flex-col gap-2 flex-1 overflow-y-auto min-h-0 pr-1">
            {loading ? (
              <div className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-4 text-xs">
                Loading conversations...
              </div>
            ) : null}
            {conversations.map((conversation) => {
              const isGroup = Boolean(conversation.isGroup);
              const partner = isGroup ? conversation : getOtherParticipant(conversation);
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
                  onClick={() => {
                    if (isGroup) handleOpenGroup(conversation._id);
                    else setActiveConversation(conversation);
                  }}
                >
                  <Avatar
                    src={partner?.profile?.avatar || partner?.profilePicture || partner?.avatar}
                    name={partner?.username || partner?.name || conversation.name}
                    alt={partner?.username || 'User'}
                    className="h-10 w-10"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-on-surface">{isGroup ? conversation.name : partner?.username || 'User'}</p>
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

        <section className={`flex-1 rounded-2xl border border-outline-variant/30 bg-white px-4 py-4 flex flex-col h-[calc(100dvh-6rem)] min-h-0 overflow-hidden ${!activeConversation ? 'hidden md:flex' : 'flex'}`}>
          <div className="flex items-center gap-3 border-b border-outline-variant/30 pb-3 flex-shrink-0">
            {activeConversation && (
              <button
                onClick={() => setActiveConversation(null)}
                className="md:hidden p-2 -ml-2 rounded-full hover:bg-surface-container transition-colors text-on-surface"
              >
                <span className="material-symbols-outlined">arrow_back</span>
              </button>
            )}
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

          <div className="mt-4 flex-1 flex flex-col gap-3 overflow-y-auto pr-2 min-h-0">
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

          <div className="mt-4 flex items-center gap-2 flex-shrink-0 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
            <input
              className="flex-1 rounded-full border-2 border-transparent bg-surface-container px-4 py-2 text-sm transition-all duration-200 focus:border-primary-container focus:outline-none focus:ring-2 focus:ring-primary-container/20 focus:bg-white"
              placeholder="Write a message"
              value={text}
              onChange={(event) => setText(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  handleSend();
                }
              }}
              disabled={!activeConversation || isSending}
            />
            <button
              className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-container text-white transition-all duration-200 hover:bg-primary hover:shadow-md active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-primary-container/30"
              type="button"
              onClick={handleSend}
              disabled={!activeConversation || isSending || !text.trim()}
              aria-label="Send message"
            >
              <span className="material-symbols-outlined text-[20px]">
                {isSending ? 'progress_activity' : 'send'}
              </span>
            </button>
          </div>
          {sendError ? (
            <p className="mt-2 text-xs font-semibold text-error">{sendError}</p>
          ) : null}
        </section>
      </main>

      {showCreateGroup && (
        <CreateGroupModal
          onClose={() => setShowCreateGroup(false)}
          onGroupCreated={(group) => {
            setConversations((prev) => [group, ...prev]);
            handleOpenGroup(group._id);
          }}
        />
      )}
    </div>
  );
}
